import { createClient } from '@/lib/supabase/client';
import { parseVideoNumber, isValidUrl } from '@/lib/utils';
import { createProject } from './projects';

/**
 * Check if a video number already exists in published Projects
 * @param {number|string} videoNumber
 * @returns {Promise<{ conflict: boolean, project: object|null, error: string|null }>}
 */
export async function checkConflictWithProjects(videoNumber) {
  const supabase = createClient();
  if (!supabase) return { conflict: false, project: null, error: null };

  const parsedNum = parseVideoNumber(videoNumber);
  if (!parsedNum) {
    return { conflict: false, project: null, error: 'Invalid video number' };
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, video_number, title, video_type')
    .eq('video_number', parsedNum);

  if (error) {
    return { conflict: false, project: null, error: error.message };
  }

  const exists = Boolean(data && data.length > 0);
  return {
    conflict: exists,
    project: exists ? data[0] : null,
    error: null,
  };
}

/**
 * Check if video number is available for Upcoming:
 * 1. MUST NOT exist in Projects (user requirement)
 * 2. MUST NOT exist in other Upcoming items
 */
export async function checkUpcomingNumberAvailable(videoNumber, currentUpcomingId = null) {
  const supabase = createClient();
  if (!supabase) return { available: true };

  const parsedNum = parseVideoNumber(videoNumber);
  if (!parsedNum || parsedNum <= 0) {
    return { available: false, error: 'Must be a positive number or format like Video 1.' };
  }

  // 1. Check against Projects (STRICT USER REQUIREMENT)
  const projectCheck = await checkConflictWithProjects(parsedNum);
  if (projectCheck.conflict) {
    return {
      available: false,
      conflictType: 'project',
      error: `Video ${parsedNum} is already published in Projects ("${projectCheck.project.title}"). You cannot use this number!`,
    };
  }

  // 2. Check against other Upcoming items
  let query = supabase
    .from('upcoming')
    .select('id, video_number, title')
    .eq('video_number', parsedNum);

  if (currentUpcomingId) {
    query = query.neq('id', currentUpcomingId);
  }

  const { data, error } = await query;
  if (error) {
    // If upcoming table doesn't exist yet, don't block validation
    return { available: true };
  }

  if (data && data.length > 0) {
    return {
      available: false,
      conflictType: 'upcoming',
      error: `Video ${parsedNum} already exists in Upcoming ("${data[0].title}").`,
    };
  }

  return { available: true };
}

/**
 * Fetch Upcoming items with optional type filter, search query, and sorting
 * @param {Object} options
 * @param {string} [options.videoType='all'] - 'all' | 'shorts' | 'long'
 * @param {string} [options.searchQuery='']
 * @param {string} [options.sortBy='video_number_asc']
 */
export async function getUpcoming({
  videoType = 'all',
  searchQuery = '',
  sortBy = 'video_number_asc',
} = {}) {
  const supabase = createClient();
  if (!supabase) {
    return { data: [], error: 'Supabase credentials not configured' };
  }

  let query = supabase
    .from('upcoming')
    .select('id, video_number, video_type, title, description, audio_prompt, edit_prompt, target_date, created_at, updated_at');

  if (videoType === 'shorts') {
    query = query.eq('video_type', 'shorts');
  } else if (videoType === 'long') {
    query = query.eq('video_type', 'long');
  }

  const trimmed = searchQuery.trim();
  if (trimmed) {
    const parsedNum = parseVideoNumber(trimmed);
    if (parsedNum) {
      query = query.or(`video_number.eq.${parsedNum},title.ilike.%${trimmed}%,audio_prompt.ilike.%${trimmed}%,edit_prompt.ilike.%${trimmed}%`);
    } else {
      query = query.or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%,audio_prompt.ilike.%${trimmed}%,edit_prompt.ilike.%${trimmed}%`);
    }
  }

  switch (sortBy) {
    case 'video_number_desc':
      query = query.order('video_number', { ascending: false });
      break;
    case 'target_date_asc':
      query = query.order('target_date', { ascending: true });
      break;
    case 'target_date_desc':
      query = query.order('target_date', { ascending: false });
      break;
    case 'recent_created':
      query = query.order('created_at', { ascending: false });
      break;
    case 'video_number_asc':
    default:
      query = query.order('video_number', { ascending: true });
      break;
  }

  const { data, error } = await query;
  return { data: data || [], error: error?.message || null };
}

/**
 * Create a new Upcoming item
 */
export async function createUpcoming(upcomingData) {
  const supabase = createClient();
  if (!supabase) {
    return { data: null, error: 'Database connection is not configured.' };
  }

  const parsedNum = parseVideoNumber(upcomingData.video_number);
  if (!parsedNum) {
    return {
      data: null,
      error: 'Please enter a valid video number (e.g. 1, 9, or Video 9).',
    };
  }

  // Strict check: if video number already exists in Projects, reject immediately!
  const projectCheck = await checkConflictWithProjects(parsedNum);
  if (projectCheck.conflict) {
    return {
      data: null,
      error: `Permission Denied: Video ${parsedNum} already exists in Projects ("${projectCheck.project.title}"). You cannot reuse this number!`,
    };
  }

  // Check unique in upcoming
  const { available, error: availErr } = await checkUpcomingNumberAvailable(parsedNum);
  if (!available) {
    return { data: null, error: availErr };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const payload = {
    video_number: parsedNum,
    video_type: upcomingData.video_type === 'long' ? 'long' : 'shorts',
    title: upcomingData.title.trim(),
    description: (upcomingData.description || '').trim(),
    audio_prompt: (upcomingData.audio_prompt || '').trim(),
    edit_prompt: (upcomingData.edit_prompt || '').trim(),
    target_date: upcomingData.target_date ? upcomingData.target_date.trim() : todayStr,
  };

  const { data, error } = await supabase
    .from('upcoming')
    .insert([payload])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Update an existing Upcoming item
 */
export async function updateUpcoming(id, upcomingData) {
  const supabase = createClient();
  if (!supabase) {
    return { data: null, error: 'Database connection is not configured.' };
  }

  const parsedNum = parseVideoNumber(upcomingData.video_number);
  if (!parsedNum) {
    return {
      data: null,
      error: 'Please enter a valid video number (e.g. 1, 9, or Video 9).',
    };
  }

  // Strict check: if video number already exists in Projects, reject!
  const projectCheck = await checkConflictWithProjects(parsedNum);
  if (projectCheck.conflict) {
    return {
      data: null,
      error: `Permission Denied: Video ${parsedNum} already exists in Projects ("${projectCheck.project.title}"). You cannot reuse this number!`,
    };
  }

  // Check unique in upcoming
  const { available, error: availErr } = await checkUpcomingNumberAvailable(parsedNum, id);
  if (!available) {
    return { data: null, error: availErr };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const payload = {
    video_number: parsedNum,
    video_type: upcomingData.video_type === 'long' ? 'long' : 'shorts',
    title: upcomingData.title.trim(),
    description: (upcomingData.description || '').trim(),
    audio_prompt: (upcomingData.audio_prompt || '').trim(),
    edit_prompt: (upcomingData.edit_prompt || '').trim(),
    target_date: upcomingData.target_date ? upcomingData.target_date.trim() : todayStr,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('upcoming')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Delete an Upcoming item
 */
export async function deleteUpcoming(id) {
  const supabase = createClient();
  if (!supabase) {
    return { success: false, error: 'Database connection is not configured.' };
  }

  const { error } = await supabase.from('upcoming').delete().eq('id', id);
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Submit an Upcoming item to Projects:
 * 1. Checks that video_number doesn't conflict with any project in Projects
 * 2. Inserts new project into `projects` table (into Shorts or Long based on video_type)
 * 3. Deletes the item from `upcoming`
 */
export async function submitUpcomingToProjects(upcomingItem, videoUrl) {
  const supabase = createClient();
  if (!supabase) {
    return { data: null, error: 'Database connection is not configured.' };
  }

  if (!videoUrl || !isValidUrl(videoUrl)) {
    return {
      data: null,
      error: 'Please provide a valid video URL (e.g. YouTube link) to submit to Projects.',
    };
  }

  const parsedNum = parseVideoNumber(upcomingItem.video_number);
  if (!parsedNum) {
    return {
      data: null,
      error: 'Invalid video number in upcoming project.',
    };
  }

  // Strict check: if video number already exists in Projects, reject!
  const projectCheck = await checkConflictWithProjects(parsedNum);
  if (projectCheck.conflict) {
    return {
      data: null,
      error: `Permission Denied: Video ${parsedNum} already exists in Projects ("${projectCheck.project.title}"). You cannot submit this project!`,
    };
  }

  const videoType = upcomingItem.video_type === 'long' ? 'long' : 'shorts';
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Create project in projects table
  const createRes = await createProject({
    video_number: parsedNum,
    title: upcomingItem.title,
    video_url: videoUrl.trim(),
    video_type: videoType,
    project_date: upcomingItem.target_date || todayStr,
  });

  if (createRes.error) {
    return { data: null, error: createRes.error };
  }

  // 2. Remove from upcoming table
  await deleteUpcoming(upcomingItem.id);

  return {
    data: createRes.data,
    videoType,
    error: null,
  };
}
