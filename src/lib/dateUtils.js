/**
 * Utilidades de fecha seguras con zona horaria local (Tijuana / America/Tijuana).
 * Evita el grave problema de toISOString().split('T')[0] que a partir de las 5:00 PM
 * salta al día siguiente en tiempo universal (UTC).
 */

export function getLocalDateString(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    return new Date().toLocaleDateString('en-CA');
  }
  return d.toLocaleDateString('en-CA');
}

export function getLocalExpiryDateString(years = 1) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toLocaleDateString('en-CA');
}

export function shiftLocalDateString(baseDateStr, days = 0) {
  const parts = (baseDateStr || getLocalDateString()).split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2] + days);
  return d.toLocaleDateString('en-CA');
}
