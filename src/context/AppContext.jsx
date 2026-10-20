import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_DATA, CLINIC_DOCTORS } from '../data/initialData';
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
  broadcastSync
} from '../lib/supabase';

export { formatPetAge };

const AppContext = createContext();

const STORAGE_KEY = 'vet_california_system_v2_clean';
const AUTH_STORAGE_KEY = 'vet_california_auth_session_v3';

function safeSaveLocalStorage(key, stateObj) {
  try {
    localStorage.setItem(key, JSON.stringify(stateObj));
  } catch (err) {
    console.warn('LocalStorage excedió límite de cuota. Optimizando espacio para mantener datos críticos...');
    try {
      // Elimina fotos pesadas (>40KB) del respaldo local ya que están respaldadas en la nube
      const pruned = {
        ...stateObj,
        pets: (stateObj.pets || []).map(p => ({
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
  if (!cloudArr) return localArr || [];
  const map = new Map();
  cloudArr.forEach(item => {
    if (item && item.id) map.set(item.id, item);
  });

  // Si hubo registros creados localmente mientras no había internet (offline), preservarlos
  (localArr || []).forEach(localItem => {
    if (localItem && localItem.id && localItem._pendingSync) {
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
    : normalizeAndDeduplicateCages(localData.cages && localData.cages.length > 0 ? localData.cages : INITIAL_DATA.cages);

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
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_DATA,
          ...parsed,
          pets: parsed.pets || [],
          clients: parsed.clients || [],
          appointments: parsed.appointments || [],
          rescues: normalizeAndDeduplicateRescues(parsed.rescues || []),
          surgeries: parsed.surgeries || [],
          vaccinations: parsed.vaccinations || [],
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

  // Suscripción a canal Realtime para sincronizar cambios entre múltiples dispositivos
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = createRealtimeSyncChannel(async (payload) => {
      // Ignorar actualizaciones si provienen de este mismo dispositivo
      if (payload?.deviceId === deviceIdRef.current) return;

      // Si el usuario local acaba de editar algo en los últimos 1.5s, no sobreescribir entradas en vuelo
      if (Date.now() - lastLocalEditAtRef.current < 1500) {
        setTimeout(refreshFromSupabaseSilently, 1600);
        return;
      }

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
        if (now - lastFetchedAtRef.current > 10000 && now - lastLocalEditAtRef.current > 2500) {
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

    // Sondeo de respaldo cada 25 segundos
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleFocusOrVisible();
      }
    }, 25000);

    return () => {
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(intervalId);
    };
  }, []);

  // Función serializada para enviar cambios a Supabase sin carreras ni colisiones
  const performSync = async (dataToSync) => {
    if (!isSupabaseConfigured || !isInitialCloudLoadDone.current) return;

    if (isSyncingRef.current) {
      syncQueuedRef.current = true;
      return;
    }

    isSyncingRef.current = true;
    setCloudStatus('syncing');

    try {
      const res = await syncAllToSupabase(dataToSync);
      if (res.success) {
        const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        setCloudStatus('synced');
        setLastSyncedAt(timeStr);
        // Avisar a otros dispositivos conectados
        broadcastSync(realtimeChannelRef.current, {
          deviceId: deviceIdRef.current,
          time: timeStr
        });
      } else {
        console.warn('Sync a Supabase reportó aviso/error:', res.error);
        setCloudStatus('error');
      }
    } catch (err) {
      console.error('Error al sincronizar con Supabase:', err);
      setCloudStatus('error');
    } finally {
      isSyncingRef.current = false;
      if (syncQueuedRef.current) {
        syncQueuedRef.current = false;
        setTimeout(() => {
          performSync(dataRef.current);
        }, 150);
      }
    }
  };

  // Guardado local y subida automática debounced a la nube con cada cambio local
  useEffect(() => {
    safeSaveLocalStorage(STORAGE_KEY, data);

    // Si el cambio de estado fue provocado por una sincronización remota, no re-subir
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    lastLocalEditAtRef.current = Date.now();

    if (!isSupabaseConfigured || !isInitialCloudLoadDone.current) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      performSync(data);
    }, 450);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [data]);

  // Reintento automático si quedó en estado de error
  useEffect(() => {
    if (cloudStatus !== 'error' || !isSupabaseConfigured || !isInitialCloudLoadDone.current) return;

    const retryTimer = setTimeout(async () => {
      performSync(dataRef.current);
    }, 8000);

    return () => clearTimeout(retryTimer);
  }, [cloudStatus]);

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

    if (
      cleanEmail === CLINIC_CREDENTIALS.email.toLowerCase() &&
      cleanPass === CLINIC_CREDENTIALS.password
    ) {
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
    return { success: true, appointment: created };
  };

  const updateAppointment = (aptId, updatedFields) => {
    const cleanPetNames = Array.isArray(updatedFields.petNames)
      ? updatedFields.petNames.map(n => n.trim()).filter(Boolean)
      : (updatedFields.petName ? [updatedFields.petName.trim()].filter(Boolean) : undefined);

    const combinedPetName = cleanPetNames && cleanPetNames.length > 0
      ? cleanPetNames.join(', ')
      : updatedFields.petName;

    setData(prev => ({
      ...prev,
      appointments: prev.appointments.map(apt => {
        if (apt.id !== aptId) return apt;
        return {
          ...apt,
          ...updatedFields,
          ...(combinedPetName !== undefined ? { petName: combinedPetName } : {}),
          ...(cleanPetNames !== undefined ? { petNames: cleanPetNames } : {})
        };
      })
    }));
    showToast('Cita médica actualizada con éxito');
    return { success: true };
  };

  const updateAppointmentStatus = (aptId, newStatus) => {
    setData(prev => ({
      ...prev,
      appointments: prev.appointments.map(apt => 
        apt.id === aptId ? { ...apt, status: newStatus } : apt
      )
    }));
    showToast(`Estado de cita actualizado a: ${newStatus}`);
  };

  const deleteAppointment = (aptId) => {
    setData(prev => ({
      ...prev,
      appointments: prev.appointments.filter(apt => apt.id !== aptId)
    }));
    deleteRowFromSupabase('appointments', aptId);
    broadcastSync(realtimeChannelRef.current, { deviceId: deviceIdRef.current, action: 'delete', table: 'appointments', id: aptId });
    showToast('Cita cancelada/eliminada del registro', 'info');
  };

  // Clientes y Mascotas
  const addClient = (newClient) => {
    const created = { ...newClient, id: `cli-${Date.now()}` };
    setData(prev => ({ ...prev, clients: [created, ...prev.clients] }));
    showToast(`Cliente ${created.name} registrado con éxito`);
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
    return created;
  };

  const updatePet = (petId, fields) => {
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

      const updatedPetObj = {
        ...targetPet,
        ...petFields,
        name: resolvedName,
        ageUnit: resolvedAgeUnit,
        ageYears: resolvedAgeYears,
        ageMonths: resolvedAgeMonths,
        ...(petFields.weightKg !== undefined && petFields.weightKg !== '' ? { weightKg: Number(petFields.weightKg) } : {})
      };

      let updatedClients = prev.clients;
      if (ownerName !== undefined || ownerPhone !== undefined || ownerAddress !== undefined || ownerEmail !== undefined) {
        const cleanPhone = (ownerPhone ?? '').trim();
        const cleanNumbers = cleanPhone.replace(/\D/g, '');
        if (targetPet.clientId && prev.clients.some(c => c.id === targetPet.clientId)) {
          updatedClients = prev.clients.map(c => {
            if (c.id !== targetPet.clientId) return c;
            const nextPhone = cleanPhone || c.phone;
            const nextDigits = nextPhone.replace(/\D/g, '');
            return {
              ...c,
              ...(ownerName?.trim() ? { name: ownerName.trim() } : {}),
              ...(cleanPhone ? {
                phone: cleanPhone,
                whatsapp: nextDigits ? (nextDigits.startsWith('52') ? nextDigits : `521${nextDigits}`) : c.whatsapp
              } : {}),
              ...(ownerAddress !== undefined ? { address: ownerAddress.trim() } : {}),
              ...(ownerEmail !== undefined ? { email: ownerEmail.trim() } : {})
            };
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
  };

  const addClinicalNote = (petId, note) => {
    const newNote = {
      id: `cn-${Date.now()}`,
      date: note.date || new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
      vet: note.vet || 'Médico Veterinario de Guardia',
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

    setData(prev => ({
      ...prev,
      pets: prev.pets.map(p => {
        if (p.id === petId) {
          return {
            ...p,
            clinicalNotes: [newNote, ...(p.clinicalNotes || [])]
          };
        }
        return p;
      })
    }));

    showToast('Nota médica agregada al expediente');
    return newNote;
  };

  const addLabResult = (petId, result) => {
    const newResult = {
      id: `lab-${Date.now()}`,
      date: result.date || new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
      title: result.title || 'Resultado de Laboratorio',
      category: result.category || 'Análisis Clínico',
      fileType: result.fileType || 'image', // 'image' | 'pdf'
      fileUrl: result.fileUrl || '',
      fileName: result.fileName || 'estudio_laboratorio',
      notes: result.notes || '',
      performedBy: result.performedBy || 'Laboratorio Clínico California'
    };

    setData(prev => ({
      ...prev,
      pets: prev.pets.map(p => {
        if (p.id === petId) {
          return {
            ...p,
            labResults: [newResult, ...(p.labResults || [])]
          };
        }
        return p;
      })
    }));

    showToast('Estudio de laboratorio adjuntado al expediente');
    return newResult;
  };

  const deleteLabResult = (petId, resultId) => {
    setData(prev => ({
      ...prev,
      pets: prev.pets.map(p => {
        if (p.id === petId) {
          return {
            ...p,
            labResults: (p.labResults || []).filter(item => item.id !== resultId)
          };
        }
        return p;
      })
    }));
    showToast('Estudio eliminado del expediente', 'info');
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
      photoUrl: optionalFields.photoUrl || '',
      clinicalNotes: optionalFields.clinicalNotes || [],
      notes: optionalFields.notes || ''
    };

    setData(prev => ({
      ...prev,
      clients: updatedClients,
      pets: [newPet, ...prev.pets]
    }));

    showToast(`¡Mascota "${newPet.name}" y dueño "${ownerName}" guardados exitosamente!`);
    return newPet;
  };

  // Rescates (Perros y gatos sin nombre con descripción física)
  const addRescue = (newRescue) => {
    const created = {
      ...newRescue,
      id: `resc-${Date.now()}`,
      code: `RES-${new Date().getFullYear()}-${String(data.rescues.length + 1).padStart(3, '0')}`,
      intakeDate: newRescue.intakeDate || new Date().toISOString().split('T')[0],
      interventions: newRescue.interventions || []
    };
    setData(prev => ({ ...prev, rescues: [created, ...prev.rescues] }));
    showToast(`Rescate registrado con código ${created.code}`);
    return created;
  };

  const addRescueIntervention = (rescueId, intervention) => {
    const newIntervention = {
      ...intervention,
      date: intervention.date || new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
    };

    setData(prev => ({
      ...prev,
      rescues: prev.rescues.map(resc => {
        if (resc.id === rescueId) {
          return {
            ...resc,
            interventions: [newIntervention, ...(resc.interventions || [])]
          };
        }
        return resc;
      })
    }));

    showToast('Intervención clínica agregada a la bitácora del rescate');
  };

  const updateRescueStatus = (rescueId, newStatus) => {
    setData(prev => ({
      ...prev,
      rescues: prev.rescues.map(r => r.id === rescueId ? { ...r, healthStatus: newStatus } : r)
    }));
    showToast(`Estado de salud del rescate actualizado: ${newStatus}`);
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
            const appliedDate = created.date || new Date().toISOString().split('T')[0];
            const dueDateObj = new Date(appliedDate + 'T12:00:00');
            dueDateObj.setFullYear(dueDateObj.getFullYear() + 1);
            const dueDate = dueDateObj.toISOString().split('T')[0];

            const resolveManufacturer = (name) => {
              const lower = name.toLowerCase();
              if (lower.includes('defensor') || lower.includes('vanguard') || lower.includes('bronchicine')) return 'Zoetis';
              if (lower.includes('purevax')) return 'Boehringer Ingelheim';
              if (lower.includes('nobivac') || lower.includes('bravecto')) return 'MSD Salud Animal';
              if (lower.includes('endovet')) return 'Riverfarma';
              return 'Aplicada en Quirófano / Cirugía';
            };

            const newVacRecords = vaccineProcs.map((vacName, idx) => {
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

            nextVaccinations = [...newVacRecords, ...nextVaccinations];
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
    return created;
  };

  const updateSurgery = (surgeryId, updatedFields) => {
    const cleanAdditional = Array.isArray(updatedFields.additionalProcedures)
      ? updatedFields.additionalProcedures.map(p => p.trim()).filter(Boolean)
      : undefined;

    setData(prev => ({
      ...prev,
      surgeries: prev.surgeries.map(s => {
        if (s.id !== surgeryId) return s;
        return {
          ...s,
          ...updatedFields,
          ...(cleanAdditional !== undefined ? { additionalProcedures: cleanAdditional } : {})
        };
      })
    }));
    showToast('Registro quirúrgico y procedimientos actualizados');
    return { success: true };
  };

  const updateSurgeryStatus = (surgeryId, newStatus) => {
    setData(prev => ({
      ...prev,
      surgeries: prev.surgeries.map(s => s.id === surgeryId ? { ...s, status: newStatus } : s)
    }));
    showToast(`Cirugía actualizada a: ${newStatus}`);
  };

  const deleteSurgery = (surgeryId) => {
    setData(prev => ({
      ...prev,
      surgeries: prev.surgeries.filter(s => s.id !== surgeryId)
    }));
    deleteRowFromSupabase('surgeries', surgeryId);
    broadcastSync(realtimeChannelRef.current, { deviceId: deviceIdRef.current, action: 'delete', table: 'surgeries', id: surgeryId });
    showToast('Registro de cirugía eliminado', 'info');
  };

  // Vacunación y Passport to Travel
  const addVaccination = (newVac) => {
    const created = { ...newVac, id: `vac-${Date.now()}` };
    setData(prev => ({ ...prev, vaccinations: [created, ...prev.vaccinations] }));
    showToast(`Vacuna ${created.vaccineName} registrada en cartilla oficial`);
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
    return created;
  };

  const assignPatientToCage = (cageId, occupantDetails) => {
    const cleanPatientNames = Array.isArray(occupantDetails.patientNames)
      ? occupantDetails.patientNames.map(n => n.trim()).filter(Boolean)
      : (occupantDetails.patientName
          ? occupantDetails.patientName.split(',').map(n => n.trim()).filter(Boolean)
          : []);

    const combinedPatientName = cleanPatientNames.length > 0
      ? cleanPatientNames.join(', ')
      : (occupantDetails.patientName || '').trim();

    setData(prev => ({
      ...prev,
      cages: (prev.cages || []).map(cage => {
        if (cage.id === cageId) {
          return {
            ...cage,
            status: 'Ocupada',
            currentOccupant: {
              ...occupantDetails,
              patientName: combinedPatientName,
              patientNames: cleanPatientNames.length > 0 ? cleanPatientNames : [combinedPatientName].filter(Boolean),
              intakeTime: occupantDetails.intakeTime || new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
            }
          };
        }
        return cage;
      })
    }));
    const countLabel = cleanPatientNames.length > 1 ? ` (${cleanPatientNames.length} mascotas en la misma jaula)` : '';
    showToast(`Ingreso en jaula actualizado exitosamente${countLabel}`);
  };

  const releaseCage = (cageId, markForCleaning = true) => {
    setData(prev => ({
      ...prev,
      cages: (prev.cages || []).map(cage => {
        if (cage.id === cageId) {
          return {
            ...cage,
            status: markForCleaning ? 'Necesita Limpieza' : 'Disponible',
            currentOccupant: null,
            cleaningNotes: markForCleaning ? 'Alta reciente. Requiere desinfección profunda y cambio de tapete.' : undefined
          };
        }
        return cage;
      })
    }));
    showToast(markForCleaning ? 'Paciente dado de alta. Jaula marcada para limpieza.' : 'Paciente dado de alta. Jaula disponible.');
  };

  const markCageClean = (cageId) => {
    setData(prev => ({
      ...prev,
      cages: (prev.cages || []).map(cage => {
        if (cage.id === cageId) {
          return {
            ...cage,
            status: 'Disponible',
            cleaningNotes: undefined,
            lastCleaned: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
          };
        }
        return cage;
      })
    }));
    showToast('Jaula desinfectada y lista para nuevo paciente');
  };

  const updateCageStatus = (cageId, newStatus) => {
    setData(prev => ({
      ...prev,
      cages: (prev.cages || []).map(cage => {
        if (cage.id === cageId) {
          return {
            ...cage,
            status: newStatus,
            ...(newStatus === 'Disponible' ? { currentOccupant: null } : {})
          };
        }
        return cage;
      })
    }));
    showToast(`Estado de jaula actualizado a: ${newStatus}`);
  };

  const deleteCage = (cageId) => {
    setData(prev => ({
      ...prev,
      cages: (prev.cages || []).filter(cage => cage.id !== cageId)
    }));
    deleteRowFromSupabase('cages', cageId);
    broadcastSync(realtimeChannelRef.current, { deviceId: deviceIdRef.current, action: 'delete', table: 'cages', id: cageId });
    showToast('Jaula eliminada del inventario', 'info');
  };

  // Respaldos (Exportar / Importar)
  const exportBackup = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_vet_california_${new Date().toISOString().split('T')[0]}.json`;
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
