'use client';

import React, { useState, useRef } from 'react';
import { Download, Upload, X, Loader2, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { exportProjectsToCSV, parseCSVToProjects } from '@/lib/csv';
import { createProject, getProjects } from '@/lib/api/projects';
import { useToast } from './Toast';

export default function CSVModal({ isOpen, onClose, projects = [], onImportComplete }) {
  const { success, error } = useToast();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'import'
  const [csvContent, setCsvContent] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(null);

  if (!isOpen) return null;

  // Handle CSV Download
  const handleDownloadCSV = () => {
    try {
      const csvString = exportProjectsToCSV(projects);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `arhastudio_projects_backup_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('CSV backup file downloaded successfully');
      onClose();
    } catch (err) {
      error('Failed to export CSV: ' + err.message);
    }
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvContent(text);
        const { validProjects, errors: parseErrors } = parseCSVToProjects(text);
        setParsedData(validProjects);
        setImportErrors(parseErrors);
      }
    };
    reader.readAsText(file);
  };

  // Run the batch import
  const handleExecuteImport = async () => {
    if (!parsedData || parsedData.length === 0) {
      error('No valid projects to import');
      return;
    }

    setIsProcessing(true);
    let importedCount = 0;
    const failedItems = [];

    // Check existing projects to prevent conflicts
    const { data: existing = [] } = await getProjects();
    const existingNumbers = new Set(existing.map((p) => p.video_number));

    for (let i = 0; i < parsedData.length; i++) {
      const item = parsedData[i];
      setImportProgress({ current: i + 1, total: parsedData.length });

      if (existingNumbers.has(item.video_number)) {
        failedItems.push(`Video #${item.video_number}: Already exists in your database`);
        continue;
      }

      const res = await createProject(item);
      if (res.error) {
        failedItems.push(`Video #${item.video_number}: ${res.error}`);
      } else {
        importedCount++;
        existingNumbers.add(item.video_number);
      }
    }

    setIsProcessing(false);
    setImportProgress(null);

    if (importedCount > 0) {
      success(`Successfully imported ${importedCount} projects into library!`);
      onImportComplete?.();
    }

    if (failedItems.length > 0) {
      setImportErrors((prev) => [...prev, ...failedItems]);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292825]/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-modal border border-[#DEDAD2] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ECEAE4] bg-[#FAF8F5]">
          <div>
            <h3 className="text-lg font-bold text-[#292825] tracking-tight">
              Project Data Backup & Import
            </h3>
            <p className="text-xs text-[#77746D]">
              Safely export or import your library records in standard CSV format
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#ECEAE4] px-6">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-[#C96442] text-[#C96442]'
                : 'border-transparent text-[#77746D] hover:text-[#292825]'
            }`}
          >
            Export Backup (CSV)
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-[#C96442] text-[#C96442]'
                : 'border-transparent text-[#77746D] hover:text-[#292825]'
            }`}
          >
            Import from CSV
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <p className="text-sm text-[#77746D] leading-relaxed">
                Download a complete, offline-accessible CSV backup of all{' '}
                <span className="font-semibold text-[#292825]">{projects.length}</span> projects
                currently in your library.
              </p>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#ECEAE4] space-y-2 text-xs text-[#77746D]">
                <div className="font-semibold text-[#292825]">Includes columns:</div>
                <div className="font-mono text-[11px] text-[#292825]/80">
                  video_number, title, description, video_url, category, tags, created_at
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#DEDAD2] text-sm font-medium text-[#292825] hover:bg-[#ECEAE4]"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C96442] text-white text-sm font-semibold hover:bg-[#B85535] shadow-subtle"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup ({projects.length} Projects)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[#77746D] leading-relaxed">
                Upload a CSV file containing your video projects. The system will validate every row
                and protect against duplicate video numbers.
              </p>

              {/* File upload input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#DEDAD2] hover:border-[#C96442] rounded-2xl p-6 text-center cursor-pointer bg-[#FAF8F5] transition-colors"
              >
                <Upload className="w-8 h-8 text-[#C96442] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#292825]">
                  Click to choose CSV file
                </p>
                <p className="text-xs text-[#77746D] mt-1">
                  Required columns: video_number, title, video_url
                </p>
              </div>

              {parsedData && (
                <div className="p-3.5 rounded-xl bg-[#F7EBE6] text-[#C96442] text-xs font-semibold flex items-center justify-between">
                  <span>Ready to import {parsedData.length} valid projects</span>
                  {importProgress && (
                    <span className="font-mono">
                      {importProgress.current} / {importProgress.total}
                    </span>
                  )}
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#FDF6F5] border border-[#F8D8CF] text-xs space-y-1 max-h-36 overflow-y-auto">
                  <div className="font-semibold text-[#B85535] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>CSV Validation Warnings ({importErrors.length}):</span>
                  </div>
                  {importErrors.map((err, i) => (
                    <div key={i} className="text-[#B85535]/90 pl-5">
                      • {err}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl border border-[#DEDAD2] text-sm font-medium text-[#292825] hover:bg-[#ECEAE4]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={!parsedData || parsedData.length === 0 || isProcessing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C96442] text-white text-sm font-semibold hover:bg-[#B85535] shadow-subtle disabled:opacity-50"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Execute Import</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
