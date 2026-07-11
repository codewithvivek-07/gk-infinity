import { parseFirestoreDocument } from './utils.js';
import { fallbackBatches, fallbackPages } from './fallback_data.js';

const BATCHES_API_URL = '/api/batches';
const PAGES_API_URL = '/api/pages';

/**
 * Fetch all batches from Firestore or fallback to local data.
 */
export async function getBatches() {
  try {
    const response = await fetch(BATCHES_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.documents) {
      return data.documents.map(parseFirestoreDocument).filter(Boolean);
    }
    throw new Error('Invalid Firestore response structure');
  } catch (error) {
    console.warn('Failed to fetch live batches from Firestore. Using fallback data.', error);
    return fallbackBatches;
  }
}

/**
 * Fetch all pages from Firestore or fallback to local data.
 */
export async function getPages() {
  try {
    const response = await fetch(PAGES_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.documents) {
      return data.documents.map(parseFirestoreDocument).filter(Boolean);
    }
    throw new Error('Invalid Firestore response structure');
  } catch (error) {
    console.warn('Failed to fetch live pages from Firestore. Using fallback data.', error);
    return fallbackPages;
  }
}
