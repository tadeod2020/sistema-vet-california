import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  Clock, 
  Plus, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Sparkles,
  ShieldCheck,
  Stethoscope,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const OPERATING_HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

export function Agenda() {
  const { appointments, addAppointment, updateAppointmentStatus, deleteAppointment, clients, pets } = useApp();
  
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedHour, setPreselectedHour] = useState("09:00");

  // Form state
  const [formData, setFormData] = useState({
    timeHour: "09:00",
    clientName: "",
    petName: "",
    reason: "",
    assignedVet: "Médico Veterinario de Guardia"
  });

  // Filter appointments for selected day
  const dayAppointments = appointments.filter(a => a.date === selectedDate);

  // Group by hour
  const slotMap = {};
  OPERATING_HOURS.forEach(hour => {
    slotMap[hour] = dayAppointments.filter(a => a.timeHour === hour && a.status !== 'Cancelada');
  });

  // Calculate day stats
  const totalActive = dayAppointments.filter(a => a.status !== 'Cancelada').length;
  const completedCount = dayAppointments.filter(a => a.status === 'Completada').length;
  const maxDailySlots = OPERATING_HOURS.length * 2; // 2 per hour

  const openNewAptModal = (hour = null) => {
    const targetHour = hour || "09:00";
    setPreselectedHour(targetHour);
    setFormData(prev => ({ ...prev, timeHour: targetHour }));
    setIsModalOpen(true);
  };

  const handleCreateAppointment = (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.petName || !formData.reason) {
      alert("Por favor completa los campos del cliente, mascota y motivo.");
      return;
    }

    const res = addAppointment({
      ...formData,
      date: selectedDate,
      status: "Pendiente"
    });

    if (res.success) {
      setIsModalOpen(false);
      setFormData({
        timeHour: "09:00",
        clientName: "",
        petName: "",
        reason: "",
        assignedVet: "Médico Veterinario de Guardia"
      });
    }
  };

  const handleSelectClient = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      const clientPets = pets.filter(p => p.clientId === clientId);
      setFormData(prev => ({
        ...prev,
        clientName: client.name,
        petName: clientPets.length > 0 ? clientPets[0].name : ''
      }));
    }
  };

  // Change date by offset
  const shiftDate = (days) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Date Header & Quick Stats */}
      <div className="glass-card rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-sm">
            <Calendar className="w-6 h-6 text-rose-900" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Agenda Clínica por Hora
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200">
                Tope: 2 pacientes / hora
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Control estricto de cupos para evitar aglomeraciones en sala de espera y quirófano.
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
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl shadow-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />

            <button 
              onClick={() => shiftDate(1)} 
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95"
              title="Día siguiente"
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

      {/* Progress Bar of Daily Capacity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-500">Ocupación del Día</div>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
            {totalActive} <span className="text-xs font-normal text-slate-400">/ {maxDailySlots} cupos máx</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (totalActive / maxDailySlots) * 100)}%` }}
            ></div>
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
          <div className="text-xs font-semibold text-rose-950">Regla Clínica California</div>
          <div className="text-xs text-rose-900/90 mt-1 leading-relaxed">
            Cada franja horaria permite registrar hasta <span className="font-bold underline">2 citas</span>. Si el horario alcanza su límite, queda bloqueado para garantizar consulta de calidad.
          </div>
        </div>
      </div>

      {/* Hourly Schedule Matrix (8:00 AM to 7:00 PM) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {OPERATING_HOURS.map((hour) => {
          const slotApts = slotMap[hour] || [];
          const count = slotApts.length;
          const isFull = count >= 2;
          const hasSpace = count < 2;

          return (
            <div 
              key={hour} 
              className={`glass-card rounded-2xl p-4 border transition-all ${
                isFull 
                  ? 'border-rose-300 bg-rose-50/20 shadow-xs' 
                  : count === 1 
                  ? 'border-amber-300 bg-amber-50/20' 
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Hour Slot Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${isFull ? 'text-rose-700' : 'text-slate-500'}`} />
                  <span className="font-black text-sm text-slate-900 tracking-tight">{hour} hrs</span>
                </div>

                {/* Capacity badge */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isFull 
                      ? 'bg-rose-100 text-rose-900 border border-rose-300' 
                      : count === 1 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {count}/2 {isFull ? 'LLENO' : count === 1 ? '1 Libre' : 'Disponible'}
                  </span>

                  {hasSpace && (
                    <button
                      onClick={() => openNewAptModal(hour)}
                      title={`Agendar cita a las ${hour}`}
                      className="w-6 h-6 rounded-lg bg-amber-400 hover:bg-amber-500 text-amber-950 flex items-center justify-center font-bold transition-transform active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Slot Appointments List */}
              {count === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4 text-slate-300" />
                  <span>Horario disponible (0 de 2 cupos)</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {slotApts.map((apt, idx) => (
                    <div 
                      key={apt.id} 
                      className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="leading-tight">
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 inline-flex items-center justify-center text-[10px] font-mono">
                              #{idx + 1}
                            </span>
                            {apt.petName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            {apt.clientName}
                          </div>
                        </div>

                        {/* Status selector badge */}
                        <select
                          value={apt.status}
                          onChange={(e) => updateAppointmentStatus(apt.id, e.target.value)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border cursor-pointer focus:outline-none ${
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

                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3 text-rose-800" />
                          {apt.assignedVet}
                        </span>
                        <button
                          onClick={() => deleteAppointment(apt.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                          title="Eliminar cita"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Agendar Nueva Cita */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Agendar Cita en Agenda</h3>
                  <p className="text-xs text-slate-500">Máximo 2 citas permitidas por bloque horario</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              {/* Horario y Capacidad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bloque Horario ({selectedDate})
                </label>
                <select
                  value={formData.timeHour}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeHour: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  {OPERATING_HOURS.map((hour) => {
                    const currentInSlot = (slotMap[hour] || []).length;
                    const full = currentInSlot >= 2;
                    return (
                      <option key={hour} value={hour} disabled={full}>
                        {hour} hrs — {full ? '❌ LLENO (2/2 citas)' : `${currentInSlot}/2 cupos ocupados`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Quick Pick Client */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seleccionar de Clientes Registrados (Opcional)
                </label>
                <select
                  onChange={(e) => handleSelectClient(e.target.value)}
                  defaultValue=""
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
                  placeholder="Ej. Carmen Villalobos o Rescate Callejero"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              {/* Nombre de Mascota */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre o Descripción de la Mascota *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Canela (Mestizo) o Perro sin nombre herido"
                  value={formData.petName}
                  onChange={(e) => setFormData(prev => ({ ...prev, petName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
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

              {/* Veterinario Asignado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Personal Médico / Veterinario
                </label>
                <select
                  value={formData.assignedVet}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedVet: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="Médico Veterinario de Guardia">Médico Veterinario de Guardia</option>
                  <option value="Personal Clínico California">Personal Clínico California</option>
                  <option value="Especialista en Consulta">Especialista en Consulta</option>
                  <option value="Atención General">Atención General</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  Confirmar Cita (Tope 2/hora)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
