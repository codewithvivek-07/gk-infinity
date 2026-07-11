/**
 * Utility to parse Firestore REST API response values.
 */

export function parseFirestoreValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  
  // If it is not a direct object container, return it
  if (typeof value !== 'object') {
    return value;
  }

  // Check types supported by firestore
  if ('stringValue' in value) {
    return value.stringValue;
  }
  if ('integerValue' in value) {
    return parseInt(value.integerValue, 10);
  }
  if ('doubleValue' in value) {
    return Number(value.doubleValue);
  }
  if ('booleanValue' in value) {
    return value.booleanValue;
  }
  if ('timestampValue' in value) {
    return value.timestampValue;
  }
  if ('arrayValue' in value) {
    const values = value.arrayValue.values || [];
    return values.map(v => parseFirestoreValue(v));
  }
  if ('mapValue' in value) {
    const fields = value.mapValue.fields || {};
    return parseFirestoreDocumentFields(fields);
  }
  
  return value;
}

export function parseFirestoreDocumentFields(fields) {
  const result = {};
  if (!fields) return result;
  for (const [key, value] of Object.entries(fields)) {
    result[key] = parseFirestoreValue(value);
  }
  return result;
}

export function parseFirestoreDocument(doc) {
  if (!doc || !doc.fields) return null;
  const id = doc.name.split('/').pop();
  return {
    id,
    name: doc.name,
    ...parseFirestoreDocumentFields(doc.fields),
    createTime: doc.createTime,
    updateTime: doc.updateTime
  };
}
