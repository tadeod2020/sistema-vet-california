import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getLocalDateString, shiftLocalDateString } from '../lib/dateUtils.js';
import { 
  Calendar, 
  Clock, 
  Plus, 
  User, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Dog
} from 'lucide-react';

const OPERATING_HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

const DEFAULT_DOCTORS = [
  "Dra. María José Mendoza Gutiérrez",
  "Dr. Miguel Ángel Michel Rea",
  "Dr. José Rubén Estrada Hernández",
  "Dr. César Wilfredo Solórzano Hernández"
];

function getAptPets(apt) {
  if (Array.isArray(apt.petNames) && apt.petNames.length > 0) {
    return apt.petNames.filter(Boolean);
  }
  if (apt.petName) {
    return apt.petName.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export function Agenda() {
  const {
    appointments,
    addAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    clients,
    pets,
    CLINIC_DOCTORS
  } = useApp();

  const doctorOptions = CLINIC_DOCTORS && CLINIC_DOCTORS.length > 0 ? CLINIC_DOCTORS : DEFAULT_DOCTORS;

  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAptId, setEditingAptId] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState("");

  // Form state (supports 2 or more dogs/pets via petNames array)
  const [formData, setFormData] = useState({
    date: getLocalDateString(),
    timeHour: "09:00",
    clientName: "",
    petNames: [""],
    reason: "",
    assignedVet: doctorOptions[0],
    status: "Pendiente"
  });

  // Filter appointments for selected day
  const dayAppointments = appointments.filter(a => a.date === selectedDate);

  // Group by hour
  const slotMap = {};
  OPERATING_HOURS.forEach(hour => {
    slotMap[hour] = dayAppointments.filter(a => a.timeHour === hour && a.status !== 'Cancelada');
  });

  // Calculate day stats
  const activeDayApts = dayAppointments.filter(a => a.status !== 'Cancelada');
  const totalActiveApts = activeDayApts.length;
  const totalActivePets = activeDayApts.reduce((sum, apt) => sum + Math.max(1, getAptPets(apt).length), 0);
  const completedCount = dayAppointments.filter(a => a.status === 'Completada').length;

  const openNewAptModal = (hour = null) => {
    const targetHour = hour || "09:00";
    setEditingAptId(null);
    setSelectedClientId("");
    setFormData({
      date: selectedDate,
      timeHour: targetHour,
      clientName: "",
      petNames: [""],
      reason: "",
      assignedVet: doctorOptions[0],
      status: "Pendiente"
    });
    setIsModalOpen(true);
  };

  const openEditAptModal = (apt) => {
    const existingPets = getAptPets(apt);
    const matchedClient = clients.find(
      c => c.name.trim().toLowerCase() === (apt.clientName || "").trim().toLowerCase()
    );
    setEditingAptId(apt.id);
    setSelectedClientId(matchedClient ? matchedClient.id : "");
    setFormData({
      date: apt.date || selectedDate,
      timeHour: apt.timeHour || "09:00",
      clientName: apt.clientName || "",
      petNames: existingPets.length > 0 ? existingPets : [""],
      reason: apt.reason || "",
      assignedVet: apt.assignedVet || doctorOptions[0],
      status: apt.status || "Pendiente"
    });
    setIsModalOpen(true);
  };

  const handleSaveAppointment = (e) => {
    e.preventDefault();
    const validPets = (formData.petNames || []).map(p => p.trim()).filter(Boolean);

    if (!formData.clientName.trim() || validPets.length === 0 || !formData.reason.trim()) {
      alert("Por favor completa el nombre del cliente, al menos una mascota y el motivo de consulta.");
      return;
    }

    const payload = {
      date: formData.date || selectedDate,
      timeHour: formData.timeHour,
      clientName: formData.clientName.trim(),
      petNames: validPets,
      petName: validPets.join(", "),
      reason: formData.reason.trim(),
      assignedVet: formData.assignedVet,
      status: formData.status || "Pendiente"
    };

    if (editingAptId) {
      const res = updateAppointment(editingAptId, payload);
      if (res?.success) {
        if (payload.date !== selectedDate) {
          setSelectedDate(payload.date);
        }
        setIsModalOpen(false);
        setEditingAptId(null);
      }
    } else {
      const res = addAppointment(payload);
      if (res?.success) {
        if (payload.date !== selectedDate) {
          setSelectedDate(payload.date);
        }
        setIsModalOpen(false);
      }
    }
  };

  const handleSelectClient = (clientId) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      const clientPets = pets.filter(p => p.clientId === clientId);
      setFormData(prev => ({
        ...prev,
        clientName: client.name,
        petNames: clientPets.length > 0 ? clientPets.map(p => p.name) : prev.petNames
      }));
    }
  };

  const handlePetNameChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.petNames];
      updated[index] = value;
      return { ...prev, petNames: updated };
    });
  };

  const addPetField = () => {
    setFormData(prev => ({
      ...prev,
      petNames: [...prev.petNames, ""]
    }));
  };

  const removePetField = (index) => {
    setFormData(prev => {
      if (prev.petNames.length <= 1) return prev;
      return {
        ...prev,
        petNames: prev.petNames.filter((_, idx) => idx !== index)
      };
    });
  };

  const toggleRegisteredPet = (petName) => {
    setFormData(prev => {
      const cleanCurrent = prev.petNames.map(p => p.trim()).filter(Boolean);
      const exists = cleanCurrent.includes(petName);
      let nextPets;
      if (exists) {
        nextPets = cleanCurrent.filter(p => p !== petName);
      } else {
        nextPets = [...cleanCurrent, petName];
      }
      return {
        ...prev,
        petNames: nextPets.length > 0 ? nextPets : [""]
      };
    });
  };

  // Change date by offset
  const shiftDate = (days) => {
    setSelectedDate(prev => shiftLocalDateString(prev, days));
  };

  const selectedClientPets = selectedClientId
    ? pets.filter(p => p.clientId === selectedClientId)
    : [];

  const vetSelectOptions = doctorOptions.includes(formData.assignedVet)
    ? doctorOptions
    : [formData.assignedVet, ...doctorOptions].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Date Header & Quick Stats */}
      <div className="glass-card rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-sm">
            <Calendar className="w-6 h-6 text-rose-900" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex flex-wrap items-center gap-2">
              Agenda Clínica por Hora
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
                Multi-mascota (2+ perros por cita y hora)
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Agenda flexible por bloques horarios con edición de citas y soporte para 2 o más perros por turno.
            </p>
          </div>
        </div>

        {/* Date Selector with Next / Prev */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <button 
              onClick={() => shiftDate(-1)} 
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95"
              title="Día anterior"
              aria-label="Día anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <input 
              type="date" 
              aria-label="Seleccionar fecha de agenda"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl shadow-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />

            <button 
              onClick={() => shiftDate(1)} 
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95"
              title="Día siguiente"
              aria-label="Día siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => openNewAptModal()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 min-h-[40px] sm:min-h-0"
          >
            <Plus className="w-4 h-4 text-rose-900 stroke-[3]" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Summary Cards of Daily Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-500">Citas y Pacientes del Día</div>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
            {totalActiveApts} <span className="text-xs font-semibold text-slate-500">citas</span>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              {totalActivePets} {totalActivePets === 1 ? 'mascota' : 'mascotas'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <Dog className="w-3.5 h-3.5 text-amber-600" /> Permite 2 o más perros por cita y horario
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-500">Citas Atendidas Hoy</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 flex items-baseline gap-2">
            {completedCount} <span className="text-xs font-normal text-slate-400">completadas</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Pacientes consultados
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 bg-gradient-to-br from-amber-50/50 to-rose-50/30 border-amber-200/60">
          <div className="text-xs font-semibold text-rose-950">Gestión Flexible de Agenda</div>
          <div className="text-xs text-rose-900/90 mt-1 leading-relaxed">
            Puedes <span className="font-bold underline">editar cualquier cita</span> en todo momento y agregar <span className="font-bold underline">2 o más perros</span> en la misma cita o dentro de la misma hora.
          </div>
        </div>
      </div>

      {/* Hourly Schedule Matrix (8:00 AM to 7:00 PM) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {OPERATING_HOURS.map((hour) => {
          const slotApts = slotMap[hour] || [];
          const count = slotApts.length;
          const totalPetsInSlot = slotApts.reduce((sum, apt) => sum + Math.max(1, getAptPets(apt).length), 0);

          return (
            <div 
              key={hour} 
              className={`glass-card rounded-2xl p-4 border transition-all ${
                count >= 2 
                  ? 'border-amber-300 bg-amber-50/20 shadow-xs' 
                  : count === 1 
                  ? 'border-amber-200 bg-amber-50/10' 
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Hour Slot Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${count > 0 ? 'text-amber-700' : 'text-slate-500'}`} />
                  <span className="font-black text-sm text-slate-900 tracking-tight">{hour} hrs</span>
                </div>

                {/* Slot count badge + Always-available Add button */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    count >= 2 
                      ? 'bg-amber-100 text-amber-950 border border-amber-300' 
                      : count === 1 
                      ? 'bg-sky-50 text-sky-900 border border-sky-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {count === 0
                      ? 'Disponible'
                      : `${count} ${count === 1 ? 'cita' : 'citas'} · ${totalPetsInSlot} ${totalPetsInSlot === 1 ? 'perro/mascota' : 'perros/mascotas'}`}
                  </span>

                  <button
                    onClick={() => openNewAptModal(hour)}
                    title={`Agendar cita a las ${hour}`}
                    aria-label={`Agendar cita a las ${hour}`}
                    className="w-6 h-6 rounded-lg bg-amber-400 hover:bg-amber-500 text-amber-950 flex items-center justify-center font-bold transition-transform active:scale-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Slot Appointments List */}
              {count === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4 text-slate-300" />
                  <span>Horario disponible — clic en + para agendar</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {slotApts.map((apt, idx) => {
                    const aptPets = getAptPets(apt);
                    return (
                      <div 
                        key={apt.id} 
                        className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="leading-tight flex-1 min-w-0">
                            <div className="font-bold text-xs text-slate-900 flex flex-wrap items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 inline-flex items-center justify-center text-[10px] font-mono shrink-0">
                                #{idx + 1}
                              </span>
                              {aptPets.length > 1 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-300">
                                  <Dog className="w-3 h-3 text-rose-900" />
                                  {aptPets.length} mascotas
                                </span>
                              ) : (
                                <span className="truncate">{apt.petName}</span>
                              )}
                            </div>

                            {aptPets.length > 1 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {aptPets.map((pet, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200"
                                  >
                                    🐾 {pet}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{apt.clientName}</span>
                            </div>
                          </div>

                          {/* Status selector badge */}
                          <select
                            aria-label={`Estado de cita de ${apt.clientName}`}
                            value={apt.status}
                            onChange={(e) => updateAppointmentStatus(apt.id, e.target.value)}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border cursor-pointer focus:outline-none shrink-0 ${
                              apt.status === 'Completada'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : apt.status === 'En Consulta'
                                ? 'bg-purple-50 text-purple-800 border-purple-300'
                                : apt.status === 'En Espera'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-slate-50 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Espera">En Espera</option>
                            <option value="En Consulta">En Consulta</option>
                            <option value="Completada">Completada</option>
                            <option value="Cancelada">Cancelar</option>
                          </select>
                        </div>

                        <div className="mt-2 text-xs text-slate-700 bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
                          {apt.reason}
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1 truncate">
                            <Stethoscope className="w-3 h-3 text-rose-800 shrink-0" />
                            <span className="truncate">{apt.assignedVet}</span>
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditAptModal(apt)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                              title="Editar cita médica"
                            >
                              <Pencil className="w-3 h-3" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAppointment(apt.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Eliminar cita"
                            >
                              <Trash2 className="w-3 h-3" />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Agendar Nueva Cita o Editar Cita Existente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  {editingAptId ? (
                    <Pencil className="w-5 h-5 text-rose-900" />
                  ) : (
                    <Calendar className="w-5 h-5 text-rose-900" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingAptId ? "Editar Cita Médica" : "Agendar Cita en Agenda"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingAptId
                      ? "Modifica el horario, fecha, perros/mascotas o motivo de consulta"
                      : "Puedes agregar 1, 2 o más perros en la misma cita u horario"}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAptId(null);
                }}
                aria-label="Cerrar ventana"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-4">
              {/* Fecha y Bloque Horario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de la Cita *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bloque Horario *
                  </label>
                  <select
                    value={formData.timeHour}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeHour: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-semibold text-slate-800"
                  >
                    {OPERATING_HOURS.map((hour) => {
                      const aptsAtHour = appointments.filter(
                        a => a.date === formData.date && a.timeHour === hour && a.status !== 'Cancelada' && a.id !== editingAptId
                      );
                      const petsAtHour = aptsAtHour.reduce((sum, a) => sum + Math.max(1, getAptPets(a).length), 0);
                      return (
                        <option key={hour} value={hour}>
                          {hour} hrs — {aptsAtHour.length === 0 ? 'Disponible' : `${aptsAtHour.length} cita(s) / ${petsAtHour} mascota(s)`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Quick Pick Client */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seleccionar de Clientes Registrados (Opcional)
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="">-- Escribir manualmente o elegir cliente existente --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isFrequent ? '★ (Frecuente)' : ''} — {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre de Dueño */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Dueño o Rescatista *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez o Rescate Callejero"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              {/* Lista Dinámica de Perros / Mascotas (2 o más perros) */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Dog className="w-4 h-4 text-rose-900" />
                    Perros / Mascotas en esta Cita *
                  </label>
                  <button
                    type="button"
                    onClick={addPetField}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-2xs transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    Agregar otro perro
                  </button>
                </div>

                {/* Si el cliente seleccionado tiene mascotas registradas, mostrar selección rápida */}
                {selectedClientPets.length > 0 && (
                  <div className="pb-1">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                      Mascotas registradas de este cliente (clic para incluir/quitar):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedClientPets.map(pet => {
                        const isSelected = formData.petNames.map(p => p.trim()).includes(pet.name);
                        return (
                          <button
                            key={pet.id}
                            type="button"
                            onClick={() => toggleRegisteredPet(pet.name)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-all ${
                              isSelected
                                ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            🐾 {pet.name} {pet.breed ? `(${pet.breed})` : ''} {isSelected ? '✓' : '+'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {formData.petNames.map((petName, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white border border-amber-300 text-amber-950 text-xs font-bold inline-flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        required={index === 0}
                        placeholder={
                          index === 0
                            ? "Ej. Max (Mestizo) o Perro #1"
                            : `Nombre o descripción del perro #${index + 1}`
                        }
                        value={petName}
                        onChange={(e) => handlePetNameChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                      {formData.petNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePetField(index)}
                          title="Quitar esta mascota"
                          aria-label={`Quitar mascota ${index + 1}`}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Usa el botón <strong>+ Agregar otro perro</strong> si el dueño trae 2 o más mascotas en la misma hora.
                </p>
              </div>

              {/* Motivo de Consulta */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo de Visita *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ej. Pasaporte de Viaje y Vacuna Rabia, revisión de herida, consulta general..."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              {/* Veterinario Asignado y Estado (si edita) */}
              <div className={`grid grid-cols-1 ${editingAptId ? 'sm:grid-cols-2' : ''} gap-3`}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Personal Médico / Veterinario
                  </label>
                  <select
                    value={formData.assignedVet}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedVet: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-semibold text-slate-800"
                  >
                    {vetSelectOptions.map(doc => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>

                {editingAptId && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Estado de la Cita
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-semibold text-slate-800"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Espera">En Espera</option>
                      <option value="En Consulta">En Consulta</option>
                      <option value="Completada">Completada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingAptId(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  {editingAptId ? "Guardar Cambios" : "Confirmar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
