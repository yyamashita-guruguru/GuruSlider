// ────────────────────────────────────────────────────────────────
//  Deck library storage (IndexedDB)
//  Saves whole presentations ("decks") so they can be recalled later.
//  IndexedDB is used instead of localStorage because decks can contain
//  base64 images and easily exceed the ~5MB localStorage quota.
// ────────────────────────────────────────────────────────────────

export interface DeckRecord {
  id: string;
  name: string;
  updatedAt: number;   // epoch ms
  slideCount: number;
  slides: any[];
  config: any;
}

const DB_NAME = 'boardroom_deck_library';
const STORE = 'decks';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open deck database.'));
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(db => new Promise<T>((resolve, reject) => {
    let result: T;
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const request = run(store);
    request.onsuccess = () => { result = request.result as T; };
    request.onerror = () => reject(request.error || new Error('Deck database operation failed.'));
    // Resolve only once the transaction has committed, so writes are durable.
    transaction.oncomplete = () => { db.close(); resolve(result); };
    transaction.onerror = () => { db.close(); reject(transaction.error || new Error('Deck database transaction failed.')); };
    transaction.onabort = () => { db.close(); reject(transaction.error || new Error('Deck database transaction aborted.')); };
  }));
}

/** All saved decks, newest first. */
export async function listDecks(): Promise<DeckRecord[]> {
  const all = await tx<DeckRecord[]>('readonly', store => store.getAll() as IDBRequest<DeckRecord[]>);
  return (all || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function getDeck(id: string): Promise<DeckRecord | undefined> {
  return tx<DeckRecord | undefined>('readonly', store => store.get(id) as IDBRequest<DeckRecord | undefined>);
}

export async function putDeck(rec: DeckRecord): Promise<void> {
  await tx('readwrite', store => store.put(rec));
}

export async function deleteDeck(id: string): Promise<void> {
  await tx('readwrite', store => store.delete(id));
}
