import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_DATA } from '../data/initialData';

const AppContext = createContext();

const STORAGE_KEY = 'vet_california_system_v1';
const AUTH_STORAGE_KEY = 'vet_california_auth_session';

export const PROVISIONAL_CREDENTIALS = {
  email: 'admin@veterinariacalifornia.com',
  password: 'california2026',
  name: 'Administrador',
  role: 'Personal Clínico Autorizado'
};

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed?.name?.includes('Mario') || parsed?.name?.includes('Estrada')) {
          parsed.name = 'Administrador';
          parsed.role = 'Personal Clínico Autorizado';
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed;
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
        const mergedPets = (parsed.pets || INITIAL_DATA.pets).map(p => {
          const initP = INITIAL_DATA.pets.find(ip => ip.id === p.id);
          return {
            ...p,
            photoUrl: p.photoUrl || initP?.photoUrl || '',
            clinicalNotes: p.clinicalNotes || initP?.clinicalNotes || []
          };
        });
        return {
          ...INITIAL_DATA,
          ...parsed,
          pets: mergedPets,
          cages: parsed.cages && parsed.cages.length > 0 ? parsed.cages : INITIAL_DATA.cages
        };
      }
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
    return INITIAL_DATA;
  });

  const [activeTab, setActiveTab] = useState('agenda'); // agenda | clients | rescues | surgeries | passport
  const [notification, setNotification] = useState(null);
  const [selectedPetIdForPassport, setSelectedPetIdForPassport] = useState(null);

  // Auto-save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error persisting state:', e);
    }
  }, [data]);

  // Toast / Notification helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 3800);
  };

  // Auth: Login & Logout
  const login = (inputEmail, inputPassword) => {
    const cleanEmail = (inputEmail || '').trim().toLowerCase();
    const cleanPass = (inputPassword || '').trim();

    if (
      (cleanEmail === PROVISIONAL_CREDENTIALS.email.toLowerCase() || cleanEmail === 'doctor@vetcalifornia.com' || cleanEmail === 'admin@vetcalifornia.com') &&
      (cleanPass === PROVISIONAL_CREDENTIALS.password || cleanPass === 'california2026')
    ) {
      const user = {
        name: PROVISIONAL_CREDENTIALS.name,
        email: cleanEmail,
        role: PROVISIONAL_CREDENTIALS.role,
        loginAt: new Date().toISOString()
      };
      setCurrentUser(user);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } catch (e) {
        console.error('Error storing session:', e);
      }
      showToast(`¡Bienvenido al sistema clínico, ${user.name}!`);
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Correo o contraseña incorrectos. Usa el botón "⚡ Autorrellenar" para probar las credenciales provisionales.' 
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

  // Agenda: Validate strict max 2 appointments per hour slot
  const addAppointment = (newApt) => {
    const existingInSlot = data.appointments.filter(
      apt => apt.date === newApt.date && apt.timeHour === newApt.timeHour && apt.status !== 'Cancelada'
    );

    if (existingInSlot.length >= 2) {
      showToast(`¡Sobrecupo! El bloque de las ${newApt.timeHour} ya tiene el máximo permitido de 2 citas.`, 'error');
      return { success: false, reason: 'slot_full' };
    }

    const created = {
      ...newApt,
      id: `apt-${Date.now()}`,
      slotIndex: existingInSlot.length + 1
    };

    setData(prev => ({
      ...prev,
      appointments: [created, ...prev.appointments]
    }));

    showToast(`Cita agendada con éxito para las ${newApt.timeHour} (Cupo ${existingInSlot.length + 1}/2)`);
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
      ...newPet,
      id: newPet.id || `pet-${Date.now()}`
    };
    setData(prev => ({ ...prev, pets: [created, ...prev.pets] }));
    showToast(`Mascota ${created.name} dada de alta en el sistema`);
    return created;
  };

  const updatePet = (petId, fields) => {
    setData(prev => ({
      ...prev,
      pets: prev.pets.map(p => p.id === petId ? { ...p, ...fields } : p)
    }));
    showToast('Datos de la mascota actualizados');
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

    const newPet = {
      id: `pet-${Date.now()}`,
      clientId,
      name: petName.trim(),
      species: optionalFields.species || 'Canino',
      breed: optionalFields.breed || 'Sin especificar',
      ageYears: optionalFields.ageYears ? Number(optionalFields.ageYears) : 1,
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

  // Cirugías
  const addSurgery = (newSurgery) => {
    const created = { ...newSurgery, id: `surg-${Date.now()}` };
    setData(prev => ({ ...prev, surgeries: [created, ...prev.surgeries] }));
    showToast(`Procedimiento quirúrgico registrado: ${created.procedure}`);
    return created;
  };

  const updateSurgeryStatus = (surgeryId, newStatus) => {
    setData(prev => ({
      ...prev,
      surgeries: prev.surgeries.map(s => s.id === surgeryId ? { ...s, status: newStatus } : s)
    }));
    showToast(`Cirugía actualizada a: ${newStatus}`);
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
    const created = {
      ...newCage,
      id: `cage-${Date.now()}`,
      code: newCage.code || `J-${String((data.cages?.length || 0) + 1).padStart(2, '0')}`,
      status: newCage.status || 'Disponible',
      currentOccupant: null,
      lastCleaned: 'Recién registrada'
    };
    setData(prev => ({ ...prev, cages: [...(prev.cages || []), created] }));
    showToast(`Jaula ${created.code} agregada al inventario clínico`);
    return created;
  };

  const assignPatientToCage = (cageId, occupantDetails) => {
    setData(prev => ({
      ...prev,
      cages: (prev.cages || []).map(cage => {
        if (cage.id === cageId) {
          return {
            ...cage,
            status: 'Ocupada',
            currentOccupant: {
              ...occupantDetails,
              intakeTime: occupantDetails.intakeTime || new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
            }
          };
        }
        return cage;
      })
    }));
    showToast(`Paciente ingresado en jaula exitosamente`);
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

  const resetToDefaults = () => {
    if (window.confirm('¿Seguro que deseas restaurar los datos de demostración de Servicio Veterinario California? Se sobreescribirán los cambios no respaldados.')) {
      setData(INITIAL_DATA);
      showToast('Datos reiniciados a los valores de fábrica de demostración');
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
        // Authentication
        isAuthenticated,
        currentUser,
        login,
        logout,
        PROVISIONAL_CREDENTIALS,
        // Methods
        addAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        addClient,
        addPet,
        updatePet,
        addClinicalNote,
        registerPetDirect,
        selectedPetIdForPassport,
        setSelectedPetIdForPassport,
        openPetPassport,
        addRescue,
        addRescueIntervention,
        updateRescueStatus,
        addSurgery,
        updateSurgeryStatus,
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
