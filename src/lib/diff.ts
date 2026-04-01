/**
 * Pure utility — compares two DB records and returns a human-readable diff.
 * No 'use server' — imported only by server action files.
 *
 * - fieldLabels: maps DB column → display name. Columns NOT in this map use
 *   auto-generated names (underscores → Title Case).
 * - ignoreFields: columns to always skip (timestamps, hashes, etc.)
 */

const ALWAYS_IGNORE = [
  'id', 'created_at', 'updated_at', 'password_hash', 'is_active',
  'nic_front_url', 'nic_back_url', 'photo_url',        // storage URLs
  'vehicle_id', 'customer_id', 'guarantor_id',          // FK ids (not user-readable)
  'supplier_id', 'created_by', 'approved_by',
];

function autoLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalise(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—';
  const str = String(val);
  // Skip storage URLs entirely
  if (str.startsWith('http') && str.includes('/storage/')) return '__SKIP__';
  return str.trim();
}

export function buildDiff(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  fieldLabels: Record<string, string> = {},
  extraIgnore: string[] = []
): { details: string; old_value: string; new_value: string } {
  const ignore = new Set([...ALWAYS_IGNORE, ...extraIgnore]);

  const changes: string[] = [];
  const oldParts: string[] = [];
  const newParts: string[] = [];

  // Use the union of both objects' keys so we catch fields cleared to null
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    if (ignore.has(key)) continue;

    const oldStr = normalise(oldData[key]);
    const newStr = normalise(newData[key]);

    // Skip both if URL-type
    if (oldStr === '__SKIP__' || newStr === '__SKIP__') continue;

    if (oldStr !== newStr) {
      const label = fieldLabels[key] ?? autoLabel(key);
      changes.push(`${label}: "${oldStr}" → "${newStr}"`);
      oldParts.push(`${label}: ${oldStr}`);
      newParts.push(`${label}: ${newStr}`);
    }
  }

  if (changes.length === 0) {
    return { details: '', old_value: '', new_value: '' };
  }

  return {
    details: changes.join(' | '),
    old_value: oldParts.join(' | '),
    new_value: newParts.join(' | '),
  };
}
