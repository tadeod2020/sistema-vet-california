import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_DATA, CLINIC_DOCTORS } from '../data/initialData';
import { getLocalDateString, getLocalExpiryDateString } from '../lib/dateUtils.js';
import { cleanWhatsappNumber } from '../lib/whatsappUtils.js';
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

function mergeLabResults(cloudLabs = [], localLabs = [], isPendingLocal = false) {
  if (isPendingLocal) {
    const cloudMap = new Map((cloudLabs || []).filter(l => l && l.id).map(l => [l.id, l]));
    return (localLabs || []).filter(l => l && l.id).map(localLab => {
      const cloudLab = cloudMap.get(localLab.id);
      return {
        ...localLab,
        fileUrl: (localLab.fileUrl && localLab.fileUrl.length > 0) ? localLab.fileUrl : (cloudLab?.fileUrl || '')
      };
    });
  }

  const localMap = new Map((localLabs || []).filter(l => l && l.id).map(l => [l.id, l]));
  return (cloudLabs || []).filter(cL => cL && cL.id).map(cL => {
    const existing = localMap.get(cL.id);
    return {
      ...cL,
      fileUrl: (cL.fileUrl && cL.fileUrl.length > 0) ? cL.fileUrl : (existing?.fileUrl || '')
    };
  });
}

function reconcileCollection(localArr = [], cloudArr = [], deletedIds = new Set()) {
  if (!cloudArr) return (localArr || []).filter(item => !isTestRecord(item) && !deletedIds.has(item.id));
  const map = new Map();
  // Los registros de la nube son la verdad consolidada (excluyendo eliminaciones locales en vuelo)
  cloudArr.forEach(item => {
    if (item && item.id && !isTestRecord(item) && !deletedIds.has(item.id)) {
      map.set(item.id, item);
    }
  });

  // Preservar únicamente registros locales que tengan cambios pendientes (_pendingSync) aún no confirmados en la nube
  (localArr || []).forEach(localItem => {
    if (localItem && localItem.id && !isTestRecord(localItem) && !deletedIds.has(localItem.id)) {
      if (!map.has(localItem.id)) {
        if (localItem._pendingSync) {
          map.set(localItem.id, localItem);
        }
      } else {
        const cloudItem = map.get(localItem.id);
        if (localItem.labResults || cloudItem.labResults) {
          const mergedLabs = mergeLabResults(cloudItem.labResults || [], localItem.labResults || [], Boolean(localItem._pendingSync));
          map.set(localItem.id, {
            ...cloudItem,
            ...(localItem._pendingSync ? localItem : {}),
            labResults: mergedLabs,
            photoUrl: (localItem._pendingSync ? localItem.photoUrl : cloudItem.photoUrl) || cloudItem.photoUrl || localItem.photoUrl || ''
          });
        } else if (localItem._pendingSync) {
          // Editado localmente con cambios pendientes offline
          map.set(localItem.id, { ...cloudItem, ...localItem });
        }
      }
    }
  });

  return Array.from(map.values());
}

function reconcileWithCloud(localData, cloudData, deletedIds = new Set()) {
  if (!cloudData) return localData;

  const cages = cloudData.cages && cloudData.cages.length > 0
    ? normalizeAndDeduplicateCages(reconcileCollection(localData.cages, cloudData.cages, deletedIds))
    : normalizeAndDeduplicateCages(localData.cages || []);

  const rescues = normalizeAndDeduplicateRescues(reconcileCollection(localData.rescues, cloudData.rescues || [], deletedIds));

  return {
    ...INITIAL_DATA,
    ...localData,
    clients: reconcileCollection(localData.clients, cloudData.clients || [], deletedIds),
    pets: reconcileCollection(localData.pets, cloudData.pets || [], deletedIds),
    appointments: reconcileCollection(localData.appointments, cloudData.appointments || [], deletedIds),
    rescues,
    surgeries: reconcileCollection(localData.surgeries, cloudData.surgeries || [], deletedIds),
    vaccinations: reconcileCollection(localData.vaccinations, cloudData.vaccinations || [], deletedIds),
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
  const deletedIdsRef = useRef(new Set());
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
        const next = reconcileWithCloud(prevLocal, cloudData, deletedIdsRef.current);
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
          const next = reconcileWithCloud(prevLocal, cloudData, deletedIdsRef.current);
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

  const setItemPendingSync = (table, itemId, pending) => {
    if (!table || !itemId) return;
    setData(prev => {
      const list = prev[table];
      if (!Array.isArray(list)) return prev;
      const nextList = list.map(i => {
        if (!i || i.id !== itemId) return i;
        if (pending) return { ...i, _pendingSync: true };
        const { _pendingSync, ...clean } = i;
        return clean;
      });
      const next = { ...prev, [table]: nextList };
      dataRef.current = next;
      return next;
    });
  };

  // Comprobación y subida inmediata por cada modificación individual
  const verifyAndUploadDirect = async (table, item, saveFn) => {
    if (item?.id) {
      deletedIdsRef.current.delete(item.id);
      setItemPendingSync(table, item.id, true);
    }
    if (!isSupabaseConfigured) return;
    lastLocalEditAtRef.current = Date.now();
    setCloudStatus('syncing');

    try {
      const res = await saveFn();
      if (res && res.success) {
        if (item?.id) {
          setItemPendingSync(table, item.id, false);
        }
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
    if (id) {
      deletedIdsRef.current.add(id);
    }
    lastLocalEditAtRef.current = Date.now();
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
          latestData = reconcileWithCloud(dataRef.current, cloudData, deletedIdsRef.current);
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
        const stripPending = (arr = []) => arr.map(({ _pendingSync, ...rest }) => rest);
        const cleanedData = {
          ...latestData,
          clients: stripPending(latestData.clients),
          pets: stripPending(latestData.pets),
          appointments: stripPending(latestData.appointments),
          rescues: stripPending(latestData.rescues),
          surgeries: stripPending(latestData.surgeries),
          vaccinations: stripPending(latestData.vaccinations),
          cages: stripPending(latestData.cages)
        };
        setData(cleanedData);
        dataRef.current = cleanedData;
        safeSaveLocalStorage(STORAGE_KEY, cleanedData);

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
    const current = (dataRef.current.appointments || []).find(apt => apt.id === aptId);
    if (!current) return { success: false };

    const cleanPetNames = Array.isArray(updatedFields.petNames)
      ? updatedFields.petNames.map(n => n.trim()).filter(Boolean)
      : (updatedFields.petName ? [updatedFields.petName.trim()].filter(Boolean) : undefined);

    const combinedPetName = cleanPetNames && cleanPetNames.length > 0
      ? cleanPetNames.join(', ')
      : updatedFields.petName;

    const targetUpdated = {
      ...current,
      ...updatedFields,
      phone: String(updatedFields.phone !== undefined ? updatedFields.phone : (current.phone || '')).trim(),
      ...(combinedPetName !== undefined ? { petName: combinedPetName } : {}),
      ...(cleanPetNames !== undefined ? { petNames: cleanPetNames } : {})
    };

    setData(prev => {
      const nextApts = (prev.appointments || []).map(apt => apt.id === aptId ? targetUpdated : apt);
      return { ...prev, appointments: nextApts };
    });
    dataRef.current = {
      ...dataRef.current,
      appointments: (dataRef.current.appointments || []).map(apt => apt.id === aptId ? targetUpdated : apt)
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast('Cita médica actualizada con éxito');

    const validClientIds = new Set((dataRef.current.clients || []).map(c => c.id));
    const validPetIds = new Set((dataRef.current.pets || []).map(p => p.id));
    verifyAndUploadDirect('appointments', targetUpdated, () => saveAppointmentDirect(targetUpdated, validClientIds, validPetIds));
    return { success: true };
  };

  const updateAppointmentStatus = (aptId, newStatus) => {
    const current = (dataRef.current.appointments || []).find(apt => apt.id === aptId);
    if (!current) return;

    const targetUpdated = { ...current, status: newStatus };

    setData(prev => {
      const nextApts = (prev.appointments || []).map(apt => apt.id === aptId ? targetUpdated : apt);
      return { ...prev, appointments: nextApts };
    });
    dataRef.current = {
      ...dataRef.current,
      appointments: (dataRef.current.appointments || []).map(apt => apt.id === aptId ? targetUpdated : apt)
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast(`Estado de cita actualizado a: ${newStatus}`);

    const validClientIds = new Set((dataRef.current.clients || []).map(c => c.id));
    const validPetIds = new Set((dataRef.current.pets || []).map(p => p.id));
    verifyAndUploadDirect('appointments', targetUpdated, () => saveAppointmentDirect(targetUpdated, validClientIds, validPetIds));
  };

  const deleteAppointment = (aptId) => {
    setData(prev => {
      const next = {
        ...prev,
        appointments: (prev.appointments || []).filter(apt => apt.id !== aptId)
      };
      dataRef.current = next;
      safeSaveLocalStorage(STORAGE_KEY, next);
      return next;
    });
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
    const currentPets = dataRef.current?.pets || [];
    const currentClients = dataRef.current?.clients || [];
    const targetPet = currentPets.find(p => p.id === petId);
    if (!targetPet) return;

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

    let clientToUpload = null;
    let updatedClients = currentClients;
    if (ownerName !== undefined || ownerPhone !== undefined || ownerAddress !== undefined || ownerEmail !== undefined) {
      const cleanPhone = (ownerPhone ?? '').trim();
      if (targetPet.clientId && currentClients.some(c => c.id === targetPet.clientId)) {
        updatedClients = currentClients.map(c => {
          if (c.id !== targetPet.clientId) return c;
          const nextPhone = cleanPhone || c.phone;
          clientToUpload = {
            ...c,
            ...(ownerName?.trim() ? { name: ownerName.trim() } : {}),
            ...(cleanPhone ? {
              phone: cleanPhone,
              whatsapp: cleanWhatsappNumber(nextPhone) || c.whatsapp
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
          whatsapp: cleanWhatsappNumber(cleanPhone),
          email: (ownerEmail || '').trim(),
          address: (ownerAddress || '').trim(),
          isFrequent: false,
          tag: 'Cliente Regular',
          notes: ''
        };
        clientToUpload = newClient;
        updatedClients = [newClient, ...currentClients];
        updatedPetObj.clientId = newClient.id;
      }
    }

    const nameChanged = resolvedName && resolvedName !== targetPet.name;
    const changedVaccinations = [];
    const updatedVaccinations = nameChanged
      ? (dataRef.current?.vaccinations || []).map(v => {
          if (v.petId === petId) {
            const nextV = { ...v, petName: resolvedName };
            changedVaccinations.push(nextV);
            return nextV;
          }
          return v;
        })
      : (dataRef.current?.vaccinations || []);

    const changedSurgeries = [];
    const updatedSurgeries = nameChanged
      ? (dataRef.current?.surgeries || []).map(s => {
          if (s.petId === petId) {
            const nextS = { ...s, patientName: resolvedName };
            changedSurgeries.push(nextS);
            return nextS;
          }
          return s;
        })
      : (dataRef.current?.surgeries || []);

    const nextPets = currentPets.map(p => p.id === petId ? updatedPetObj : p);

    setData(prev => ({
      ...prev,
      clients: updatedClients,
      pets: nextPets,
      vaccinations: updatedVaccinations,
      surgeries: updatedSurgeries
    }));

    dataRef.current = {
      ...dataRef.current,
      clients: updatedClients,
      pets: nextPets,
      vaccinations: updatedVaccinations,
      surgeries: updatedSurgeries
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast('Datos de la mascota actualizados con éxito');

    (async () => {
      if (clientToUpload) {
        await verifyAndUploadDirect('clients', clientToUpload, () => saveClientDirect(clientToUpload));
      }
      const validClientIds = new Set(updatedClients.map(c => c.id));
      if (clientToUpload) validClientIds.add(clientToUpload.id);
      await verifyAndUploadDirect('pets', updatedPetObj, () => savePetDirect(updatedPetObj, validClientIds));
      for (const v of changedVaccinations) {
        await verifyAndUploadDirect('vaccinations', v, () => saveVaccinationDirect(v));
      }
      for (const s of changedSurgeries) {
        await verifyAndUploadDirect('surgeries', s, () => saveSurgeryDirect(s));
      }
    })();
  };

  const addClinicalNote = (petId, note) => {
    const targetPet = (dataRef.current?.pets || []).find(p => p.id === petId);
    if (!targetPet) return null;

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

    const petToUpload = {
      ...targetPet,
      clinicalNotes: [newNote, ...(targetPet.clinicalNotes || [])]
    };

    const nextPets = (dataRef.current?.pets || []).map(p => p.id === petId ? petToUpload : p);

    setData(prev => ({
      ...prev,
      pets: nextPets
    }));
    dataRef.current = {
      ...dataRef.current,
      pets: nextPets
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast('Nota médica agregada al expediente');

    const validClientIds = new Set((dataRef.current?.clients || []).map(c => c.id));
    verifyAndUploadDirect('pets', petToUpload, () => savePetDirect(petToUpload, validClientIds));
    return newNote;
  };

  const addLabResult = (petId, result) => {
    const targetPet = (dataRef.current?.pets || []).find(p => p.id === petId);
    if (!targetPet) return null;

    const newResult = {
      id: `lab-${Date.now()}`,
      date: result.date || new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
      title: result.title || 'Resultado de Laboratorio',
      category: result.category || 'Análisis Clínico',
      fileType: result.fileType || 'image', // 'image' | 'pdf'
      fileUrl: (result.fileUrl && result.fileUrl.length <= 2000000) ? result.fileUrl : (result.fileUrl || ''),
      fileName: result.fileName || 'estudio_laboratorio',
      notes: result.notes || '',
      performedBy: result.performedBy || 'Laboratorio Clínico California'
    };

    const petToUpload = {
      ...targetPet,
      labResults: [newResult, ...(targetPet.labResults || [])]
    };

    const nextPets = (dataRef.current?.pets || []).map(p => p.id === petId ? petToUpload : p);

    setData(prev => ({
      ...prev,
      pets: nextPets
    }));
    dataRef.current = {
      ...dataRef.current,
      pets: nextPets
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast('Estudio de laboratorio adjuntado al expediente');

    const validClientIds = new Set((dataRef.current?.clients || []).map(c => c.id));
    verifyAndUploadDirect('pets', petToUpload, () => savePetDirect(petToUpload, validClientIds));
    return newResult;
  };

  const updateLabResult = (petId, resultId, fields) => {
    const targetPet = (dataRef.current?.pets || []).find(p => p.id === petId);
    if (!targetPet) return null;

    let updatedResult = null;
    const nextLabResults = (targetPet.labResults || []).map(item => {
      if (item.id === resultId) {
        updatedResult = {
          ...item,
          ...fields,
          fileUrl: fields.fileUrl !== undefined ? fields.fileUrl : item.fileUrl
        };
        return updatedResult;
      }
      return item;
    });

    if (!updatedResult) return null;

    const petToUpload = {
      ...targetPet,
      labResults: nextLabResults
    };

    const nextPets = (dataRef.current?.pets || []).map(p => p.id === petId ? petToUpload : p);

    setData(prev => ({
      ...prev,
      pets: nextPets
    }));
    dataRef.current = {
      ...dataRef.current,
      pets: nextPets
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast('Estudio de laboratorio actualizado');

    const validClientIds = new Set((dataRef.current?.clients || []).map(c => c.id));
    verifyAndUploadDirect('pets', petToUpload, () => savePetDirect(petToUpload, validClientIds));
    return updatedResult;
  };

  const deleteLabResult = (petId, resultId) => {
    const targetPet = (dataRef.current?.pets || []).find(p => p.id === petId);
    if (!targetPet) return;

    const petToUpload = {
      ...targetPet,
      labResults: (targetPet.labResults || []).filter(item => item.id !== resultId)
    };

    const nextPets = (dataRef.current?.pets || []).map(p => p.id === petId ? petToUpload : p);

    setData(prev => ({
      ...prev,
      pets: nextPets
    }));
    dataRef.current = {
      ...dataRef.current,
      pets: nextPets
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast('Estudio eliminado del expediente', 'info');

    const validClientIds = new Set((dataRef.current?.clients || []).map(c => c.id));
    verifyAndUploadDirect('pets', petToUpload, () => savePetDirect(petToUpload, validClientIds));
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
        whatsapp: cleanWhatsappNumber(cleanPhone),
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
    const targetRescue = (dataRef.current?.rescues || []).find(resc => resc.id === rescueId);
    if (!targetRescue) return;

    const newIntervention = {
      ...intervention,
      date: intervention.date || new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
    };

    const rescueToUpload = {
      ...targetRescue,
      interventions: [newIntervention, ...(targetRescue.interventions || [])]
    };

    const nextRescues = (dataRef.current?.rescues || []).map(resc => resc.id === rescueId ? rescueToUpload : resc);

    setData(prev => ({
      ...prev,
      rescues: nextRescues
    }));
    dataRef.current = {
      ...dataRef.current,
      rescues: nextRescues
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast('Intervención clínica agregada a la bitácora del rescate');
    verifyAndUploadDirect('rescues', rescueToUpload, () => saveRescueDirect(rescueToUpload));
  };

  const updateRescueStatus = (rescueId, newStatus) => {
    const targetRescue = (dataRef.current?.rescues || []).find(r => r.id === rescueId);
    if (!targetRescue) return;

    const rescueToUpload = { ...targetRescue, healthStatus: newStatus };

    const nextRescues = (dataRef.current?.rescues || []).map(r => r.id === rescueId ? rescueToUpload : r);

    setData(prev => ({
      ...prev,
      rescues: nextRescues
    }));
    dataRef.current = {
      ...dataRef.current,
      rescues: nextRescues
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast(`Estado de salud del rescate actualizado: ${newStatus}`);
    verifyAndUploadDirect('rescues', rescueToUpload, () => saveRescueDirect(rescueToUpload));
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
    const targetSurgery = (dataRef.current?.surgeries || []).find(s => s.id === surgeryId);
    if (!targetSurgery) return { success: false };

    const cleanAdditional = Array.isArray(updatedFields.additionalProcedures)
      ? updatedFields.additionalProcedures.map(p => p.trim()).filter(Boolean)
      : undefined;

    const surgeryToUpload = {
      ...targetSurgery,
      ...updatedFields,
      ...(cleanAdditional !== undefined ? { additionalProcedures: cleanAdditional } : {})
    };

    const nextSurgeries = (dataRef.current?.surgeries || []).map(s => s.id === surgeryId ? surgeryToUpload : s);

    setData(prev => ({
      ...prev,
      surgeries: nextSurgeries
    }));
    dataRef.current = {
      ...dataRef.current,
      surgeries: nextSurgeries
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast('Registro quirúrgico y procedimientos actualizados');

    verifyAndUploadDirect('surgeries', surgeryToUpload, () => saveSurgeryDirect(surgeryToUpload));
    return { success: true };
  };

  const updateSurgeryStatus = (surgeryId, newStatus) => {
    const targetSurgery = (dataRef.current?.surgeries || []).find(s => s.id === surgeryId);
    if (!targetSurgery) return;

    const surgeryToUpload = { ...targetSurgery, status: newStatus };

    const nextSurgeries = (dataRef.current?.surgeries || []).map(s => s.id === surgeryId ? surgeryToUpload : s);

    setData(prev => ({
      ...prev,
      surgeries: nextSurgeries
    }));
    dataRef.current = {
      ...dataRef.current,
      surgeries: nextSurgeries
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast(`Cirugía actualizada a: ${newStatus}`);

    verifyAndUploadDirect('surgeries', surgeryToUpload, () => saveSurgeryDirect(surgeryToUpload));
  };

  const deleteSurgery = (surgeryId) => {
    const nextSurgeries = (dataRef.current?.surgeries || []).filter(s => s.id !== surgeryId);
    setData(prev => ({
      ...prev,
      surgeries: nextSurgeries
    }));
    dataRef.current = {
      ...dataRef.current,
      surgeries: nextSurgeries
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    verifyAndDeleteDirect('surgeries', surgeryId);
    showToast('Registro de cirugía eliminado', 'info');
  };

  // Vacunación y Passport to Travel (Gestión y Edición de Cartillas)
  const addVaccination = (newVac) => {
    const created = { ...newVac, id: `vac-${Date.now()}` };
    const nextVaccinations = [created, ...(dataRef.current?.vaccinations || [])];
    setData(prev => ({ ...prev, vaccinations: nextVaccinations }));
    dataRef.current = { ...dataRef.current, vaccinations: nextVaccinations };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);
    showToast(`Vacuna ${created.vaccineName} registrada en cartilla oficial`);
    verifyAndUploadDirect('vaccinations', created, () => saveVaccinationDirect(created));
    return created;
  };

  const updateVaccination = (vacId, fields) => {
    const currentVaccinations = dataRef.current?.vaccinations || [];
    const target = currentVaccinations.find(v => v.id === vacId);
    if (!target) return null;

    const updated = { ...target, ...fields };
    const nextVaccinations = currentVaccinations.map(v => v.id === vacId ? updated : v);

    setData(prev => ({ ...prev, vaccinations: nextVaccinations }));
    dataRef.current = { ...dataRef.current, vaccinations: nextVaccinations };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast(`Vacuna ${updated.vaccineName} actualizada en cartilla oficial`);
    verifyAndUploadDirect('vaccinations', updated, () => saveVaccinationDirect(updated));
    return updated;
  };

  const deleteVaccination = (vacId) => {
    const currentVaccinations = dataRef.current?.vaccinations || [];
    const target = currentVaccinations.find(v => v.id === vacId);
    const nextVaccinations = currentVaccinations.filter(v => v.id !== vacId);

    setData(prev => ({ ...prev, vaccinations: nextVaccinations }));
    dataRef.current = { ...dataRef.current, vaccinations: nextVaccinations };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    verifyAndDeleteDirect('vaccinations', vacId);
    showToast('Vacuna retirada de la cartilla oficial', 'info');
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
    const targetCage = (dataRef.current?.cages || []).find(cage => cage.id === cageId);
    if (!targetCage) return;

    const cleanPatientNames = Array.isArray(occupantDetails.patientNames)
      ? occupantDetails.patientNames.map(n => n.trim()).filter(Boolean)
      : (occupantDetails.patientName
          ? occupantDetails.patientName.split(',').map(n => n.trim()).filter(Boolean)
          : []);

    const combinedPatientName = cleanPatientNames.length > 0
      ? cleanPatientNames.join(', ')
      : (occupantDetails.patientName || '').trim();

    const cageToUpload = {
      ...targetCage,
      status: 'Ocupada',
      currentOccupant: {
        ...occupantDetails,
        patientName: combinedPatientName,
        patientNames: cleanPatientNames.length > 0 ? cleanPatientNames : [combinedPatientName].filter(Boolean),
        intakeTime: occupantDetails.intakeTime || new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      }
    };

    const nextCages = (dataRef.current?.cages || []).map(cage => cage.id === cageId ? cageToUpload : cage);

    setData(prev => ({
      ...prev,
      cages: nextCages
    }));
    dataRef.current = {
      ...dataRef.current,
      cages: nextCages
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    const countLabel = cleanPatientNames.length > 1 ? ` (${cleanPatientNames.length} mascotas en la misma jaula)` : '';
    showToast(`Ingreso en jaula actualizado exitosamente${countLabel}`);

    verifyAndUploadDirect('cages', cageToUpload, () => saveCageDirect(cageToUpload));
  };

  const releaseCage = (cageId, markForCleaning = true) => {
    const targetCage = (dataRef.current?.cages || []).find(cage => cage.id === cageId);
    if (!targetCage) return;

    const cageToUpload = {
      ...targetCage,
      status: markForCleaning ? 'Necesita Limpieza' : 'Disponible',
      currentOccupant: null,
      cleaningNotes: markForCleaning ? 'Alta reciente. Requiere desinfección profunda y cambio de tapete.' : undefined
    };

    const nextCages = (dataRef.current?.cages || []).map(cage => cage.id === cageId ? cageToUpload : cage);

    setData(prev => ({
      ...prev,
      cages: nextCages
    }));
    dataRef.current = {
      ...dataRef.current,
      cages: nextCages
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast(markForCleaning ? 'Paciente dado de alta. Jaula marcada para limpieza.' : 'Paciente dado de alta. Jaula disponible.');

    verifyAndUploadDirect('cages', cageToUpload, () => saveCageDirect(cageToUpload));
  };

  const markCageClean = (cageId) => {
    const targetCage = (dataRef.current?.cages || []).find(cage => cage.id === cageId);
    if (!targetCage) return;

    const cageToUpload = {
      ...targetCage,
      status: 'Disponible',
      cleaningNotes: undefined,
      lastCleaned: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };

    const nextCages = (dataRef.current?.cages || []).map(cage => cage.id === cageId ? cageToUpload : cage);

    setData(prev => ({
      ...prev,
      cages: nextCages
    }));
    dataRef.current = {
      ...dataRef.current,
      cages: nextCages
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast('Jaula desinfectada y lista para nuevo paciente');

    verifyAndUploadDirect('cages', cageToUpload, () => saveCageDirect(cageToUpload));
  };

  const updateCageStatus = (cageId, newStatus) => {
    const targetCage = (dataRef.current?.cages || []).find(cage => cage.id === cageId);
    if (!targetCage) return;

    const cageToUpload = {
      ...targetCage,
      status: newStatus,
      ...(newStatus === 'Disponible' ? { currentOccupant: null } : {})
    };

    const nextCages = (dataRef.current?.cages || []).map(cage => cage.id === cageId ? cageToUpload : cage);

    setData(prev => ({
      ...prev,
      cages: nextCages
    }));
    dataRef.current = {
      ...dataRef.current,
      cages: nextCages
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

    showToast(`Estado de jaula actualizado a: ${newStatus}`);

    verifyAndUploadDirect('cages', cageToUpload, () => saveCageDirect(cageToUpload));
  };

  const deleteCage = (cageId) => {
    const nextCages = (dataRef.current?.cages || []).filter(cage => cage.id !== cageId);
    setData(prev => ({
      ...prev,
      cages: nextCages
    }));
    dataRef.current = {
      ...dataRef.current,
      cages: nextCages
    };
    safeSaveLocalStorage(STORAGE_KEY, dataRef.current);

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
    await syncNow();
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
        updateLabResult,
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
        updateVaccination,
        deleteVaccination,
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
