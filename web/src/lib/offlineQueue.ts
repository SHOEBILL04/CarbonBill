import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface PendingUpload {
  id: string; // client-generated GUID idempotency key
  category: string;
  blob?: Blob;
  fileName?: string;
  manualQuantity?: number;
  manualSlipNumber?: string;
  createdAt: string;
  status: 'pending' | 'uploading' | 'synced' | 'failed';
  error?: string;
}

interface CarbonBillDB extends DBSchema {
  uploadQueue: {
    key: string;
    value: PendingUpload;
    indexes: { 'by-status': string };
  };
}

let dbPromise: Promise<IDBPDatabase<CarbonBillDB>> | null = null;

function getDb(): Promise<IDBPDatabase<CarbonBillDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CarbonBillDB>('carbonbill-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('uploadQueue', { keyPath: 'id' });
        store.createIndex('by-status', 'status');
      }
    });
  }
  return dbPromise;
}

export async function enqueueUpload(upload: Omit<PendingUpload, 'id' | 'status' | 'createdAt'>): Promise<PendingUpload> {
  const db = await getDb();
  const item: PendingUpload = {
    ...upload,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  await db.put('uploadQueue', item);
  return item;
}

export async function getPendingUploads(): Promise<PendingUpload[]> {
  const db = await getDb();
  return db.getAll('uploadQueue');
}

export async function markUploadSynced(id: string): Promise<void> {
  const db = await getDb();
  const item = await db.get('uploadQueue', id);
  if (item) {
    item.status = 'synced';
    await db.put('uploadQueue', item);
  }
}

export async function markUploadFailed(id: string, error: string): Promise<void> {
  const db = await getDb();
  const item = await db.get('uploadQueue', id);
  if (item) {
    item.status = 'failed';
    item.error = error;
    await db.put('uploadQueue', item);
  }
}
