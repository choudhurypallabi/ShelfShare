import { supabase } from '../lib/supabaseClient';

const BUCKET = 'book-covers';

export async function uploadBookCover(file, userId) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
