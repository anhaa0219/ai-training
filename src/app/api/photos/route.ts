import { createClient } from '@supabase/supabase-js';


const STORAGE_BUCKET = 'training-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function getSupabaseUrlFromDirectUrl() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) throw new Error('DIRECT_URL is missing from the server environment.');

  const databaseUrl = new URL(directUrl);
  const directHostMatch = databaseUrl.hostname.match(/^db\.([^.]+)\.supabase\.co$/);
  const projectRef = directHostMatch?.[1] ?? (
    databaseUrl.hostname.endsWith('.pooler.supabase.com')
      ? decodeURIComponent(databaseUrl.username).split('.').at(-1)
      : undefined
  );

  if (!projectRef) {
    throw new Error('Could not determine the Supabase project from DIRECT_URL.');
  }

  return `https://${projectRef}.supabase.co`;
}

function getSupabaseAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) {
    throw new Error('SUPABASE_SECRET_KEY is missing from the server environment.');
  }

  return createClient(getSupabaseUrlFromDirectUrl(), secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path');
  const validPath = path && /^(training|test)\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,100}$/.test(path);

  if (!validPath) {
    return Response.json(
      { error: 'Provide a valid photo storage path.' },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await getSupabaseAdminClient()
      .storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, 60);

    if (error) throw error;
    return Response.json({ signedUrl: data.signedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not retrieve photo.';
    const status = message.includes('SUPABASE_SECRET_KEY') || message.includes('DIRECT_URL')
      ? 503
      : 502;
    return Response.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Send the photo as multipart form data.' }, { status: 400 });
  }

  const file = formData.get('file');
  const target = formData.get('target');
  const id = formData.get('id');

  if (
    !(file instanceof File) ||
    (target !== 'training' && target !== 'test') ||
    typeof id !== 'string' ||
    !/^[0-9a-f-]{36}$/i.test(id)
  ) {
    return Response.json({ error: 'The photo upload details are invalid.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: 'Choose a JPEG, PNG, WebP, or GIF image.' }, { status: 415 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: 'Each photo must be 10 MB or smaller.' }, { status: 413 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'image';
  const storagePath = `${target}/${id}/${safeName}`;

  try {
    const { error } = await getSupabaseAdminClient()
      .storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, new Uint8Array(await file.arrayBuffer()), {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });

    if (error) throw error;
    return Response.json({ storagePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Storage upload failed.';
    const status = message.includes('SUPABASE_SECRET_KEY') || message.includes('DIRECT_URL')
      ? 503
      : 502;
    return Response.json({ error: message }, { status });
  }
}
