// supabase-client.js (ESM module)
//
// Required: replace SUPABASE_URL and SUPABASE_ANON_KEY with your project's values.
// Usage: <script type="module" src="js/supabase-client.js"></script>
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://mdnxxalnykygpgkbqqfn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbnh4YWxueWt5Z3Bna2JxcWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTkzNjAsImV4cCI6MjA3MDIzNTM2MH0.Pi5I-CGBX9nHAEcGm2pkNHfvgYsEONHaxOShkLaDaUM';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_BASE = (window.API_BASE_URL || 'http://localhost:3000/api/public');

async function apiPost(path, body, isMultipart=false) {
  const opts = {
    method: 'POST',
    headers: isMultipart ? {} : { 'Content-Type': 'application/json' },
    body: isMultipart ? body : JSON.stringify(body)
  };
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(()=>({}));
  if (!res.ok || !data.success) {
    const msg = data?.error?.message || res.statusText;
    throw new Error(msg);
  }
  return data.data;
}

/**
 * Subscribe an email to the newsletter_subscribers table
 */
export async function subscribeNewsletter(email) {
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Email non valida');
  return await apiPost('/newsletter', { email });
}

/**
 * Submit contact message to contacts table
 */
export async function submitContact({ name, email, message }) {
  if (!name || name.length < 2) throw new Error('Nome troppo corto');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Email non valida');
  if (!message || message.length < 5) throw new Error('Messaggio troppo corto');
  return await apiPost('/contact', { name, email, message });
}

/**
 * Upload a file to storage bucket 'uploads' and save metadata to uploads table.
 * Returns an object with { publicUrl, metadata }
 */
export async function uploadFile(file) {
  if (!file) throw new Error('Nessun file selezionato');
  if (file.size > 5 * 1024 * 1024) throw new Error('File troppo grande (max 5MB)');
  if (!file.type.startsWith('image/')) throw new Error('Solo immagini consentite');
  const form = new FormData();
  form.append('file', file);
  return await apiPost('/upload', form, true);
}
