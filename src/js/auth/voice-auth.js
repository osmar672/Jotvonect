const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';
const MODEL_ID = 'Xenova/wavlm-base-plus-sv';
const DB_NAME = 'jobconnect-voice-auth';
const DB_VERSION = 1;
const STORE_NAME = 'keys';
const VOICE_CREDENTIAL_KEY = 'jobconnect.voice-credential';
const MATCH_THRESHOLD = 0.78;

let transformersPromise = null;
let enginePromise = null;

async function loadTransformers() {
  if (!transformersPromise) {
    transformersPromise = import(TRANSFORMERS_URL).catch(() => {
      throw new Error('No se pudo cargar el motor de reconocimiento de voz. Comprueba tu conexión a Internet.');
    });
  }
  return transformersPromise;
}

async function loadEngine() {
  if (!enginePromise) {
    enginePromise = (async () => {
      const { AutoProcessor, AutoModel } = await loadTransformers();
      const processor = await AutoProcessor.from_pretrained(MODEL_ID);
      const model = await AutoModel.from_pretrained(MODEL_ID, { dtype: 'q8' });
      return { processor, model };
    })();
  }
  return enginePromise;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir el almacenamiento de voz.'));
  });
}

async function getCryptoKey(create = false) {
  const db = await openDb();
  const key = await new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get('credential-key');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (key || !create) return key;

  const generated = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const writeDb = await openDb();
  await new Promise((resolve, reject) => {
    const request = writeDb.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(generated, 'credential-key');
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });
  writeDb.close();
  return generated;
}

async function encryptCredentials(credentials) {
  const key = await getCryptoKey(true);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(credentials));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return { iv: Array.from(iv), data: Array.from(new Uint8Array(data)) };
}

async function decryptCredentials(payload) {
  const key = await getCryptoKey(false);
  if (!key || !payload?.iv || !payload?.data) return null;
  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(payload.iv) }, key, new Uint8Array(payload.data));
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return null;
  }
}

function savedCredential() {
  try { return JSON.parse(localStorage.getItem(VOICE_CREDENTIAL_KEY) || 'null'); } catch { return null; }
}

export function hasVoiceCredential() {
  const saved = savedCredential();
  return Boolean(saved?.embedding?.length && saved?.encryptedCredentials);
}

export async function prepareVoiceEngine() {
  await loadEngine();
}

export async function recordVoiceSample({ durationMs = 4500, onProgress } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Tu navegador no permite acceder al micrófono.');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  const started = performance.now();

  const progressTimer = setInterval(() => {
    const elapsed = performance.now() - started;
    onProgress?.(Math.min(100, Math.round((elapsed / durationMs) * 100)));
  }, 100);

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => reject(new Error('No se pudo grabar la voz.'));
    recorder.onstop = () => {
      clearInterval(progressTimer);
      stream.getTracks().forEach(track => track.stop());
      resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
    };
    recorder.start();
    setTimeout(() => recorder.state === 'recording' && recorder.stop(), durationMs);
  });
}

async function blobTo16kMono(blob) {
  const context = new AudioContext();
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
    const length = buffer.length;
    const mono = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (const channel of channels) sum += channel[i] || 0;
      mono[i] = sum / channels.length;
    }
    const targetLength = Math.max(1, Math.round(length * 16000 / buffer.sampleRate));
    const resampled = new Float32Array(targetLength);
    const ratio = buffer.sampleRate / 16000;
    for (let i = 0; i < targetLength; i++) {
      const position = i * ratio;
      const left = Math.floor(position);
      const right = Math.min(left + 1, length - 1);
      const weight = position - left;
      resampled[i] = mono[left] * (1 - weight) + mono[right] * weight;
    }
    return resampled;
  } finally {
    await context.close();
  }
}

async function embeddingFromBlob(blob) {
  const { processor, model } = await loadEngine();
  const audio = await blobTo16kMono(blob);
  const inputs = await processor(audio);
  const output = await model(inputs);
  const embeddings = output.embeddings?.data;
  if (!embeddings?.length) throw new Error('El modelo de voz no devolvió una huella de voz válida.');
  return Array.from(embeddings);
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

export async function enrollVoice({ username, password, accountType, blob }) {
  const embedding = await embeddingFromBlob(blob);
  const encryptedCredentials = await encryptCredentials({ username, password, accountType });
  localStorage.setItem(VOICE_CREDENTIAL_KEY, JSON.stringify({
    version: 1,
    embedding,
    encryptedCredentials,
    createdAt: new Date().toISOString()
  }));
  return embedding;
}

export async function authenticateWithVoice(blob) {
  const saved = savedCredential();
  if (!saved?.embedding?.length || !saved?.encryptedCredentials) {
    throw new Error('Todavía no has configurado el acceso con voz en este dispositivo.');
  }
  const embedding = await embeddingFromBlob(blob);
  const similarity = cosineSimilarity(saved.embedding, embedding);
  if (similarity < MATCH_THRESHOLD) {
    throw new Error('La voz no coincide. Inténtalo de nuevo o usa tu contraseña.');
  }
  const credentials = await decryptCredentials(saved.encryptedCredentials);
  if (!credentials) throw new Error('No se pudo recuperar la credencial de voz. Configúrala nuevamente.');
  return { ...credentials, similarity };
}

export function removeVoiceCredential() {
  localStorage.removeItem(VOICE_CREDENTIAL_KEY);
}
