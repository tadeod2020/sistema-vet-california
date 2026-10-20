import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://qjoilxivgxxjlzefbtka.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_7C_MmPrLsOTcatQH9evrGg_JvmJipbN';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseAnonKey.length > 20
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const META_PREFIX = '__VET_META__:';

function encodeMeta(humanText, metaObj) {
  try {
    return `${humanText || ''}\n${META_PREFIX}${JSON.stringify(metaObj)}`;
  } catch (e) {
    return humanText || '';
  }
}

function decodeMeta(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') {
    return { text: '', meta: null };
  }
  const idx = rawStr.indexOf(META_PREFIX);
  if (idx === -1) {
    // Also try pure JSON if it starts with {
    if (rawStr.trim().startsWith('{')) {
      try {
        return { text: '', meta: JSON.parse(rawStr.trim()) };
      } catch (e) {
        return { text: rawStr, meta: null };
      }
    }
    return { text: rawStr, meta: null };
  }
  const text = rawStr.slice(0, idx).replace(/\n$/, '');
  const jsonPart = rawStr.slice(idx + META_PREFIX.length);
  try {
    return { text, meta: JSON.parse(jsonPart) };
  } catch (e) {
    return { text, meta: null };
  }
}

export function formatPetAge(pet) {
  if (!pet) return '-';
  const unit = pet.ageUnit || (pet.ageMonths && !pet.ageYears ? 'meses' : 'años');
  if (unit === 'meses') {
    const months = pet.ageMonths !== undefined && pet.ageMonths !== '' ? Number(pet.ageMonths) : Number(pet.ageYears || 0);
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
  const years = pet.ageYears !== undefined && pet.ageYears !== '' ? Number(pet.ageYears) : 1;
  const extraMonths = pet.ageMonths ? Number(pet.ageMonths) : 0;
  if (extraMonths > 0) {
    return `${years} ${years === 1 ? 'año' : 'años'} y ${extraMonths} ${extraMonths === 1 ? 'mes' : 'meses'}`;
  }
  return `${years} ${years === 1 ? 'año' : 'años'}`;
}

// ============================================================================
// MAPPERS: APP STATE <-> SUPABASE TABLES
// ============================================================================

export function clientToRow(c) {
  return {
    id: String(c.id),
    name: c.name || 'Propietario',
    phone: c.phone || '',
    address: encodeMeta(c.address || '', {
      whatsapp: c.whatsapp || '',
      tag: c.tag || (c.isFrequent ? 'Cliente Frecuente' : 'Cliente Regular'),
      notes: c.notes || ''
    }),
    email: c.email || '',
    is_frequent: Boolean(c.isFrequent)
  };
}

export function rowToClient(r) {
  const { text: address, meta } = decodeMeta(r.address);
  const cleanDigits = (r.phone || '').replace(/\D/g, '');
  return {
    id: r.id,
    name: r.name || '',
    phone: r.phone || '',
    whatsapp: meta?.whatsapp || (cleanDigits ? (cleanDigits.startsWith('52') ? cleanDigits : `521${cleanDigits}`) : ''),
    email: r.email || '',
    address: address || '',
    isFrequent: Boolean(r.is_frequent),
    tag: meta?.tag || (r.is_frequent ? 'Cliente Frecuente' : 'Cliente Regular'),
    notes: meta?.notes || ''
  };
}

export function petToRow(p, validClientIds = new Set()) {
  const ageLabel = formatPetAge(p);
  const summaryMarks = [
    p.allergies && p.allergies !== 'Ninguna conocida' ? `Alergias: ${p.allergies}` : '',
    p.microchip ? `Chip: ${p.microchip}` : ''
  ].filter(Boolean).join(' | ');

  // Evita payloads descomunales que hagan fallar la API de Supabase con error 413 o timeout
  let safePhotoUrl = p.photoUrl || '';
  if (safePhotoUrl && safePhotoUrl.length > 95000) {
    safePhotoUrl = safePhotoUrl.slice(0, 85000);
  }

  const safeLabResults = (Array.isArray(p.labResults) ? p.labResults : []).map(l => {
    let safeFile = l.fileUrl || '';
    if (safeFile && safeFile.length > 180000) {
      safeFile = '';
    }
    return { ...l, fileUrl: safeFile };
  });

  return {
    id: String(p.id),
    client_id: p.clientId && validClientIds.has(p.clientId) ? p.clientId : null,
    name: p.name || 'Mascota',
    species: p.species || 'Canino',
    breed: p.breed || 'Sin especificar',
    gender: p.sex || 'Macho',
    color: p.color || 'Sin especificar',
    birth_date: ageLabel,
    weight: `${p.weightKg ?? 0} kg`,
    distinctive_marks: encodeMeta(summaryMarks, {
      clientId: p.clientId || '',
      ageYears: p.ageYears ?? (p.ageUnit === 'meses' ? 0 : 1),
      ageMonths: p.ageMonths ?? 0,
      ageUnit: p.ageUnit || 'años',
      weightKg: Number(p.weightKg ?? 0),
      allergies: p.allergies || 'Ninguna conocida',
      microchip: p.microchip || '',
      notes: p.notes || '',
      photoUrl: safePhotoUrl,
      clinicalNotes: Array.isArray(p.clinicalNotes) ? p.clinicalNotes : [],
      labResults: safeLabResults
    })
  };
}

export function rowToPet(r) {
  const { text, meta } = decodeMeta(r.distinctive_marks);
  const parsedWeight = parseFloat(String(r.weight || '0').replace(/[^\d.]/g, '')) || 0;
  const isMonthsBirth = String(r.birth_date || '').toLowerCase().includes('mes');
  const parsedAgeNum = parseFloat(String(r.birth_date || '1').replace(/[^\d.]/g, '')) || 1;

  return {
    id: r.id,
    clientId: r.client_id || meta?.clientId || '',
    name: r.name || '',
    species: r.species || 'Canino',
    breed: r.breed || 'Sin especificar',
    ageYears: meta?.ageYears !== undefined ? meta.ageYears : (isMonthsBirth ? 0 : parsedAgeNum),
    ageMonths: meta?.ageMonths !== undefined ? meta.ageMonths : (isMonthsBirth ? parsedAgeNum : 0),
    ageUnit: meta?.ageUnit || (isMonthsBirth ? 'meses' : 'años'),
    sex: r.gender || 'Macho',
    weightKg: meta?.weightKg !== undefined ? meta.weightKg : parsedWeight,
    color: r.color || 'Sin especificar',
    allergies: meta?.allergies || (text || 'Ninguna conocida'),
    microchip: meta?.microchip || '',
    notes: meta?.notes || '',
    photoUrl: meta?.photoUrl || '',
    clinicalNotes: Array.isArray(meta?.clinicalNotes) ? meta.clinicalNotes : [],
    labResults: Array.isArray(meta?.labResults) ? meta.labResults : []
  };
}

export function appointmentToRow(a, validClientIds = new Set(), validPetIds = new Set()) {
  return {
    id: String(a.id),
    date: a.date || new Date().toISOString().split('T')[0],
    time: a.timeHour || a.time || '09:00',
    client_id: a.clientId && validClientIds.has(a.clientId) ? a.clientId : null,
    client_name: a.clientName || 'Cliente',
    pet_name: a.petName || (Array.isArray(a.petNames) ? a.petNames.join(', ') : 'Mascota'),
    pet_id: a.petId && validPetIds.has(a.petId) ? a.petId : null,
    phone: a.phone || '',
    service: a.reason || a.service || 'Consulta General',
    status: a.status || 'Pendiente',
    notes: encodeMeta(a.assignedVet ? `Médico: ${a.assignedVet}` : '', {
      assignedVet: a.assignedVet || 'Dra. María José Mendoza Gutiérrez',
      petNames: Array.isArray(a.petNames) ? a.petNames : (a.petName ? a.petName.split(',').map(s => s.trim()).filter(Boolean) : []),
      slotIndex: a.slotIndex || 1
    })
  };
}

export function rowToAppointment(r) {
  const { meta } = decodeMeta(r.notes);
  const petNames = Array.isArray(meta?.petNames) && meta.petNames.length > 0
    ? meta.petNames
    : (r.pet_name ? r.pet_name.split(',').map(s => s.trim()).filter(Boolean) : []);
  return {
    id: r.id,
    date: r.date,
    timeHour: r.time || '09:00',
    clientName: r.client_name || '',
    petName: r.pet_name || petNames.join(', '),
    petNames,
    reason: r.service || '',
    status: r.status || 'Pendiente',
    assignedVet: meta?.assignedVet || 'Dra. María José Mendoza Gutiérrez',
    slotIndex: meta?.slotIndex || 1
  };
}

export function normalizeAndDeduplicateCages(cages = []) {
  const usedCodes = new Set();
  return cages.map((c, idx) => {
    if (!c) return c;
    const rawCode = String(c.code || `J-${String(idx + 1).padStart(2, '0')}`).trim();
    const rawName = String(c.name || '').trim();

    let candidateCode = rawCode || `J-${String(idx + 1).padStart(2, '0')}`;
    if (usedCodes.has(candidateCode.toLowerCase())) {
      if (rawName && !candidateCode.toLowerCase().endsWith(rawName.toLowerCase())) {
        candidateCode = `${rawCode} ${rawName}`.trim();
      } else {
        candidateCode = `${rawCode} #${idx + 1}`.trim();
      }
    }
    if (usedCodes.has(candidateCode.toLowerCase())) {
      candidateCode = `${candidateCode}-${String(c.id || idx).slice(-4)}`;
    }
    usedCodes.add(candidateCode.toLowerCase());

    return {
      ...c,
      code: candidateCode
    };
  });
}

export function normalizeAndDeduplicateRescues(rescues = []) {
  const usedCodes = new Set();
  return rescues.map((r, idx) => {
    if (!r) return r;
    const rawCode = String(r.code || `RES-${new Date().getFullYear()}-${String(idx + 1).padStart(3, '0')}`).trim();
    let candidateCode = rawCode;
    if (usedCodes.has(candidateCode.toLowerCase())) {
      candidateCode = `${rawCode}-${String(r.id || idx).slice(-4)}`;
    }
    usedCodes.add(candidateCode.toLowerCase());
    return {
      ...r,
      code: candidateCode
    };
  });
}

export function cageToRow(c) {
  const isOccupied = c.status === 'Ocupada';
  const needsCleaning = c.status === 'Necesita Limpieza';
  return {
    id: String(c.id),
    code: String(c.code || 'J-00').trim(),
    name: c.name || 'Jaula',
    size: c.size || 'Mediana',
    is_occupied: isOccupied,
    needs_cleaning: needsCleaning,
    patient_type: isOccupied ? 'Paciente Hospitalizado' : null,
    patient_id: isOccupied ? (c.currentOccupant?.patientId || null) : null,
    patient_name: isOccupied ? (c.currentOccupant?.patientName || null) : null,
    reason: isOccupied ? (c.currentOccupant?.reason || null) : null,
    entry_date: isOccupied ? (c.currentOccupant?.intakeTime || null) : null,
    discharge_date: null,
    vet_in_charge: isOccupied ? (c.currentOccupant?.ownerName || null) : null,
    notes: encodeMeta(c.cleaningNotes || '', {
      zone: c.zone || 'Hospitalización General',
      status: c.status || 'Disponible',
      lastCleaned: c.lastCleaned || 'Hoy',
      cleaningNotes: c.cleaningNotes,
      currentOccupant: c.currentOccupant || null
    })
  };
}

export function rowToCage(r) {
  const { text, meta } = decodeMeta(r.notes);
  const status = meta?.status || (r.is_occupied ? 'Ocupada' : r.needs_cleaning ? 'Necesita Limpieza' : 'Disponible');
  const currentOccupant = meta?.currentOccupant !== undefined
    ? meta.currentOccupant
    : (r.is_occupied && r.patient_name
      ? {
          patientId: r.patient_id || undefined,
          patientName: r.patient_name,
          ownerName: r.vet_in_charge || 'Cliente registrado',
          reason: r.reason || '',
          intakeTime: r.entry_date || ''
        }
      : null);

  return {
    id: r.id,
    code: r.code,
    name: r.name,
    size: r.size,
    zone: meta?.zone || 'Hospitalización General',
    status,
    currentOccupant,
    lastCleaned: meta?.lastCleaned || 'Hoy',
    ...(meta?.cleaningNotes || text ? { cleaningNotes: meta?.cleaningNotes || text } : {})
  };
}

export function rescueToRow(r) {
  return {
    id: String(r.id),
    rescue_code: r.code || `RES-${Date.now()}`,
    rescue_date: r.intakeDate || new Date().toISOString().split('T')[0],
    location_found: r.rescueLocation || 'Zona Centro, Tijuana',
    physical_description: r.physicalDescription || 'Sin descripción física especificada',
    approx_age: r.temperament || '',
    gender: r.rescuerName || 'Rescatista Anónimo',
    initial_condition: r.healthStatus || 'En tratamiento',
    status: r.healthStatus || 'En tratamiento',
    interventions: Array.isArray(r.interventions) ? r.interventions : []
  };
}

export function rowToRescue(r) {
  return {
    id: r.id,
    code: r.rescue_code || r.id,
    physicalDescription: r.physical_description || '',
    rescueLocation: r.location_found || 'Zona Centro, Tijuana',
    intakeDate: r.rescue_date || '',
    rescuerName: r.gender || 'Rescatista Anónimo',
    temperament: r.approx_age || '',
    healthStatus: r.status || r.initial_condition || 'En tratamiento',
    interventions: Array.isArray(r.interventions) ? r.interventions : []
  };
}

export function surgeryToRow(s) {
  const extraProcs = Array.isArray(s.additionalProcedures) ? s.additionalProcedures.filter(Boolean) : [];
  const fullTypeLabel = extraProcs.length > 0
    ? `${s.procedure} + ${extraProcs.join(', ')}`
    : (s.procedure || 'Procedimiento Quirúrgico');

  return {
    id: String(s.id),
    pet_id: s.petId || null,
    pet_name: s.patientName || 'Paciente',
    client_id: s.clientId || null,
    owner_name: s.ownerName || 'Cliente Registrado',
    owner_phone: s.patientType || 'Mascota con dueño',
    surgery_type: fullTypeLabel,
    date: s.date || new Date().toISOString().split('T')[0],
    surgeon: s.surgeon || 'Dra. María José Mendoza Gutiérrez',
    anesthesia_protocol: s.anesthesiaType || '',
    pre_op_notes: s.preOpNotes || '',
    procedure_description: encodeMeta(s.intraOpNotes || '', {
      procedure: s.procedure || '',
      additionalProcedures: extraProcs,
      intraOpNotes: s.intraOpNotes || '',
      anesthetist: s.anesthetist || 'Especialista en Anestesiología',
      patientType: s.patientType || 'Mascota con dueño',
      petId: s.petId || '',
      clientId: s.clientId || ''
    }),
    post_op_care: s.postOpNotes || '',
    status: s.status || 'Programada'
  };
}

export function rowToSurgery(r) {
  const { text, meta } = decodeMeta(r.procedure_description);
  return {
    id: r.id,
    petId: r.pet_id || meta?.petId || '',
    clientId: r.client_id || meta?.clientId || '',
    patientName: r.pet_name || '',
    patientType: meta?.patientType || r.owner_phone || 'Mascota con dueño',
    ownerName: r.owner_name || '',
    procedure: meta?.procedure || r.surgery_type || '',
    additionalProcedures: Array.isArray(meta?.additionalProcedures) ? meta.additionalProcedures : [],
    surgeon: r.surgeon || 'Dra. María José Mendoza Gutiérrez',
    anesthetist: meta?.anesthetist || 'Especialista en Anestesiología',
    date: r.date || '',
    anesthesiaType: r.anesthesia_protocol || '',
    preOpNotes: r.pre_op_notes || '',
    intraOpNotes: meta?.intraOpNotes !== undefined ? meta.intraOpNotes : (text || ''),
    postOpNotes: r.post_op_care || '',
    status: r.status || 'Programada'
  };
}

export function vaccinationToRow(v) {
  return {
    id: String(v.id),
    pet_id: String(v.petId || 'pet-general'),
    pet_name: v.petName || 'Mascota',
    owner_name: v.ownerName || 'Cliente Registrado',
    vaccine_name: v.vaccineName || 'Vacuna',
    manufacturer: v.manufacturer || '',
    lot_number: v.lotNumber || '',
    applied_date: v.appliedDate || new Date().toISOString().split('T')[0],
    due_date: v.dueDate || '',
    vet_name: v.vetName || 'Dra. María José Mendoza Gutiérrez',
    license_number: v.licenseNumber || '',
    notes: v.notes || '',
    is_travel_valid: v.isTravelValid !== false
  };
}

export function rowToVaccination(r) {
  return {
    id: r.id,
    petId: r.pet_id || '',
    petName: r.pet_name || '',
    ownerName: r.owner_name || '',
    vaccineName: r.vaccine_name || '',
    manufacturer: r.manufacturer || '',
    lotNumber: r.lot_number || '',
    appliedDate: r.applied_date || '',
    dueDate: r.due_date || '',
    vetName: r.vet_name || '',
    licenseNumber: r.license_number || '',
    notes: r.notes || '',
    isTravelValid: r.is_travel_valid !== false
  };
}

// ============================================================================
// REALTIME MULTI-DEVICE BROADCAST SYNC
// ============================================================================

const CHANNEL_NAME = 'vet-california-realtime-v1';

export function createRealtimeSyncChannel(onRemoteSync) {
  if (!supabase) return null;

  try {
    const channel = supabase.channel(CHANNEL_NAME, {
      config: { broadcast: { self: false } }
    });

    channel.on('broadcast', { event: 'clinic-sync' }, (event) => {
      console.log('📡 [Realtime] Cambio detectado en otro dispositivo:', event);
      if (typeof onRemoteSync === 'function') {
        onRemoteSync(event.payload || {});
      }
    });

    channel.subscribe((status) => {
      console.log('📡 [Realtime] Canal de sincronización multi-dispositivo:', status);
    });

    return channel;
  } catch (err) {
    console.warn('Error al iniciar canal de Realtime:', err);
    return null;
  }
}

export async function broadcastSync(channel, metadata = {}) {
  if (!channel) return;
  try {
    await channel.send({
      type: 'broadcast',
      event: 'clinic-sync',
      payload: {
        timestamp: Date.now(),
        ...metadata
      }
    });
  } catch (err) {
    console.warn('No se pudo emitir broadcast de sincronización:', err);
  }
}

// ============================================================================
// CLOUD SYNC OPERATIONS
// ============================================================================

export async function fetchAllFromSupabase() {
  if (!supabase) return null;

  const fetchPromise = Promise.all([
    supabase.from('clients').select('*').order('created_at', { ascending: false }),
    supabase.from('pets').select('*').order('created_at', { ascending: false }),
    supabase.from('appointments').select('*').order('created_at', { ascending: false }),
    supabase.from('cages').select('*').order('code', { ascending: true }),
    supabase.from('rescues').select('*').order('created_at', { ascending: false }),
    supabase.from('surgeries').select('*').order('created_at', { ascending: false }),
    supabase.from('vaccinations').select('*').order('created_at', { ascending: false })
  ]);

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Tiempo de espera agotado al conectar con Supabase (14s)')), 14000)
  );

  const [
    clientsRes,
    petsRes,
    aptsRes,
    cagesRes,
    rescuesRes,
    surgeriesRes,
    vacsRes
  ] = await Promise.race([fetchPromise, timeoutPromise]);

  const errors = [
    clientsRes.error,
    petsRes.error,
    aptsRes.error,
    cagesRes.error,
    rescuesRes.error,
    surgeriesRes.error,
    vacsRes.error
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors.map(e => e.message).join('; '));
  }

  return {
    clients: (clientsRes.data || []).map(rowToClient),
    pets: (petsRes.data || []).map(rowToPet),
    appointments: (aptsRes.data || []).map(rowToAppointment),
    cages: (cagesRes.data || []).map(rowToCage),
    rescues: (rescuesRes.data || []).map(rowToRescue),
    surgeries: (surgeriesRes.data || []).map(rowToSurgery),
    vaccinations: (vacsRes.data || []).map(rowToVaccination)
  };
}

export async function syncAllToSupabase(data) {
  if (!supabase || !data) return { success: false, error: 'Supabase no configurado' };

  const syncPromise = (async () => {
    const clients = data.clients || [];
    const pets = data.pets || [];
    const appointments = data.appointments || [];
    const cages = normalizeAndDeduplicateCages(data.cages || []);
    const rescues = normalizeAndDeduplicateRescues(data.rescues || []);
    const surgeries = data.surgeries || [];
    const vaccinations = data.vaccinations || [];

    const validClientIds = new Set(clients.map(c => c.id));
    const validPetIds = new Set(pets.map(p => p.id));
    const errors = [];

    // 1. Clients first (referenced by pets & appointments)
    if (clients.length > 0) {
      try {
        const rows = clients.map(clientToRow);
        const { error } = await supabase.from('clients').upsert(rows, { onConflict: 'id' });
        if (error) {
          console.warn('Clients batch upsert error, retrying individual rows:', error);
          for (const row of rows) {
            const { error: rErr } = await supabase.from('clients').upsert(row, { onConflict: 'id' });
            if (rErr) errors.push(`Cliente ${row.id}: ${rErr.message}`);
          }
        }
      } catch (e) {
        errors.push(`Clients: ${e.message}`);
      }
    }

    // 2. Pets (referenced by appointments)
    if (pets.length > 0) {
      try {
        const rows = pets.map(p => petToRow(p, validClientIds));
        const { error } = await supabase.from('pets').upsert(rows, { onConflict: 'id' });
        if (error) {
          console.warn('Pets batch upsert error, retrying individual rows:', error);
          for (const row of rows) {
            let res = await supabase.from('pets').upsert(row, { onConflict: 'id' });
            if (res.error && res.error.code === '23503') {
              res = await supabase.from('pets').upsert({ ...row, client_id: null }, { onConflict: 'id' });
            }
            if (res.error) errors.push(`Mascota ${row.id}: ${res.error.message}`);
          }
        }
      } catch (e) {
        errors.push(`Pets: ${e.message}`);
      }
    }

    // 3. Cages (safe against unique constraint 23505)
    if (cages.length > 0) {
      try {
        const rows = cages.map(cageToRow);
        const res = await supabase.from('cages').upsert(rows, { onConflict: 'id' });
        if (res.error) {
          console.warn('Cages batch upsert error, retrying with unique suffix:', res.error);
          for (const [idx, row] of rows.entries()) {
            let r = await supabase.from('cages').upsert(row, { onConflict: 'id' });
            if (r.error && r.error.code === '23505') {
              const safeCode = `${row.code} (${String(row.id || idx).slice(-4)})`;
              r = await supabase.from('cages').upsert({ ...row, code: safeCode }, { onConflict: 'id' });
            }
            if (r.error) errors.push(`Jaula ${row.id}: ${r.error.message}`);
          }
        }
      } catch (e) {
        errors.push(`Cages: ${e.message}`);
      }
    }

    // 4. Rescues
    if (rescues.length > 0) {
      try {
        const rows = rescues.map(rescueToRow);
        const res = await supabase.from('rescues').upsert(rows, { onConflict: 'id' });
        if (res.error) {
          console.warn('Rescues batch upsert error, retrying with unique suffix:', res.error);
          for (const [idx, row] of rows.entries()) {
            let r = await supabase.from('rescues').upsert(row, { onConflict: 'id' });
            if (r.error && r.error.code === '23505') {
              const safeCode = `${row.rescue_code}-${String(row.id || idx).slice(-4)}`;
              r = await supabase.from('rescues').upsert({ ...row, rescue_code: safeCode }, { onConflict: 'id' });
            }
            if (r.error) errors.push(`Rescate ${row.id}: ${r.error.message}`);
          }
        }
      } catch (e) {
        errors.push(`Rescues: ${e.message}`);
      }
    }

    // 5. Appointments
    if (appointments.length > 0) {
      try {
        const rows = appointments.map(a => appointmentToRow(a, validClientIds, validPetIds));
        const { error } = await supabase.from('appointments').upsert(rows, { onConflict: 'id' });
        if (error) {
          console.warn('Appointments batch upsert error, retrying individual rows:', error);
          for (const row of rows) {
            let r = await supabase.from('appointments').upsert(row, { onConflict: 'id' });
            if (r.error && r.error.code === '23503') {
              r = await supabase.from('appointments').upsert({ ...row, client_id: null, pet_id: null }, { onConflict: 'id' });
            }
            if (r.error) errors.push(`Cita ${row.id}: ${r.error.message}`);
          }
        }
      } catch (e) {
        errors.push(`Appointments: ${e.message}`);
      }
    }

    // 6. Surgeries
    if (surgeries.length > 0) {
      try {
        const rows = surgeries.map(surgeryToRow);
        const { error } = await supabase.from('surgeries').upsert(rows, { onConflict: 'id' });
        if (error) {
          console.warn('Surgeries batch upsert error, retrying individual rows:', error);
          for (const row of rows) {
            const { error: sErr } = await supabase.from('surgeries').upsert(row, { onConflict: 'id' });
            if (sErr) errors.push(`Cirugía ${row.id}: ${sErr.message}`);
          }
        }
      } catch (e) {
        errors.push(`Surgeries: ${e.message}`);
      }
    }

    // 7. Vaccinations
    if (vaccinations.length > 0) {
      try {
        const rows = vaccinations.map(vaccinationToRow);
        const { error } = await supabase.from('vaccinations').upsert(rows, { onConflict: 'id' });
        if (error) {
          console.warn('Vaccinations batch upsert error, retrying individual rows:', error);
          for (const row of rows) {
            const { error: vErr } = await supabase.from('vaccinations').upsert(row, { onConflict: 'id' });
            if (vErr) errors.push(`Vacuna ${row.id}: ${vErr.message}`);
          }
        }
      } catch (e) {
        errors.push(`Vaccinations: ${e.message}`);
      }
    }

    if (errors.length > 0) {
      console.warn('syncAllToSupabase encountered non-fatal issues:', errors);
      // Solo consideramos error bloqueante si fallaron colecciones enteras
      if (errors.length > 5) {
        return { success: false, error: errors.slice(0, 3).join('; ') };
      }
    }

    return { success: true };
  })();

  const timeoutPromise = new Promise(resolve =>
    setTimeout(() => resolve({ success: false, error: 'Tiempo de espera de sincronización agotado (16s)' }), 16000)
  );

  return Promise.race([syncPromise, timeoutPromise]);
}

export async function deleteRowFromSupabase(table, id) {
  if (!supabase || !id) return;
  const { error } = await supabase.from(table).delete().eq('id', String(id));
  if (error) {
    console.error(`Error deleting from ${table}:`, error);
  }
}

export async function clearAndResetSupabase(initialData) {
  if (!supabase) return;
  const tables = ['appointments', 'vaccinations', 'surgeries', 'rescues', 'pets', 'clients', 'cages'];
  for (const t of tables) {
    await supabase.from(t).delete().neq('id', '__never__');
  }
  if (initialData) {
    await syncAllToSupabase(initialData);
  }
}
