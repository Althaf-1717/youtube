import { createClient } from '@/lib/supabase/client';
import { isValidUrl, parseVideoNumber } from '@/lib/utils';

/**
 * Fetch projects with search, section filtering, and sorting
 * @param {Object} options
 * @param {string} [options.searchQuery='']
 * @param {boolean} [options.exactNumber=false]
 * @param {string} [options.sortBy='video_number_asc']
 * @param {string} [options.videoType='all'] - 'all' | 'shorts' | 'long'
 */
export async function getProjects({
  searchQuery = '',
  exactNumber = false,
  sortBy = 'video_number_asc',
  videoType = 'all',
} = {}) {
  const supabase = createClient();

  if (!supabase) {
    return {
      data: [],
      error: 'Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    };
  }

  // Attempt query with video_type and project_date
  let query = supabase
    .from('projects')
    .select('id, video_number, title, video_url, video_type, project_date, created_at, updated_at');

  // Exact or partial search
  const trimmed = searchQuery.trim();
  if (trimmed) {
    const parsedNum = parseVideoNumber(trimmed);

    if (exactNumber && parsedNum) {
      query = query.eq('video_number', parsedNum);
    } else if (parsedNum) {
      query = query.or(`video_number.eq.${parsedNum},title.ilike.%${trimmed}%`);
    } else {
      query = query.ilike('title', `%${trimmed}%`);
    }
  }

  // Section / Type filtering
  if (videoType === 'shorts') {
    // Include explicit 'shorts' OR null/empty (existing 8 videos without video_type set yet)
    query = query.or('video_type.eq.shorts,video_type.is.null');
  } else if (videoType === 'long') {
    query = query.eq('video_type', 'long');
  }

  // Sorting
  switch (sortBy) {
    case 'video_number_desc':
      query = query.order('video_number', { ascending: false });
      break;
    case 'recent_added':
      query = query.order('created_at', { ascending: false });
      break;
    case 'recent_updated':
      query = query.order('updated_at', { ascending: false });
      break;
    case 'title_asc':
      query = query.order('title', { ascending: true });
      break;
    case 'date_desc':
      query = query.order('project_date', { ascending: false });
      break;
    case 'video_number_asc':
    default:
      query = query.order('video_number', { ascending: true });
      break;
  }

  let { data, error } = await query;

  // Fallback: If error indicates missing column in schema cache (before ALTER TABLE is run)
  if (error && (error.message?.includes('video_type') || error.message?.includes('project_date'))) {
    console.warn('Schema cache notice: retrying select without new columns...', error.message);
    let fallbackQuery = supabase
      .from('projects')
      .select('id, video_number, title, video_url, created_at, updated_at');

    if (trimmed) {
      const parsedNum = parseVideoNumber(trimmed);
      if (exactNumber && parsedNum) {
        fallbackQuery = fallbackQuery.eq('video_number', parsedNum);
      } else if (parsedNum) {
        fallbackQuery = fallbackQuery.or(`video_number.eq.${parsedNum},title.ilike.%${trimmed}%`);
      } else {
        fallbackQuery = fallbackQuery.ilike('title', `%${trimmed}%`);
      }
    }

    fallbackQuery = fallbackQuery.order('video_number', { ascending: sortBy !== 'video_number_desc' });
    const fallbackRes = await fallbackQuery;
    if (!fallbackRes.error && fallbackRes.data) {
      // Map rows: treat all as 'shorts' by default
      const mapped = fallbackRes.data.map((item) => ({
        ...item,
        video_type: 'shorts',
        project_date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      }));
      // Apply videoType filter in memory
      const filtered = videoType === 'long' ? [] : mapped;
      return { data: filtered, error: null };
    }
  }

  // Normalize returned data so that null video_type becomes 'shorts' (for the 8 existing videos)
  const normalized = (data || []).map((p) => ({
    ...p,
    video_type: p.video_type || 'shorts',
    project_date: p.project_date || (p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
  }));

  return { data: normalized, error: error?.message || null };
}

/**
 * Fetch statistics for dashboard cards
 */
export async function getDashboardStats() {
  const supabase = createClient();
  if (!supabase) {
    return {
      totalProjects: 0,
      totalShorts: 0,
      totalLong: 0,
      latestVideoNumber: 0,
      recentlyUpdatedCount: 0,
      validLinksCount: 0,
      recentlyAdded: [],
      recentlyUpdated: [],
      error: 'Supabase not configured',
    };
  }

  try {
    let { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('id, video_number, title, video_url, video_type, project_date, created_at, updated_at')
      .order('video_number', { ascending: true });

    if (allError && (allError.message?.includes('video_type') || allError.message?.includes('project_date'))) {
      const fallback = await supabase
        .from('projects')
        .select('id, video_number, title, video_url, created_at, updated_at')
        .order('video_number', { ascending: true });
      if (fallback.error) throw fallback.error;
      allProjects = (fallback.data || []).map((p) => ({
        ...p,
        video_type: 'shorts',
        project_date: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      }));
    } else if (allError) {
      throw allError;
    }

    const projects = (allProjects || []).map((p) => ({
      ...p,
      video_type: p.video_type || 'shorts',
      project_date: p.project_date || (p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    }));

    const totalProjects = projects.length;
    const totalShorts = projects.filter((p) => p.video_type === 'shorts').length;
    const totalLong = projects.filter((p) => p.video_type === 'long').length;

    const latestVideoNumber = projects.reduce(
      (max, p) => (p.video_number > max ? p.video_number : max),
      0
    );

    const latestShortsNumber = projects
      .filter((p) => p.video_type === 'shorts')
      .reduce((max, p) => (p.video_number > max ? p.video_number : max), 0);

    const latestLongNumber = projects
      .filter((p) => p.video_type === 'long')
      .reduce((max, p) => (p.video_number > max ? p.video_number : max), 0);

    const validLinksCount = projects.filter((p) => isValidUrl(p.video_url)).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyUpdatedCount = projects.filter(
      (p) => new Date(p.updated_at) >= sevenDaysAgo
    ).length;

    const recentlyAdded = [...projects]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    const recentlyUpdated = [...projects]
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5);

    return {
      totalProjects,
      totalShorts,
      totalLong,
      latestVideoNumber,
      latestShortsNumber,
      latestLongNumber,
      recentlyUpdatedCount,
      validLinksCount,
      recentlyAdded,
      recentlyUpdated,
      allProjects: projects,
      error: null,
    };
  } catch (err) {
    return {
      totalProjects: 0,
      totalShorts: 0,
      totalLong: 0,
      latestVideoNumber: 0,
      latestShortsNumber: 0,
      latestLongNumber: 0,
      recentlyUpdatedCount: 0,
      validLinksCount: 0,
      recentlyAdded: [],
      recentlyUpdated: [],
      allProjects: [],
      error: err.message,
    };
  }
}

/**
 * Check if video number is unique within its section (Shorts vs Long Videos)
 * @param {number|string} videoNumber
 * @param {string} [videoType='shorts'] - 'shorts' | 'long'
 * @param {string|null} [currentProjectId=null]
 */
export async function checkVideoNumberAvailable(videoNumber, videoType = 'shorts', currentProjectId = null) {
  const supabase = createClient();
  if (!supabase) return { available: true };

  const parsedNumber = parseVideoNumber(videoNumber);
  if (!parsedNumber || parsedNumber <= 0) {
    return { available: false, error: 'Must be a positive integer or format like Video 1.' };
  }

  const resolvedType = videoType === 'long' ? 'long' : 'shorts';

  let query = supabase
    .from('projects')
    .select('id, video_number, video_type, title')
    .eq('video_number', parsedNumber);

  if (resolvedType === 'long') {
    query = query.eq('video_type', 'long');
  } else {
    query = query.or('video_type.eq.shorts,video_type.is.null');
  }

  if (currentProjectId) {
    query = query.neq('id', currentProjectId);
  }

  const { data, error } = await query;
  if (error) {
    return { available: false, error: error.message };
  }

  const conflict = data && data.length > 0;
  return {
    available: !conflict,
    conflictingProject: conflict ? data[0] : null,
    error: conflict
      ? `Video ${parsedNumber} already exists in ${resolvedType === 'shorts' ? 'Shorts' : 'Long Videos'}.`
      : null,
  };
}

/**
 * Create a new project
 * @param {Object} projectData
 * @param {number|string} projectData.video_number
 * @param {string} projectData.title
 * @param {string} projectData.video_url
 * @param {string} [projectData.video_type='shorts'] - 'shorts' | 'long'
 * @param {string} [projectData.project_date] - 'YYYY-MM-DD', defaults to today
 */
export async function createProject(projectData) {
  const supabase = createClient();
  if (!supabase) {
    return { data: null, error: 'Database connection is not configured.' };
  }

  const parsedNum = parseVideoNumber(projectData.video_number);
  if (!parsedNum) {
    return {
      data: null,
      error: 'Please enter a valid video number (e.g. 1, 2, or Video 10).',
    };
  }

  const videoType = projectData.video_type === 'long' ? 'long' : 'shorts';

  // Pre-validate video_number uniqueness within this video_type
  const { available, error: uniqueErr } = await checkVideoNumberAvailable(parsedNum, videoType);
  if (!available) {
    return {
      data: null,
      error: uniqueErr || `Video ${parsedNum} already exists in ${videoType === 'shorts' ? 'Shorts' : 'Long Videos'}.`,
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const projectDate = projectData.project_date ? projectData.project_date.trim() : todayStr;

  const payload = {
    video_number: parsedNum,
    title: projectData.title.trim(),
    video_url: projectData.video_url.trim(),
    video_type: videoType,
    project_date: projectDate || todayStr,
    description: '',
    tags: [],
  };

  let { data, error } = await supabase
    .from('projects')
    .insert([payload])
    .select()
    .single();

  // If column does not exist yet in table, fallback to basic payload
  if (error && (error.message?.includes('video_type') || error.message?.includes('project_date'))) {
    console.warn('Fallback inserting without video_type / project_date column');
    const basicPayload = {
      video_number: parsedNum,
      title: projectData.title.trim(),
      video_url: projectData.video_url.trim(),
      description: '',
      tags: [],
    };
    const retry = await supabase.from('projects').insert([basicPayload]).select().single();
    if (retry.error) {
      return { data: null, error: retry.error.message };
    }
    return {
      data: {
        ...retry.data,
        video_type: videoType,
        project_date: projectDate || todayStr,
      },
      error: null,
    };
  }

  if (error) {
    if (error.code === '23505') {
      return {
        data: null,
        error: `Video ${payload.video_number} is already taken. Please choose another number.`,
      };
    }
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Update an existing project
 */
export async function updateProject(id, projectData) {
  const supabase = createClient();
  if (!supabase) {
    return { data: null, error: 'Database connection is not configured.' };
  }

  const parsedNum = parseVideoNumber(projectData.video_number);
  if (!parsedNum) {
    return {
      data: null,
      error: 'Please enter a valid video number (e.g. 1, 2, or Video 10).',
    };
  }

  const videoType = projectData.video_type === 'long' ? 'long' : 'shorts';

  // Check unique video number within this videoType if changing
  const { available, error: uniqueErr } = await checkVideoNumberAvailable(parsedNum, videoType, id);
  if (!available) {
    return {
      data: null,
      error: uniqueErr || `Video ${parsedNum} is already taken in ${videoType === 'shorts' ? 'Shorts' : 'Long Videos'}.`,
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const projectDate = projectData.project_date ? projectData.project_date.trim() : todayStr;

  const payload = {
    video_number: parsedNum,
    title: projectData.title.trim(),
    video_url: projectData.video_url.trim(),
    video_type: videoType,
    project_date: projectDate || todayStr,
    description: '',
    tags: [],
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  // If columns don't exist yet, fallback
  if (error && (error.message?.includes('video_type') || error.message?.includes('project_date'))) {
    const basicPayload = {
      video_number: parsedNum,
      title: projectData.title.trim(),
      video_url: projectData.video_url.trim(),
      updated_at: new Date().toISOString(),
    };
    const retry = await supabase.from('projects').update(basicPayload).eq('id', id).select().single();
    if (retry.error) {
      return { data: null, error: retry.error.message };
    }
    return {
      data: {
        ...retry.data,
        video_type: videoType,
        project_date: projectDate || todayStr,
      },
      error: null,
    };
  }

  if (error) {
    if (error.code === '23505') {
      return {
        data: null,
        error: `Video ${payload.video_number} is already taken by another project.`,
      };
    }
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Delete a project by ID
 */
export async function deleteProject(id) {
  const supabase = createClient();
  if (!supabase) {
    return { success: false, error: 'Database connection is not configured.' };
  }

  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
