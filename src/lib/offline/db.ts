/**
 * IndexedDB wrapper for offline report caching.
 * Stores reports and their metadata so they're accessible without network.
 */

const DB_NAME = 'healthvault-offline';
const DB_VERSION = 1;
const REPORTS_STORE = 'reports';
const QUEUE_STORE = 'upload-queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(REPORTS_STORE)) {
        db.createObjectStore(REPORTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('status', 'status', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Reports Cache ───────────────────────────────────────────────────────────

export interface CachedReport {
  id: string;
  patient_id: string;
  title: string;
  report_type: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  report_date: string;
  notes: string | null;
  is_shareable: boolean;
  thumbnail_path: string | null;
  cached_at: number;
}

export async function cacheReport(report: Omit<CachedReport, 'cached_at'>): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(REPORTS_STORE, 'readwrite');
  tx.objectStore(REPORTS_STORE).put({ ...report, cached_at: Date.now() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function cacheReports(reports: Omit<CachedReport, 'cached_at'>[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(REPORTS_STORE, 'readwrite');
  const store = tx.objectStore(REPORTS_STORE);
  for (const report of reports) {
    store.put({ ...report, cached_at: Date.now() });
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedReports(): Promise<CachedReport[]> {
  const db = await openDB();
  const tx = db.transaction(REPORTS_STORE, 'readonly');
  const request = tx.objectStore(REPORTS_STORE).getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedReport(id: string): Promise<CachedReport | undefined> {
  const db = await openDB();
  const tx = db.transaction(REPORTS_STORE, 'readonly');
  const request = tx.objectStore(REPORTS_STORE).get(id);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCachedReport(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(REPORTS_STORE, 'readwrite');
  tx.objectStore(REPORTS_STORE).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Upload Queue ────────────────────────────────────────────────────────────

export interface QueuedUpload {
  id?: number;
  file: File;
  fileName: string;
  mimeType: string;
  title: string;
  reportType: string;
  reportDate: string;
  notes: string;
  isShareable: boolean;
  filePath: string;
  status: 'pending' | 'uploading' | 'done' | 'failed';
  createdAt: number;
  error?: string;
}

export async function queueUpload(
  upload: Omit<QueuedUpload, 'id' | 'status' | 'createdAt'>
): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const record: QueuedUpload = {
    ...upload,
    status: 'pending',
    createdAt: Date.now(),
  };
  const request = tx.objectStore(QUEUE_STORE).add(record);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(request.result as number);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingUploads(): Promise<QueuedUpload[]> {
  const db = await openDB();
  const tx = db.transaction(QUEUE_STORE, 'readonly');
  const index = tx.objectStore(QUEUE_STORE).index('status');
  const request = index.getAll('pending');
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateUploadStatus(
  id: number,
  status: QueuedUpload['status'],
  error?: string
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);
  const get = store.get(id);
  get.onsuccess = () => {
    const record = get.result;
    if (record) {
      record.status = status;
      if (error) record.error = error;
      store.put(record);
    }
  };
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearCompletedUploads(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);
  const index = store.index('status');
  const request = index.openCursor('done');
  request.onsuccess = () => {
    const cursor = request.result;
    if (cursor) {
      cursor.delete();
      cursor.continue();
    }
  };
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Network Status ──────────────────────────────────────────────────────────

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
