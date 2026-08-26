const FACE_API_SRC = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.js';
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
const DB_NAME = 'jobconnect-face-auth';
const DB_VERSION = 1;
const STORE_NAME = 'keys';
const FACE_CREDENTIAL_KEY = 'jobconnect.face-credential';
const MATCH_THRESHOLD = 0.52;

let apiPromise = null;
let modelsPromise = null;

function loadScript() {
  if (window.faceapi) return Promise.resolve(window.faceapi);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = FACE_API_SRC;
    script.async = true;
    script.onload = () => window.faceapi ? resolve(window.faceapi) : reject(new Error('Face API no pudo inicializarse.'));
    script.onerror = () => reject(new Error('No se pudo cargar el motor de reconocimiento facial.'));
    document.head.appendChild(script);
  });

  return apiPromise;
}

async function loadModels() {
  if (modelsPromise) return modelsPromise;
  modelsPromise = (async () => {
    const faceapi = await loadScript();
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    return faceapi;
  })();
  return modelsPromise;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir el almacenamiento seguro.'));
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
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(data))
  };
}

async function decryptCredentials(payload) {
  const key = await getCryptoKey(false);
  if (!key || !payload?.iv || !payload?.data) return null;
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(payload.iv) },
      key,
      new Uint8Array(payload.data)
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return null;
  }
}

function getSavedCredential() {
  try {
    return JSON.parse(localStorage.getItem(FACE_CREDENTIAL_KEY) || 'null');
  } catch {
    return null;
  }
}

export function hasFaceCredential() {
  const saved = getSavedCredential();
  return Boolean(saved?.descriptor?.length && saved?.encryptedCredentials);
}

export async function saveFaceCredential({ username, password, descriptor, accountType }) {
  const encryptedCredentials = await encryptCredentials({ username, password, accountType });
  localStorage.setItem(FACE_CREDENTIAL_KEY, JSON.stringify({
    version: 1,
    descriptor: Array.from(descriptor),
    encryptedCredentials,
    createdAt: new Date().toISOString()
  }));
}

export function removeFaceCredential() {
  localStorage.removeItem(FACE_CREDENTIAL_KEY);
}

export async function captureFaceDescriptor(video) {
  const faceapi = await loadModels();
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.55 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) throw new Error('No detectamos un rostro. Mira a la cámara y acerca tu cara.');
  return detection.descriptor;
}

export async function enrollFace({ video, username, password, accountType }) {
  const descriptor = await captureFaceDescriptor(video);
  await saveFaceCredential({ username, password, descriptor, accountType });
  return descriptor;
}

export async function authenticateWithFace(video) {
  const saved = getSavedCredential();
  if (!saved?.descriptor?.length || !saved?.encryptedCredentials) {
    throw new Error('Todavía no has configurado el acceso facial en este dispositivo.');
  }

  const faceapi = await loadModels();
  const descriptor = await captureFaceDescriptor(video);
  const distance = faceapi.euclideanDistance(new Float32Array(saved.descriptor), descriptor);

  if (distance > MATCH_THRESHOLD) {
    throw new Error('El rostro no coincide. Inténtalo de nuevo o usa tu contraseña.');
  }

  const credentials = await decryptCredentials(saved.encryptedCredentials);
  if (!credentials) throw new Error('No se pudo recuperar la credencial facial. Configúrala nuevamente.');

  return { ...credentials, distance };
}

export async function startFaceCamera(video) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Tu navegador no permite acceder a la cámara.');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
    audio: false
  });
  video.srcObject = stream;
  await video.play();
  return stream;
}

export function stopFaceCamera(stream) {
  stream?.getTracks?.().forEach(track => track.stop());
}

export async function prepareFaceEngine() {
  return loadModels();
}
