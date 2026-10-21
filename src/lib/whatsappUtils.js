/**
 * Utilidades para comunicación por WhatsApp (Tijuana B.C. / San Diego CA)
 */

export function cleanWhatsappNumber(rawPhone = '') {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';

  // Si ya tiene prefijo internacional
  if (digits.startsWith('52') && digits.length >= 12) return digits;
  if (digits.startsWith('1') && digits.length === 11) return digits;

  // Formato estándar de 10 dígitos
  if (digits.length === 10) {
    // Si es código de área binacional común de California / San Diego (619, 858, 760, 442) -> +1
    if (['619', '858', '760', '442'].includes(digits.slice(0, 3))) {
      return `1${digits}`;
    }
    // Por defecto México (+52)
    return `52${digits}`;
  }

  return digits;
}

export function buildAppointmentReminderMessage(apt) {
  const petsLabel = Array.isArray(apt.petNames) && apt.petNames.length > 0
    ? apt.petNames.join(', ')
    : (apt.petName || 'su mascota');

  const lines = [
    `¡Hola ${apt.clientName || 'estimado(a) propietario(a)'}! 🐾`,
    ``,
    `Le recordamos su cita en *Servicio Veterinario California*:`,
    `📅 *Fecha:* ${apt.date}`,
    `⏰ *Hora:* ${apt.timeHour || apt.time || '09:00'}`,
    `🐶 *Paciente(s):* ${petsLabel}`,
    `🩺 *Motivo:* ${apt.reason || apt.service || 'Consulta General'}`,
    apt.assignedVet ? `👨‍⚕️ *Médico Asignado:* ${apt.assignedVet}` : null,
    ``,
    `📍 *Ubicación:* Calle 3ra #7184, Zona Centro, Tijuana, B.C.`,
    `☎️ *Teléfono:* (664) 685-8512`,
    ``,
    `Por favor, responda a este mensaje para confirmar su asistencia. ¡Los esperamos!`
  ].filter(line => line !== null);

  return lines.join('\n');
}

export function getAppointmentWhatsappUrl(apt, client = null, explicitPhone = null) {
  const rawPhone = explicitPhone || apt.phone || client?.phone || client?.whatsapp || '';
  const cleanNum = cleanWhatsappNumber(rawPhone);
  if (!cleanNum) return null;
  const text = buildAppointmentReminderMessage(apt);
  return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
}
