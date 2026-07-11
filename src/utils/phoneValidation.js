/**
 * Validates a Bangladeshi mobile phone number.
 * Accepts: 01XXXXXXXXX (11 digits), +8801XXXXXXXXX, 8801XXXXXXXXX
 * Valid operator prefixes: 013-019 (GP, Robi, Banglalink, Airtel, Teletalk)
 */
export function isValidBDPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-().]/g, "");
  return /^(\+?880)?01[3-9]\d{8}$/.test(cleaned);
}

/** Formats a raw number to 01XXXXXXXXX for display */
export function normalizeBDPhone(phone) {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (/^\+?8801/.test(cleaned)) return "0" + cleaned.replace(/^\+?880/, "");
  return cleaned;
}
