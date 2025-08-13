// Frontend API client for public endpoints
// Uses backend routes; no Supabase keys on client.

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
    const msg = data?.error?.message || res.statusText || 'Errore di rete';
    throw new Error(msg);
  }
  return data.data;
}

export async function subscribeNewsletter(email) {
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Email non valida');
  return await apiPost('/newsletter', { email });
}

export async function submitContact({ name, email, message }) {
  if (!name || name.length < 2) throw new Error('Nome troppo corto');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Email non valida');
  if (!message || message.length < 5) throw new Error('Messaggio troppo corto');
  return await apiPost('/contact', { name, email, message });
}

export async function uploadFile(file) {
  if (!file) throw new Error('Nessun file selezionato');
  if (file.size > 5 * 1024 * 1024) throw new Error('File troppo grande (max 5MB)');
  if (!file.type.startsWith('image/')) throw new Error('Solo immagini consentite');
  const form = new FormData();
  form.append('file', file);
  return await apiPost('/upload', form, true);
}
