import { createClient } from '@/lib/supabase/client';
import { isValidUrl, parseVideoNumber } from '@/lib/utils';

/**
 * Fetch projects with search and sorting
 */
export async function getProjects({
  searchQuery = '',
  exactNumber = false,
  sortBy = 'video_number_asc',
  category = null,
} = {}) {
  const supabase = createClient();

  if (!supabase) {
    return {
      data: [],
      error: 'Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    };
  }

  let query = supabase.from('projects').select('*');

  // Exact or partial search
  const trimmed = searchQuery.trim();
  if (trimmed) {
    const parsedNum = parseVideoNumber(trimmed);

    if (exactNumber && parsedNum) {
      query = query.eq('video_number', parsedNum);
    } else if (parsedNum) {
      // Matches exact video number OR partial match in title/description
      query = query.or(
        `video_number.eq.${parsedNum},title.ilike.%${trimmed}%,description.ilike.%${trimmed}%`
      );
    } else {
      query = query.or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%`);
    }
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
    case 'video_number_asc':
    default:
      query = query.order('video_number', { ascending: true });
      break;
  }

  const { data, error } = await query;
  return { data: data || [], error: error?.message || null };
}

/**
 * Fetch statistics for dashboard cards
 */
export async function getDashboardStats() {
  const supabase = createClient();
  if (!supabase) {
    return {
      totalProjects: 0,
      latestVideoNumber: 0,
      recentlyUpdatedCount: 0,
      validLinksCount: 0,
      recentlyAdded: [],
      recentlyUpdated: [],
      error: 'Supabase not configured',
    };
  }

  try {
    const { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('id, video_number, title, video_url, tags, created_at, updated_at')
      .order('video_number', { ascending: true });

    if (allError) throw allError;

    const projects = allProjects || [];
    const totalProjects = projects.length;

    const latestVideoNumber = projects.reduce(
      (max, p) => (p.video_number > max ? p.video_number : max),
      0
    );

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
      latestVideoNumber,
      recentlyUpdatedCount,
      validLinksCount,
      recentlyAdded,
      recentlyUpdated,
      allProjects,
      error: null,
    };
  } catch (err) {
    return {
      totalProjects: 0,
      latestVideoNumber: 0,
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
 * Check if video number is unique across all projects
 */
export async function checkVideoNumberAvailable(videoNumber, currentProjectId = null) {
  const supabase = createClient();
  if (!supabase) return { available: true };

  const parsedNumber = parseVideoNumber(videoNumber);
  if (!parsedNumber || parsedNumber <= 0) {
    return { available: false, error: 'Must be a positive integer or format like Video 1.' };
  }

  let query = supabase
    .from('projects')
    .select('id, video_number')
    .eq('video_number', parsedNumber);

  if (currentProjectId) {
    query = query.neq('id', currentProjectId);
  }

  const { data, error } = await query;
  if (error) {
    return { available: false, error: error.message };
  }

  return {
    available: !data || data.length === 0,
    conflictingProject: data?.[0] || null,
  };
}

/**
 * Create a new project
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

  // Pre-validate video_number uniqueness
  const { available, error: uniqueErr } = await checkVideoNumberAvailable(parsedNum);
  if (!available) {
    return {
      data: null,
      error: uniqueErr || `Video ${parsedNum} already exists in your library. Please choose a unique video number.`,
    };
  }

  const payload = {
    video_number: parsedNum,
    title: projectData.title.trim(),
    description: projectData.description?.trim() || '',
    video_url: projectData.video_url.trim(),
    tags: Array.isArray(projectData.tags)
      ? projectData.tags
      : (projectData.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
  };

  const { data, error } = await supabase
    .from('projects')
    .insert([payload])
    .select()
    .single();

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

  // Check unique video number if changing
  const { available, error: uniqueErr } = await checkVideoNumberAvailable(parsedNum, id);
  if (!available) {
    return {
      data: null,
      error: uniqueErr || `Video ${parsedNum} is already taken by another project.`,
    };
  }

  const payload = {
    video_number: parsedNum,
    title: projectData.title.trim(),
    description: projectData.description?.trim() || '',
    video_url: projectData.video_url.trim(),
    tags: Array.isArray(projectData.tags)
      ? projectData.tags
      : (projectData.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

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
