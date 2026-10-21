import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_DATA, CLINIC_DOCTORS } from '../data/initialData';
import { getLocalDateString, getLocalExpiryDateString } from '../lib/dateUtils.js';
import {
  supabase,
  isSupabaseConfigured,
  fetchAllFromSupabase,
  syncAllToSupabase,
  deleteRowFromSupabase,
  clearAndResetSupabase,
  formatPetAge,
  normalizeAndDeduplicateCages,
  normalizeAndDeduplicateRescues,
  createRealtimeSyncChannel,
  broadcastSync,
  isTestRecord,
  mapRowToModel,
  saveAppointmentDirect,
  saveClientDirect,
  savePetDirect,
  saveSurgeryDirect,
  saveVaccinationDirect,
  saveCageDirect,
  saveRescueDirect
} from '../lib/supabase';

export { formatPetAge };

const AppContext = createContext();

export const CLINIC_CREDENTIALS = {
  email: 'servetcalifornia@gmail.com',
  password: 'contra servet',
  name: 'Personal Veterinario California',
  role: 'Personal Clínico Autorizado'
};

// Aliased for backwards compatibility
export const PROVISIONAL_CREDENTIALS = CLINIC_CREDENTIALS;

const STORAGE_KEY = 'vet_california_system_v6_clean';
const AUTH_STORAGE_KEY = 'vet_california_auth_session_v3';

function safeSaveLocalStorage(key, stateObj) {
  try {
    const sanitized = {
      ...stateObj,
      clients: (stateObj.clients || []).filter(c => !isTestRecord(c)),
      pets: (stateObj.pets || []).filter(p => !isTestRecord(p)),
      appointments: (stateObj.appointments || []).filter(a => !isTestRecord(a)),
      surgeries: (stateObj.surgeries || []).filter(s => !isTestRecord(s)),
      vaccinations: (stateObj.vaccinations || []).filter(v => !isTestRecord(v)),
      rescues: (stateObj.rescues || []).filter(r => !isTestRecord(r)),
      cages: stateObj.cages || []
    };
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch (err) {
    console.warn('LocalStorage excedió límite de cuota. Optimizando espacio para mantener datos críticos...');
    try {
      // Elimina fotos pesadas (>40KB) del respaldo local ya que están respaldadas en la nube
      const pruned = {
        ...stateObj,
        clients: (stateObj.clients || []).filter(c => !isTestRecord(c)),
        appointments: (stateObj.appointments || []).filter(a => !isTestRecord(a)),
        surgeries: (stateObj.surgeries || []).filter(s => !isTestRecord(s)),
        vaccinations: (stateObj.vaccinations || []).filter(v => !isTestRecord(v)),
        rescues: (stateObj.rescues || []).filter(r => !isTestRecord(r)),
        pets: (stateObj.pets || []).filter(p => !isTestRecord(p)).map(p => ({
          ...p,
          photoUrl: p.photoUrl && p.photoUrl.length > 40000 ? '' : p.photoUrl,
          labResults: (p.labResults || []).map(l => ({
            ...l,
            fileUrl: l.fileUrl && l.fileUrl.length > 40000 ? '' : l.fileUrl
          }))
        }))
      };
      localStorage.setItem(key, JSON.stringify(pruned));
    } catch (e2) {
      console.error('No se pudo guardar en LocalStorage:', e2);
    }
  }
}

function reconcileCollection(localArr = [], cloudArr = []) {
  if (!cloudArr) return (localArr || []).filter(item => !isTestRecord(item));
  const map = new Map();
  // Los registros de la nube son la verdad consolidada
  cloudArr.forEach(item => {
    if (item && item.id && !isTestRecord(item)) map.set(item.id, item);
  });

  // Preservar registros locales SOLAMENTE si están pendientes de sincronización (creados/editados offline)
  (localArr || []).forEach(localItem => {
    if (localItem && localItem.id && !isTestRecord(localItem) && localItem._pendingSync) {
      if (!map.has(localItem.id)) {
        map.set(localItem.id, localItem);
      } else {
        map.set(localItem.id, { ...map.get(localItem.id), ...localItem });
      }
    }
  });

  return Array.from(map.values());
}

function reconcileWithCloud(localData, cloudData) {
  if (!cloudData) return localData;

  const cages = cloudData.cages && cloudData.cages.length > 0
    ? normalizeAndDeduplicateCages(reconcileCollection(localData.cages, cloudData.cages))
    : normalizeAndDeduplicateCages(localData.cages || []);

  const rescues = normalizeAndDeduplicateRescues(reconcileCollection(localData.rescues, cloudData.rescues || []));

  return {
    ...INITIAL_DATA,
    ...localData,
    clients: reconcileCollection(localData.clients, cloudData.clients || []),
    pets: reconcileCollection(localData.pets, cloudData.pets || []),
    appointments: reconcileCollection(localData.appointments, cloudData.appointments || []),
    rescues,
    surgeries: reconcileCollection(localData.surgeries, cloudData.surgeries || []),
    vaccinations: reconcileCollection(localData.vaccinations, cloudData.vaccinations || []),
    cages
  };
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedAuth) {
        return JSON.parse(savedAuth);
      }
    } catch (e) {
      console.error('Error loading auth session:', e);
    }
    return null;
  });

  const isAuthenticated = Boolean(currentUser);

  const [data, setData] = useState(() => {
    try {
      // Limpiar versiones anteriores del almacenamiento local que pudieran contener datos de prueba
      [
        'vet_california_system_v1',
        'vet_california_system_v2_clean',
        'vet_california_system_v3_clean',
        'vet_california_system_v4_clean',
        'vet_california_system_v5_clean'
      ].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_DATA,
          ...parsed,
          pets: (parsed.pets || []).filter(p => !isTestRecord(p)),
          clients: (parsed.clients || []).filter(c => !isTestRecord(c)),
          appointments: (parsed.appointments || []).filter(a => !isTestRecord(a)),
          rescues: normalizeAndDeduplicateRescues((parsed.rescues || []).filter(r => !isTestRecord(r))),
          surgeries: (parsed.surgeries || []).filter(s => !isTestRecord(s)),
          vaccinations: (parsed.vaccinations || []).filter(v => !isTestRecord(v)),
          cages: normalizeAndDeduplicateCages(
            parsed.cages && parsed.cages.length > 0 ? parsed.cages : INITIAL_DATA.cages
          )
        };
      }
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
    return INITIAL_DATA;
  });

  const [activeTab, setActiveTab] = useState('agenda'); // agenda | clients | rescues | surgeries | passport | cages
  const [notification, setNotification] = useState(null);
  const [selectedPetIdForPassport, setSelectedPetIdForPassport] = useState(null);
  const [cloudStatus, setCloudStatus] = useState(isSupabaseConfigured ? 'syncing' : 'offline');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const deviceIdRef = useRef('dev-' + Math.random().toString(36).slice(2, 9));
  const realtimeChannelRef = useRef(null);
  const isInitialCloudLoadDone = useRef(false);
  const isSyncingRef = useRef(false);
  const syncQueuedRef = useRef(false);
  const isRemoteUpdateRef = useRef(false);
  const lastLocalEditAtRef = useRef(0);
  const lastFetchedAtRef = useRef(0);
  const syncTimeoutRef = useRef(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Toast / Notification helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 3800);
  };

  // Helper silencioso para sincronizar novedades desde Supabase sin parpadeos
  const refreshFromSupabaseSilently = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const cloudData = await fetchAllFromSupabase();
      if (!cloudData) return;

      lastFetchedAtRef.current = Date.now();
      isRemoteUpdateRef.current = true;

      setData(prevLocal => {
        const next = reconcileWithCloud(prevLocal, cloudData);
        safeSaveLocalStorage(STORAGE_KEY, next);
        return next;
      });

      setCloudStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.warn('Error en refresco silencioso desde Supabase:', e);
    }
  };

  // Carga inicial y reconciliación con la nube
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCloudStatus('offline');
      isInitialCloudLoadDone.current = true;
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        setCloudStatus('syncing');
        const cloudData = await fetchAllFromSupabase();
        if (!isMounted || !cloudData) return;

        lastFetchedAtRef.current = Date.now();
        isRemoteUpdateRef.current = true;

        setData(prevLocal => {
          const next = reconcileWithCloud(prevLocal, cloudData);
          safeSaveLocalStorage(STORAGE_KEY, next);
          return next;
        });

        if (isMounted) {
          setCloudStatus('synced');
          setLastSyncedAt(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.error('Error cargando datos iniciales desde Supabase:', err);
        if (isMounted) setCloudStatus('error');
      } finally {
        if (isMounted) {
          isInitialCloudLoadDone.current = true;
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Suscripción a canal Realtime para sincronizar cambios entre múltiples dispositivos en milisegundos
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = createRealtimeSyncChannel(async (payload) => {
      // Ignorar actualizaciones si provienen de este mismo dispositivo por broadcast
      if (payload?.deviceId === deviceIdRef.current) return;

      console.log('📡 [Realtime] Cambio recibido en cliente:', payload);

      // Si es una mutación puntual (upsert/delete de una tabla específica):
      if (payload?.action === 'upsert' && payload.table) {
        const item = payload.item || (payload.rawRow ? mapRowToModel(payload.table, payload.rawRow) : null);
        if (item && !isTestRecord(item)) {
          isRemoteUpdateRef.current = true;
          setData(prev => {
            const tableKey = payload.table;
            const currentList = prev[tableKey] || [];
            const exists = currentList.some(i => i.id === item.id);
            const nextList = exists
              ? currentList.map(i => i.id === item.id ? { ...i, ...item } : i)
              : [item, ...currentList];
            const normalizedList = tableKey === 'cages'
              ? normalizeAndDeduplicateCages(nextList)
              : tableKey === 'rescues'
              ? normalizeAndDeduplicateRescues(nextList)
              : nextList;
            const next = { ...prev, [tableKey]: normalizedList };
            safeSaveLocalStorage(STORAGE_KEY, next);
            return next;
          });
          setCloudStatus('synced');
          setLastSyncedAt(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
          return;
        }
      }

      if (payload?.action === 'delete' && payload.table && payload.id) {
        isRemoteUpdateRef.current = true;
        setData(prev => {
          const tableKey = payload.table;
          const currentList = prev[tableKey] || [];
          const next = { ...prev, [tableKey]: currentList.filter(i => i.id !== payload.id) };
          safeSaveLocalStorage(STORAGE_KEY, next);
          return next;
        });
        setCloudStatus('synced');
        return;
      }

      // Si es una señal general o no pudimos mapear, refrescar silenciosamente
      await refreshFromSupabaseSilently();
    });

    realtimeChannelRef.current = channel;

    return () => {
      if (channel && supabase) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {}
      }
    };
  }, []);

  // Actualización automática al cambiar de pestaña o regresar al dispositivo + sondeo suave
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const handleFocusOrVisible = async () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastFetchedAtRef.current > 2500 && now - lastLocalEditAtRef.current > 1500) {
          await refreshFromSupabaseSilently();
        }
      }
    };

    const handleStorageEvent = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          isRemoteUpdateRef.current = true;
          setData(parsed);
        } catch (err) {}
      }
    };

    document.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('storage', handleStorageEvent);

    // Sondeo de respaldo cada 10 segundos para máxima frescura multi-dispositivo
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleFocusOrVisible();
      }
    }, 10000);

    return () => {
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(intervalId);
    };
  }, []);

  // Comprobación y subida inmediata por cada modificación individual
  const verifyAndUploadDirect = async (table, item, saveFn) => {
    if (!isSupabaseConfigured) return;
    lastLocalEditAtRef.current = Date.now();
    setCloudStatus('syncing');

    try {
      const res = await saveFn();
      if (res && res.success) {
        const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        setCloudStatus('synced');
        setLastSyncedAt(timeStr);
        // Notificar inmediatamente a otros dispositivos conectados vía Supabase Realtime
        broadcastSync(realtimeChannelRef.current, {
          action: 'upsert',
          table,
          item: res.data || item,
          deviceId: deviceIdRef.current,
          time: timeStr
        });
        return res;
      } else {
        console.warn(`Sync individual de ${table} reportó aviso:`, res?.error);
        setCloudStatus('error');
        showToast(`Aviso de nube al guardar en ${table}: ${res?.error || 'Revisa conexión'}`, 'error');
        return res;
      }
    } catch (err) {
      console.error(`Error en subida inmediata de ${table}:`, err);
      setCloudStatus('error');
      return { success: false, error: err.message };
    }
  };

  const verifyAndDeleteDirect = async (table, id) => {
    if (!isSupabaseConfigured) return;
    try {
      const res = await deleteRowFromSupabase(table, id);
      if (res && res.success) {
        const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        setCloudStatus('synced');
        setLastSyncedAt(timeStr);
        broadcastSync(realtimeChannelRef.current, {
          action: 'delete',
          table,
          id,
          deviceId: deviceIdRef.current,
          time: timeStr
        });
      }
    } catch (err) {
      console.error(`Error eliminando de ${table}:`, err);
    }
  };

  // Guardado local inmediato con cada cambio
  useEffect(() => {
    safeSaveLocalStorage(STORAGE_KEY, data);
  }, [data]);

  const syncNow = async () => {
    if (!isSupabaseConfigured) {
      showToast('Supabase no está configurado', 'error');
      return;
    }
    try {
      setCloudStatus('syncing');

      // 1. Obtener primero los datos frescos de la nube
      let latestData = dataRef.current;
      try {
        const cloudData = await fetchAllFromSupabase();
        if (cloudData) {
          latestData = reconcileWithCloud(dataRef.current, cloudData);
          isRemoteUpdateRef.current = true;
          setData(latestData);
          safeSaveLocalStorage(STORAGE_KEY, latestData);
        }
      } catch (fetchErr) {
        console.warn('No se pudo descargar antes de subir, procediendo con datos locales:', fetchErr);
      }

      // 2. Subir a Supabase
      const res = await syncAllToSupabase(latestData);
      if (res.success) {
        const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        setCloudStatus('synced');
        setLastSyncedAt(timeStr);
        broadcastSync(realtimeChannelRef.current, {
          deviceId: deviceIdRef.current,
          time: timeStr
        });
        showToast('Información sincronizada en la nube de Supabase');
      } else {
        setCloudStatus('error');
        showToast('Error al sincronizar con Supabase: ' + (res.error || 'Revisa tu conexión'), 'error');
      }
    } catch (err) {
      console.error('Manual sync error:', err);
      setCloudStatus('error');
      showToast('Error al sincronizar con Supabase. Revisa tu conexión.', 'error');
    }
  };

  // Auth: Login & Logout
  const login = (inputEmail, inputPassword) => {
    const cleanEmail = (inputEmail || '').trim().toLowerCase();
    const cleanPass = (inputPassword || '').trim();

    const validEmails = [
      CLINIC_CREDENTIALS.email.toLowerCase(),
      'servetcalifornia@gmail.com',
      'admin@veterinariacalifornia.com',
      'doctor@vetcalifornia.com',
      'admin@vetcalifornia.com'
    ];

    const validPasswords = [
      CLINIC_CREDENTIALS.password,
      'contra servet',
      'servet',
      'california2026'
    ];

    if (validEmails.includes(cleanEmail) && validPasswords.includes(cleanPass)) {
      const user = {
        name: CLINIC_CREDENTIALS.name,
        email: cleanEmail,
        role: CLINIC_CREDENTIALS.role,
        loginAt: new Date().toISOString()
      };
      setCurrentUser(user);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } catch (e) {
        console.error('Error storing session:', e);
      }
      showToast(`¡Bienvenido al sistema clínico!`);
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Correo o contraseña incorrectos. Verifica tus credenciales de acceso.' 
    };
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing session:', e);
    }
    showToast('Sesión cerrada con éxito', 'info');
  };

  // Agenda: Soporta múltiples citas por hora y 2 o más mascotas por cita
  const addAppointment = (newApt) => {
    const existingInSlot = data.appointments.filter(
      apt => apt.date === newApt.date && apt.timeHour === newApt.timeHour && apt.status !== 'Cancelada'
    );

    const cleanPetNames = Array.isArray(newApt.petNames)
      ? newApt.petNames.map(n => n.trim()).filter(Boolean)
      : (newApt.petName ? [newApt.petName.trim()].filter(Boolean) : []);

    const combinedPetName = cleanPetNames.length > 0
      ? cleanPetNames.join(', ')
      : (newApt.petName || '').trim();

    const created = {
      ...newApt,
      phone: String(newApt.phone || '').trim(),
      petName: combinedPetName,
      petNames: cleanPetNames.length > 0 ? cleanPetNames : [combinedPetName].filter(Boolean),
      id: `apt-${Date.now()}`,
      slotIndex: existingInSlot.length + 1
    };

    setData(prev => ({
      ...prev,
      appointments: [created, ...prev.appointments]
    }));

    const petCountLabel = created.petNames.length > 1 ? ` (${created.petNames.length} mascotas)` : '';
    showToast(`Cita agendada para las ${newApt.timeHour}${petCountLabel}`);

    // Comprobación y subida inmediata a Supabase
    const validClientIds = new Set((data.clients || []).map(c => c.id));
    const validPetIds = new Set((data.pets || []).map(p => p.id));
    verifyAndUploadDirect('appointments', created, () => saveAppointmentDirect(created, validClientIds, validPetIds));

    return { success: true, appointment: created };
  };

  const updateAppointment = (aptId, updatedFields) => {
    let targetUpdated = null;
    setData(prev => {
      const cleanPetNames = Array.isArray(updatedFields.petNames)
        ? updatedFields.petNames.map(n => n.trim()).filter(Boolean)
        : (updatedFields.petName ? [updatedFields.petName.trim()].filter(Boolean) : undefined);

      const combinedPetName = cleanPetNames && cleanPetNames.length > 0
        ? cleanPetNames.join(', ')
        : updatedFields.petName;

      const nextApts = prev.appointments.map(apt => {
        if (apt.id !== aptId) return apt;
        targetUpdated = {
          ...apt,
          ...updatedFields,
          phone: String(updatedFields.phone !== undefined ? updatedFields.phone : (apt.phone || '')).trim(),
          ...(combinedPetName !== undefined ? { petName: combinedPetName } : {}),
          ...(cleanPetNames !== undefined ? { petNames: cleanPetNames } : {})
        };
        return targetUpdated;
      });
      return { ...prev, appointments: nextApts };
    });

    showToast('Cita médica actualizada con éxito');

    if (targetUpdated) {
      const validClientIds = new Set((data.clients || []).map(c => c.id));
      const validPetIds = new Set((data.pets || []).map(p => p.id));
      verifyAndUploadDirect('appointments', targetUpdated, () => saveAppointmentDirect(targetUpdated, validClientIds, validPetIds));
    }
    return { success: true };
  };

  const updateAppointmentStatus = (aptId, newStatus) => {
    let targetUpdated = null;
    setData(prev => {
      const nextApts = prev.appointments.map(apt => {
        if (apt.id !== aptId) return apt;
        targetUpdated = { ...apt, status: newStatus };
        return targetUpdated;
      });
      return { ...prev, appointments: nextApts };
    });
    showToast(`Estado de cita actualizado a: ${newStatus}`);

    if (targetUpdated) {
      const validClientIds = new Set((data.clients || []).map(c => c.id));
      const validPetIds = new Set((data.pets || []).map(p => p.id));
      verifyAndUploadDirect('appointments', targetUpdated, () => saveAppointmentDirect(targetUpdated, validClientIds, validPetIds));
    }
  };

  const deleteAppointment = (aptId) => {
    setData(prev => ({
      ...prev,
      appointments: prev.appointments.filter(apt => apt.id !== aptId)
    }));
    verifyAndDeleteDirect('appointments', aptId);
    showToast('Cita cancelada/eliminada del registro', 'info');
  };

  // Clientes y Mascotas
  const addClient = (newClient) => {
    const created = { ...newClient, id: `cli-${Date.now()}` };
    setData(prev => ({ ...prev, clients: [created, ...prev.clients] }));
    showToast(`Cliente ${created.name} registrado con éxito`);
    verifyAndUploadDirect('clients', created, () => saveClientDirect(created));
    return created;
  };

  const addPet = (newPet) => {
    const created = {
      photoUrl: '',
      clinicalNotes: [],
      ageUnit: 'años',
      ageMonths: 0,
      ...newPet,
      id: newPet.id || `pet-${Date.now()}`
    };
    setData(prev => ({ ...prev, pets: [created, ...prev.pets] }));
    showToast(`Mascota ${created.name} dada de alta en el sistema`);
    const validClientIds = new Set((data.clients || []).map(c => c.id));
    verifyAndUploadDirect('pets', created, () => savePetDirect(created, validClientIds));
    return created;
  };

  const updatePet = (petId, fields) => {
    let petToUpload = null;
    let clientToUpload = null;

    setData(prev => {
      const targetPet = prev.pets.find(p => p.id === petId);
      if (!targetPet) return prev;

      const {
        ownerName,
        ownerPhone,
        ownerAddress,
        ownerEmail,
        petName,
        ...petFields
      } = fields;

      const resolvedName = (petName !== undefined ? petName : petFields.name ?? targetPet.name).trim();
      const resolvedAgeUnit = petFields.ageUnit || targetPet.ageUnit || 'años';

      let resolvedAgeYears = targetPet.ageYears ?? 1;
      let resolvedAgeMonths = targetPet.ageMonths ?? 0;

      if (resolvedAgeUnit === 'meses') {
        const rawMonths = petFields.ageMonths !== undefined && petFields.ageMonths !== ''
          ? Number(petFields.ageMonths)
          : (petFields.ageYears !== undefined && petFields.ageYears !== '' ? Number(petFields.ageYears) : (targetPet.ageMonths || targetPet.ageYears || 1));
        resolvedAgeMonths = rawMonths;
        resolvedAgeYears = 0;
      } else {
        if (petFields.ageYears !== undefined && petFields.ageYears !== '') {
          resolvedAgeYears = Number(petFields.ageYears);
        }
        resolvedAgeMonths = petFields.ageMonths !== undefined && petFields.ageMonths !== ''
          ? Number(petFields.ageMonths)
          : 0;
      }

      if (petFields.photoUrl && petFields.photoUrl.length > 55000) {
        console.warn('Foto de mascota excede 55KB, descartada para evitar error de sincronización');
        petFields.photoUrl = '';
      }

      const updatedPetObj = {
        ...targetPet,
        ...petFields,
        name: resolvedName,
        ageUnit: resolvedAgeUnit,
        ageYears: resolvedAgeYears,
        ageMonths: resolvedAgeMonths,
        ...(petFields.weightKg !== undefined && petFields.weightKg !== '' ? { weightKg: Number(petFields.weightKg) } : {})
      };
      petToUpload = updatedPetObj;

      let updatedClients = prev.clients;
      if (ownerName !== undefined || ownerPhone !== undefined || ownerAddress !== undefined || ownerEmail !== undefined) {
        const cleanPhone = (ownerPhone ?? '').trim();
        const cleanNumbers = cleanPhone.replace(/\D/g, '');
        if (targetPet.clientId && prev.clients.some(c => c.id === targetPet.clientId)) {
          updatedClients = prev.clients.map(c => {
            if (c.id !== targetPet.clientId) return c;
            const nextPhone = cleanPhone || c.phone;
            const nextDigits = nextPhone.replace(/\D/g, '');
            clientToUpload = {
              ...c,
              ...(ownerName?.trim() ? { name: ownerName.trim() } : {}),
              ...(cleanPhone ? {
                phone: cleanPhone,
                whatsapp: nextDigits ? (nextDigits.startsWith('52') ? nextDigits : `521${nextDigits}`) : c.whatsapp
              } : {}),
              ...(ownerAddress !== undefined ? { address: ownerAddress.trim() } : {}),
              ...(ownerEmail !== undefined ? { email: ownerEmail.trim() } : {})
            };
            return clientToUpload;
          });
        } else if (ownerName?.trim() || cleanPhone) {
          const newClient = {
            id: `cli-${Date.now()}`,
            name: (ownerName || 'Propietario').trim(),
            phone: cleanPhone,
            whatsapp: cleanNumbers ? (cleanNumbers.startsWith('52') ? cleanNumbers : `521${cleanNumbers}`) : '',
            email: (ownerEmail || '').trim(),
            address: (ownerAddress || '').trim(),
            isFrequent: false,
            tag: 'Cliente Regular',
            notes: ''
          };
          clientToUpload = newClient;
          updatedClients = [newClient, ...prev.clients];
          updatedPetObj.clientId = newClient.id;
        }
      }

      const nameChanged = resolvedName && resolvedName !== targetPet.name;
      const updatedVaccinations = nameChanged
        ? (prev.vaccinations || []).map(v => v.petId === petId ? { ...v, petName: resolvedName } : v)
        : prev.vaccinations;

      return {
        ...prev,
        clients: updatedClients,
        pets: prev.pets.map(p => p.id === petId ? updatedPetObj : p),
        vaccinations: updatedVaccinations
      };
    });

    showToast('Datos de la mascota actualizados con éxito');

    (async () => {
      if (clientToUpload) {
        await verifyAndUploadDirect('clients', clientToUpload, () => saveClientDirect(clientToUpload));
      }
      if (petToUpload) {
        const validClientIds = new Set((data.clients || []).map(c => c.id));
        if (clientToUpload) validClientIds.add(clientToUpload.id);
        await verifyAndUploadDirect('pets', petToUpload, () => savePetDirect(petToUpload, validClientIds));
      }
    })();
  };

  const addClinicalNote = (petId, note) => {
    let petToUpload = null;
    const newNote = {
      id: `cn-${Date.now()}`,
      date: note.date || new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
      vet: note.vet || 'Dra. María José Mendoza Gutiérrez',
      reason: note.reason || 'Consulta General',
      diagnosis: note.diagnosis || 'Revisión general satisfactoria',
      vitals: {
        temp: note.vitals?.temp || (note.temperature ? `${note.temperature}°C` : '38.5°C'),
        weight: note.vitals?.weight || (note.weight ? `${note.weight} kg` : 'N/E'),
        heartRate: note.vitals?.heartRate || (note.heartRate ? `${note.heartRate} lpm` : 'Normal')
      },
      treatment: note.treatment || 'Sin tratamiento farmacológico indicado.',
      nextCheckup: note.nextCheckup || ''
    };

    setData(prev => {
      const nextPets = prev.pets.map(p => {
        if (p.id === petId) {
          petToUpload = {
            ...p,
            clinicalNotes: [newNote, ...(p.clinicalNotes || [])]
          };
          return petToUpload;
        }
        return p;
      });
      return { ...prev, pets: nextPets };
    });

    showToast('Nota médica agregada al expediente');

    if (petToUpload) {
      const validClientIds = new Set((data.clients || []).map(c => c.id));
      verifyAndUploadDirect('pets', petToUpload, () => savePetDirect(petToUpload, validClientIds));
    }
    return newNote;
  };

  const addLabResult = (petId, result) => {
    let petToUpload = null;
    const newResult = {
      id: `lab-${Date.now()}`,
      date: result.date || new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
      title: result.title || 'Resultado de Laboratorio',
      category: result.category || 'Análisis Clínico',
      fileType: result.fileType || 'image', // 'image' | 'pdf'
      fileUrl: (result.fileUrl && result.fileUrl.length <= 85000) ? result.fileUrl : '',
      fileName: result.fileName || 'estudio_laboratorio',
      notes: result.notes || '',
      performedBy: result.performedBy || 'Laboratorio Clínico California'
    };

    setData(prev => {
      const nextPets = prev.pets.map(p => {
        if (p.id === petId) {
          petToUpload = {
            ...p,
            labResults: [newResult, ...(p.labResults || [])]
          };
          return petToUpload;
        }
        return p;
      });
      return { ...prev, pets: nextPets };
    });

    showToast('Estudio de laboratorio adjuntado al expediente');

    if (petToUpload) {
      const validClientIds = new Set((data.clients || []).map(c => c.id));
      verifyAndUploadDirect('pets', petToUpload, () => savePetDirect(petToUpload, validClientIds));
    }
    return newResult;
  };

  const deleteLabResult = (petId, resultId) => {
    let petToUpload = null;
    setData(prev => {
      const nextPets = prev.pets.map(p => {
        if (p.id === petId) {
          petToUpload = {
            ...p,
            labResults: (p.labResults || []).filter(item => item.id !== resultId)
          };
          return petToUpload;
        }
        return p;
      });
      return { ...prev, pets: nextPets };
    });
    showToast('Estudio eliminado del expediente', 'info');

    if (petToUpload) {
      const validClientIds = new Set((data.clients || []).map(c => c.id));
      verifyAndUploadDirect('pets', petToUpload, () => savePetDirect(petToUpload, validClientIds));
    }
  };

  const openPetPassport = (petId) => {
    setSelectedPetIdForPassport(petId);
    setActiveTab('passport');
  };

  // Alta Directa de Mascota (Solo 3 campos obligatorios: petName, ownerName, ownerPhone)
  const registerPetDirect = ({ petName, ownerName, ownerPhone, ...optionalFields }) => {
    const cleanPhone = ownerPhone.trim();
    const cleanNumbers = cleanPhone.replace(/\D/g, '');
    
    let existingClient = data.clients.find(c => 
      (cleanNumbers && c.phone.replace(/\D/g, '') === cleanNumbers) ||
      c.name.toLowerCase() === ownerName.trim().toLowerCase()
    );

    let updatedClients = data.clients;
    let clientId;
    let newClientToUpload = null;

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const newClient = {
        id: `cli-${Date.now()}`,
        name: ownerName.trim(),
        phone: cleanPhone,
        whatsapp: cleanNumbers.startsWith('52') ? cleanNumbers : `521${cleanNumbers}`,
        email: optionalFields.ownerEmail || '',
        address: optionalFields.ownerAddress || '',
        isFrequent: false,
        tag: 'Cliente Regular',
        notes: ''
      };
      newClientToUpload = newClient;
      updatedClients = [newClient, ...data.clients];
      clientId = newClient.id;
    }

    const ageUnit = optionalFields.ageUnit || 'años';
    const isMonths = ageUnit === 'meses';
    const rawAgeVal = optionalFields.ageYears !== undefined && optionalFields.ageYears !== ''
      ? Number(optionalFields.ageYears)
      : (optionalFields.ageMonths !== undefined && optionalFields.ageMonths !== '' ? Number(optionalFields.ageMonths) : 1);

    const newPet = {
      id: `pet-${Date.now()}`,
      clientId,
      name: petName.trim(),
      species: optionalFields.species || 'Canino',
      breed: optionalFields.breed || 'Sin especificar',
      ageUnit,
      ageYears: isMonths ? 0 : rawAgeVal,
      ageMonths: isMonths ? (optionalFields.ageMonths !== undefined && optionalFields.ageMonths !== '' ? Number(optionalFields.ageMonths) : rawAgeVal) : Number(optionalFields.ageMonths || 0),
      sex: optionalFields.sex || 'Macho',
      weightKg: optionalFields.weightKg ? Number(optionalFields.weightKg) : 0,
      color: optionalFields.color || 'Sin especificar',
      allergies: optionalFields.allergies || 'Ninguna conocida',
      microchip: optionalFields.microchip || '',
      photoUrl: (optionalFields.photoUrl && optionalFields.photoUrl.length <= 55000) ? optionalFields.photoUrl : '',
      clinicalNotes: optionalFields.clinicalNotes || [],
      notes: optionalFields.notes || ''
    };

    setData(prev => ({
      ...prev,
      clients: updatedClients,
      pets: [newPet, ...prev.pets]
    }));

    showToast(`¡Mascota "${newPet.name}" y dueño "${ownerName}" guardados exitosamente!`);

    // Subida y comprobación directa e inmediata a Supabase
    (async () => {
      if (newClientToUpload) {
        await verifyAndUploadDirect('clients', newClientToUpload, () => saveClientDirect(newClientToUpload));
      }
      const validClientIds = new Set(updatedClients.map(c => c.id));
      await verifyAndUploadDirect('pets', newPet, () => savePetDirect(newPet, validClientIds));
    })();

    return newPet;
  };

  // Rescates (Perros y gatos sin nombre con descripción física)
  const addRescue = (newRescue) => {
    const created = {
      ...newRescue,
      id: `resc-${Date.now()}`,
      code: `RES-${new Date().getFullYear()}-${String(data.rescues.length + 1).padStart(3, '0')}`,
      intakeDate: newRescue.intakeDate || getLocalDateString(),
      interventions: newRescue.interventions || []
    };
    setData(prev => ({ ...prev, rescues: [created, ...prev.rescues] }));
    showToast(`Rescate registrado con código ${created.code}`);
    verifyAndUploadDirect('rescues', created, () => saveRescueDirect(created));
    return created;
  };

  const addRescueIntervention = (rescueId, intervention) => {
    let rescueToUpload = null;
    const newIntervention = {
      ...intervention,
      date: intervention.date || new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
    };

    setData(prev => {
      const nextRescues = prev.rescues.map(resc => {
        if (resc.id === rescueId) {
          rescueToUpload = {
            ...resc,
            interventions: [newIntervention, ...(resc.interventions || [])]
          };
          return rescueToUpload;
        }
        return resc;
      });
      return { ...prev, rescues: nextRescues };
    });

    showToast('Intervención clínica agregada a la bitácora del rescate');
    if (rescueToUpload) {
      verifyAndUploadDirect('rescues', rescueToUpload, () => saveRescueDirect(rescueToUpload));
    }
  };

  const updateRescueStatus = (rescueId, newStatus) => {
    let rescueToUpload = null;
    setData(prev => {
      const nextRescues = prev.rescues.map(r => {
        if (r.id === rescueId) {
          rescueToUpload = { ...r, healthStatus: newStatus };
          return rescueToUpload;
        }
        return r;
      });
      return { ...prev, rescues: nextRescues };
    });
    showToast(`Estado de salud del rescate actualizado: ${newStatus}`);
    if (rescueToUpload) {
      verifyAndUploadDirect('rescues', rescueToUpload, () => saveRescueDirect(rescueToUpload));
    }
  };

  // Cirugías (con soporte para procedimientos adicionales como vacunas, desparasitación, etc.)
  const addSurgery = (newSurgery) => {
    const cleanAdditional = Array.isArray(newSurgery.additionalProcedures)
      ? newSurgery.additionalProcedures.map(p => p.trim()).filter(Boolean)
      : [];

    const created = {
      ...newSurgery,
      additionalProcedures: cleanAdditional,
      id: `surg-${Date.now()}`
    };

    let generatedVaccines = [];

    setData(prev => {
      let nextVaccinations = prev.vaccinations || [];

      // Si se seleccionó una mascota registrada y se incluyeron vacunas/desparasitaciones en la cirugía,
      // registrarlas también en la Cartilla Oficial si autoRegisterVaccines está activo
      if (newSurgery.autoRegisterVaccines !== false && cleanAdditional.length > 0) {
        const matchedPet = (newSurgery.petId && prev.pets.find(p => p.id === newSurgery.petId)) ||
          prev.pets.find(p => newSurgery.patientName?.toLowerCase().startsWith(p.name.toLowerCase()));

        if (matchedPet) {
          const vaccineKeywords = [
            'vacuna', 'rabia', 'rabies', 'defensor', 'vanguard', 'bronchicine',
            'purevax', 'nobivac', 'séxtuple', 'sextuple', 'bordetella', 'puppy',
            'felina', 'feline', 'leucemia', 'desparasit'
          ];
          const vaccineProcs = cleanAdditional.filter(proc =>
            vaccineKeywords.some(kw => proc.toLowerCase().includes(kw))
          );

          if (vaccineProcs.length > 0) {
            const appliedDate = created.date || getLocalDateString();
            const dueDate = getLocalExpiryDateString(1);

            const resolveManufacturer = (name) => {
              const lower = name.toLowerCase();
              if (lower.includes('defensor') || lower.includes('vanguard') || lower.includes('bronchicine')) return 'Zoetis';
              if (lower.includes('purevax')) return 'Boehringer Ingelheim';
              if (lower.includes('nobivac') || lower.includes('bravecto')) return 'MSD Salud Animal';
              if (lower.includes('endovet')) return 'Riverfarma';
              return 'Aplicada en Quirófano / Cirugía';
            };

            generatedVaccines = vaccineProcs.map((vacName, idx) => {
              const cleanName = vacName.replace(/^[^\wÁÉÍÓÚáéíóúÑñ]+/, '').trim();
              return {
                id: `vac-${Date.now()}-${idx}`,
                petId: matchedPet.id,
                petName: matchedPet.name,
                ownerName: created.ownerName || 'Cliente Registrado',
                vaccineName: cleanName,
                manufacturer: resolveManufacturer(cleanName),
                lotNumber: `QUIR-${new Date().getFullYear()}`,
                appliedDate,
                dueDate,
                vetName: created.surgeon || 'Dra. María José Mendoza Gutiérrez',
                licenseNumber: 'CÉD. PROF. 8492019-BC',
                notes: `Aplicada durante cirugía: ${created.procedure}`,
                isTravelValid: true
              };
            });

            nextVaccinations = [...generatedVaccines, ...nextVaccinations];
          }
        }
      }

      return {
        ...prev,
        surgeries: [created, ...prev.surgeries],
        vaccinations: nextVaccinations
      };
    });

    const extraLabel = cleanAdditional.length > 0 ? ` (+${cleanAdditional.length} proc. adicionales)` : '';
    showToast(`Cirugía registrada: ${created.procedure}${extraLabel}`);

    // Comprobación y subida inmediata a Supabase
    verifyAndUploadDirect('surgeries', created, () => saveSurgeryDirect(created));
    generatedVaccines.forEach(v => {
      verifyAndUploadDirect('vaccinations', v, () => saveVaccinationDirect(v));
    });

    return created;
  };

  const updateSurgery = (surgeryId, updatedFields) => {
    let surgeryToUpload = null;
    const cleanAdditional = Array.isArray(updatedFields.additionalProcedures)
      ? updatedFields.additionalProcedures.map(p => p.trim()).filter(Boolean)
      : undefined;

    setData(prev => {
      const nextSurgeries = prev.surgeries.map(s => {
        if (s.id !== surgeryId) return s;
        surgeryToUpload = {
          ...s,
          ...updatedFields,
          ...(cleanAdditional !== undefined ? { additionalProcedures: cleanAdditional } : {})
        };
        return surgeryToUpload;
      });
      return { ...prev, surgeries: nextSurgeries };
    });

    showToast('Registro quirúrgico y procedimientos actualizados');

    if (surgeryToUpload) {
      verifyAndUploadDirect('surgeries', surgeryToUpload, () => saveSurgeryDirect(surgeryToUpload));
    }
    return { success: true };
  };

  const updateSurgeryStatus = (surgeryId, newStatus) => {
    let surgeryToUpload = null;
    setData(prev => {
      const nextSurgeries = prev.surgeries.map(s => {
        if (s.id !== surgeryId) return s;
        surgeryToUpload = { ...s, status: newStatus };
        return surgeryToUpload;
      });
      return { ...prev, surgeries: nextSurgeries };
    });

    showToast(`Cirugía actualizada a: ${newStatus}`);

    if (surgeryToUpload) {
      verifyAndUploadDirect('surgeries', surgeryToUpload, () => saveSurgeryDirect(surgeryToUpload));
    }
  };

  const deleteSurgery = (surgeryId) => {
    setData(prev => ({
      ...prev,
      surgeries: prev.surgeries.filter(s => s.id !== surgeryId)
    }));
    verifyAndDeleteDirect('surgeries', surgeryId);
    showToast('Registro de cirugía eliminado', 'info');
  };

  // Vacunación y Passport to Travel
  const addVaccination = (newVac) => {
    const created = { ...newVac, id: `vac-${Date.now()}` };
    setData(prev => ({ ...prev, vaccinations: [created, ...prev.vaccinations] }));
    showToast(`Vacuna ${created.vaccineName} registrada en cartilla oficial`);
    verifyAndUploadDirect('vaccinations', created, () => saveVaccinationDirect(created));
    return created;
  };

  // Jaulas / Caniles / Hospitalización
  const addCage = (newCage) => {
    const rawCode = String(newCage.code || `J-${String((data.cages?.length || 0) + 1).padStart(2, '0')}`).trim();
    const rawName = String(newCage.name || '').trim();
    const codeExists = (data.cages || []).some(
      c => String(c.code || '').trim().toLowerCase() === rawCode.toLowerCase()
    );
    const resolvedCode = codeExists
      ? (rawName && !rawCode.toLowerCase().endsWith(rawName.toLowerCase())
          ? `${rawCode} ${rawName}`
          : `${rawCode} #${(data.cages?.length || 0) + 1}`)
      : rawCode;

    const created = {
      ...newCage,
      id: `cage-${Date.now()}`,
      code: resolvedCode,
      status: newCage.status || 'Disponible',
      currentOccupant: null,
      lastCleaned: 'Recién registrada'
    };
    setData(prev => ({
      ...prev,
      cages: normalizeAndDeduplicateCages([...(prev.cages || []), created])
    }));
    showToast(`Jaula ${created.code} agregada al inventario clínico`);
    verifyAndUploadDirect('cages', created, () => saveCageDirect(created));
    return created;
  };

  const assignPatientToCage = (cageId, occupantDetails) => {
    let cageToUpload = null;
    const cleanPatientNames = Array.isArray(occupantDetails.patientNames)
      ? occupantDetails.patientNames.map(n => n.trim()).filter(Boolean)
      : (occupantDetails.patientName
          ? occupantDetails.patientName.split(',').map(n => n.trim()).filter(Boolean)
          : []);

    const combinedPatientName = cleanPatientNames.length > 0
      ? cleanPatientNames.join(', ')
      : (occupantDetails.patientName || '').trim();

    setData(prev => {
      const nextCages = (prev.cages || []).map(cage => {
        if (cage.id === cageId) {
          cageToUpload = {
            ...cage,
            status: 'Ocupada',
            currentOccupant: {
              ...occupantDetails,
              patientName: combinedPatientName,
              patientNames: cleanPatientNames.length > 0 ? cleanPatientNames : [combinedPatientName].filter(Boolean),
              intakeTime: occupantDetails.intakeTime || new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
            }
          };
          return cageToUpload;
        }
        return cage;
      });
      return { ...prev, cages: nextCages };
    });

    const countLabel = cleanPatientNames.length > 1 ? ` (${cleanPatientNames.length} mascotas en la misma jaula)` : '';
    showToast(`Ingreso en jaula actualizado exitosamente${countLabel}`);

    if (cageToUpload) {
      verifyAndUploadDirect('cages', cageToUpload, () => saveCageDirect(cageToUpload));
    }
  };

  const releaseCage = (cageId, markForCleaning = true) => {
    let cageToUpload = null;
    setData(prev => {
      const nextCages = (prev.cages || []).map(cage => {
        if (cage.id === cageId) {
          cageToUpload = {
            ...cage,
            status: markForCleaning ? 'Necesita Limpieza' : 'Disponible',
            currentOccupant: null,
            cleaningNotes: markForCleaning ? 'Alta reciente. Requiere desinfección profunda y cambio de tapete.' : undefined
          };
          return cageToUpload;
        }
        return cage;
      });
      return { ...prev, cages: nextCages };
    });

    showToast(markForCleaning ? 'Paciente dado de alta. Jaula marcada para limpieza.' : 'Paciente dado de alta. Jaula disponible.');

    if (cageToUpload) {
      verifyAndUploadDirect('cages', cageToUpload, () => saveCageDirect(cageToUpload));
    }
  };

  const markCageClean = (cageId) => {
    let cageToUpload = null;
    setData(prev => {
      const nextCages = (prev.cages || []).map(cage => {
        if (cage.id === cageId) {
          cageToUpload = {
            ...cage,
            status: 'Disponible',
            cleaningNotes: undefined,
            lastCleaned: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
          };
          return cageToUpload;
        }
        return cage;
      });
      return { ...prev, cages: nextCages };
    });

    showToast('Jaula desinfectada y lista para nuevo paciente');

    if (cageToUpload) {
      verifyAndUploadDirect('cages', cageToUpload, () => saveCageDirect(cageToUpload));
    }
  };

  const updateCageStatus = (cageId, newStatus) => {
    let cageToUpload = null;
    setData(prev => {
      const nextCages = (prev.cages || []).map(cage => {
        if (cage.id === cageId) {
          cageToUpload = {
            ...cage,
            status: newStatus,
            ...(newStatus === 'Disponible' ? { currentOccupant: null } : {})
          };
          return cageToUpload;
        }
        return cage;
      });
      return { ...prev, cages: nextCages };
    });

    showToast(`Estado de jaula actualizado a: ${newStatus}`);

    if (cageToUpload) {
      verifyAndUploadDirect('cages', cageToUpload, () => saveCageDirect(cageToUpload));
    }
  };

  const deleteCage = (cageId) => {
    setData(prev => ({
      ...prev,
      cages: (prev.cages || []).filter(cage => cage.id !== cageId)
    }));
    verifyAndDeleteDirect('cages', cageId);
    showToast('Jaula eliminada del inventario', 'info');
  };

  // Respaldos (Exportar / Importar)
  const exportBackup = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_vet_california_${getLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Respaldo de base de datos descargado con éxito');
  };

  const importBackup = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.clients && parsed.pets && parsed.appointments) {
        setData(parsed);
        showToast('Base de datos restaurada correctamente');
        return true;
      } else {
        showToast('El archivo no tiene el formato válido del sistema', 'error');
        return false;
      }
    } catch (e) {
      showToast('Error al procesar el archivo JSON', 'error');
      return false;
    }
  };

  const resetToDefaults = async () => {
    if (window.confirm('¿Seguro que deseas restaurar los datos de fábrica de Servicio Veterinario California? Se limpiarán los registros no respaldados.')) {
      setData(INITIAL_DATA);
      if (isSupabaseConfigured) {
        try {
          setCloudStatus('syncing');
          await clearAndResetSupabase(INITIAL_DATA);
          setCloudStatus('synced');
        } catch (e) {
          console.error('Error resetting Supabase:', e);
        }
      }
      showToast('Datos reiniciados a los valores limpios de fábrica');
    }
  };

  return (
    <AppContext.Provider
      value={{
        ...data,
        activeTab,
        setActiveTab,
        notification,
        showToast,
        // Cloud Sync Status
        cloudStatus,
        lastSyncedAt,
        syncNow,
        isSupabaseConfigured,
        formatPetAge,
        // Authentication
        isAuthenticated,
        currentUser,
        login,
        logout,
        PROVISIONAL_CREDENTIALS,
        CLINIC_CREDENTIALS,
        CLINIC_DOCTORS,
        // Methods
        addAppointment,
        updateAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        addClient,
        addPet,
        updatePet,
        addClinicalNote,
        addLabResult,
        deleteLabResult,
        registerPetDirect,
        selectedPetIdForPassport,
        setSelectedPetIdForPassport,
        openPetPassport,
        addRescue,
        addRescueIntervention,
        updateRescueStatus,
        addSurgery,
        updateSurgery,
        updateSurgeryStatus,
        deleteSurgery,
        addVaccination,
        // Cages / Hospitalización
        addCage,
        assignPatientToCage,
        releaseCage,
        markCageClean,
        updateCageStatus,
        deleteCage,
        exportBackup,
        importBackup,
        resetToDefaults
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
