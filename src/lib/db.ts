import { openDB, IDBPDatabase } from "idb";
import { BibleBook } from './bible-types';

const DB_NAME = 'bible-app-db';
const STORE_NAME = 'books';

export async function getDB() {
   return openDB(DB_NAME, 1, {
      upgrade(db) {
         if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
         }
      }
   })
}

export async function getCachedBook(translation: string, bookId: string): Promise<BibleBook | null> {
   const db = await getDB();
   return db.get(STORE_NAME, `${translation}_${bookId}`);
}

export async function setCachedBook(translation: string, bookId: string, data: BibleBook) {
   const db = await getDB();
   return db.put(STORE_NAME, data, `${translation}_${bookId}`);
}