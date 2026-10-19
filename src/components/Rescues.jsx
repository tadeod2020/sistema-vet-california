import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  HeartHandshake, 
  Plus, 
  MapPin, 
  Calendar, 
  Stethoscope, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  User,
  Pencil,
  XCircle,
  Sparkles
} from 'lucide-react';

export function Rescues() {
  const { rescues, addRescue, addRescueIntervention, updateRescueStatus } = useApp();

  const [selectedRescue, setSelectedRescue] = useState(() => rescues.length > 0 ? rescues[0] : null);
  const [isNewRescueModalOpen, setIsNewRescueModalOpen] = useState(false);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);

  // New Rescue Form
  const [rescueForm, setRescueForm] = useState({
    physicalDescription: '',
    rescueLocation: '',
    rescuerName: 'Rescatista Anónimo / Callejero',
    temperament: 'Dócil pero asustadizo',
    healthStatus: 'En tratamiento',
    initialIntervention: ''
  });

  // New Intervention Form
  const [interventionForm, setInterventionForm] = useState({
    type: 'Curación & Tratamiento',
    description: '',
    meds: '',
    vet: 'Dra. María José Mendoza Gutiérrez'
  });

  const handleCreateRescue = (e) => {
    e.preventDefault();
    if (!rescueForm.physicalDescription) {
      alert('La descripción física es obligatoria para identificar al animal sin nombre.');
      return;
    }

    const created = addRescue({
      physicalDescription: rescueForm.physicalDescription,
      rescueLocation: rescueForm.rescueLocation || 'Zona Centro, Tijuana',
      rescuerName: rescueForm.rescuerName,
      temperament: rescueForm.temperament,
      healthStatus: rescueForm.healthStatus,
      interventions: rescueForm.initialIntervention ? [
        {
          date: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
          type: 'Ingreso & Primeros Auxilios',
          description: rescueForm.initialIntervention,
          vet: 'Médico Veterinario de Turno',
          meds: 'Desparasitante y analgésico de rescate'
        }
      ] : []
    });

    setIsNewRescueModalOpen(false);
    setSelectedRescue(created);
    setRescueForm({
      physicalDescription: '',
      rescueLocation: '',
      rescuerName: 'Rescatista Anónimo / Callejero',
      temperament: 'Dócil pero asustadizo',
      healthStatus: 'En tratamiento',
      initialIntervention: ''
    });
  };

  const handleAddIntervention = (e) => {
    e.preventDefault();
    if (!interventionForm.description || !selectedRescue) return;

    addRescueIntervention(selectedRescue.id, interventionForm);
    setIsInterventionModalOpen(false);
    setInterventionForm({
      type: 'Curación & Tratamiento',
      description: '',
      meds: '',
      vet: 'Médico Veterinario de Turno'
    });
  };

  // Find updated selected rescue
  const activeRescue = rescues.find(r => r.id === selectedRescue?.id) || rescues[0] || null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-sm">
            <HeartHandshake className="w-6 h-6 text-rose-900" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Apartado de Rescates Callejeros
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200">
                Registro sin nombre &bull; Bitácora clínica
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Diseñado para perros y gatos en situación de calle identificados únicamente por sus rasgos físicos y tratamientos recibidos.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewRescueModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-rose-900 stroke-[3]" />
          Registrar Perro/Gato Rescatado
        </button>
      </div>

      {/* Main 2-Column Layout: Left List, Right Detailed Medical Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rescues Cards List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>Animales en Padrón de Rescate ({rescues.length})</span>
            <span className="text-[10px] text-amber-900">Selecciona para ver bitácora</span>
          </div>

          <div className="space-y-3">
            {rescues.map((rescue) => {
              const isSelected = activeRescue?.id === rescue.id;
              return (
                <div
                  key={rescue.id}
                  onClick={() => setSelectedRescue(rescue)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                    isSelected 
                      ? 'bg-amber-50/60 border-amber-400 shadow-md ring-2 ring-amber-300/40' 
                      : 'glass-card border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-900 text-amber-400">
                      {rescue.code}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rescue.healthStatus === 'Listo para adopción'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : rescue.healthStatus === 'Adoptado'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : rescue.healthStatus === 'Crítico'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {rescue.healthStatus}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-bold text-slate-900 line-clamp-2">
                    {rescue.physicalDescription}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {rescue.rescueLocation.split(',')[0]}
                    </span>
                    <span className="font-semibold text-rose-900">
                      {rescue.interventions?.length || 0} intervenciones
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Rescue Dossier & Interventions History */}
        <div className="lg:col-span-7">
          {activeRescue ? (
            <div className="glass-card rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300">
                      {activeRescue.code}
                    </span>
                    <h3 className="font-extrabold text-lg text-slate-900">Expediente de Rescate</h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ingreso: {activeRescue.intakeDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Rescatista: {activeRescue.rescuerName}
                    </span>
                  </div>
                </div>

                {/* Health Status Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Estado:</span>
                  <select
                    value={activeRescue.healthStatus}
                    onChange={(e) => updateRescueStatus(activeRescue.id, e.target.value)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="En tratamiento">En tratamiento</option>
                    <option value="En recuperación">En recuperación</option>
                    <option value="Listo para adopción">Listo para adopción</option>
                    <option value="Adoptado">Adoptado</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
              </div>

              {/* Physical Description Callout */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="text-xs font-black text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-rose-900" />
                  Descripción Física Identificativa (Sin Nombre)
                </div>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                  {activeRescue.physicalDescription}
                </p>
                <div className="pt-2 border-t border-amber-200/60 flex flex-wrap gap-4 text-xs text-amber-950">
                  <span><strong>Lugar de Rescate:</strong> {activeRescue.rescueLocation}</span>
                  {activeRescue.temperament && <span><strong>Temperamento:</strong> {activeRescue.temperament}</span>}
                </div>
              </div>

              {/* Interventions Log (Lo que se le ha hecho) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-rose-900" />
                    Bitácora de Intervenciones Médicas ({activeRescue.interventions?.length || 0})
                  </h4>

                  <button
                    onClick={() => setIsInterventionModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar Tratamiento
                  </button>
                </div>

                {(!activeRescue.interventions || activeRescue.interventions.length === 0) ? (
                  <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Aún no se registran procedimientos o curaciones para este rescate.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-amber-300 ml-4 pl-4 space-y-4">
                    {activeRescue.interventions.map((item, idx) => (
                      <div key={idx} className="relative group">
                        {/* Dot indicator */}
                        <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-xs"></div>

                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-extrabold text-xs text-slate-900">{item.type}</span>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> {item.date} &bull; {item.vet}
                              </div>
                            </div>
                          </div>

                          <p className="mt-2 text-xs text-slate-700 leading-relaxed font-medium">
                            {item.description}
                          </p>

                          {item.meds && (
                            <div className="mt-2 text-[11px] text-rose-900 bg-rose-50/70 px-2.5 py-1 rounded-lg border border-rose-200 font-mono">
                              <strong>Medicamentos / Dosis:</strong> {item.meds}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 glass-card rounded-3xl">
              No hay rescate seleccionado.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Nuevo Rescate (Perro o gato sin nombre) */}
      {isNewRescueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <HeartHandshake className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Ingreso de Rescate Callejero</h3>
                  <p className="text-xs text-slate-500">Identificación por rasgos físicos (sin nombre formal)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewRescueModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRescue} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción Física Detallada *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ej. Mestizo macho talla mediana, color canela con calcetines blancos, orejas dobladas, cicatriz en lomo, peso aprox 15kg..."
                  value={rescueForm.physicalDescription}
                  onChange={(e) => setRescueForm(prev => ({ ...prev, physicalDescription: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lugar del Rescate (Calle / Colonia en Tijuana)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Calle Tercera y Mutualismo (Zona Centro) o Puente El Refugio"
                  value={rescueForm.rescueLocation}
                  onChange={(e) => setRescueForm(prev => ({ ...prev, rescueLocation: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rescatista / Quien lo Trae</label>
                  <input
                    type="text"
                    value={rescueForm.rescuerName}
                    onChange={(e) => setRescueForm(prev => ({ ...prev, rescuerName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estado de Salud Inicial</label>
                  <select
                    value={rescueForm.healthStatus}
                    onChange={(e) => setRescueForm(prev => ({ ...prev, healthStatus: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="En tratamiento">En tratamiento</option>
                    <option value="En recuperación">En recuperación</option>
                    <option value="Crítico">Crítico</option>
                    <option value="Listo para adopción">Listo para adopción</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primera Intervención al Ingreso (Qué se le hizo)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Limpieza de herida infectada con clorhexidina, sutura de 3 puntos, aplicación de suero y analgésico..."
                  value={rescueForm.initialIntervention}
                  onChange={(e) => setRescueForm(prev => ({ ...prev, initialIntervention: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRescueModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  Registrar en Padrón de Rescates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nueva Intervención a Rescate Activo */}
      {isInterventionModalOpen && activeRescue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Nueva Intervención: {activeRescue.code}
                  </h3>
                  <p className="text-xs text-slate-500">Registro de procedimiento clínico o curación</p>
                </div>
              </div>
              <button 
                onClick={() => setIsInterventionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddIntervention} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Procedimiento *</label>
                <select
                  value={interventionForm.type}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="Curación & Lavado de Heridas">Curación & Lavado de Heridas</option>
                  <option value="Esterilización / Castración">Esterilización / Castración</option>
                  <option value="Desparasitación Interna/Externa">Desparasitación Interna/Externa</option>
                  <option value="Vacunación">Vacunación</option>
                  <option value="Terapia de Fluidos (Suero)">Terapia de Fluidos (Suero)</option>
                  <option value="Tratamiento de Sarna / Piel">Tratamiento de Sarna / Piel</option>
                  <option value="Cirugía Menor">Cirugía Menor</option>
                  <option value="Revisión General / Alta">Revisión General / Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ¿Qué se le realizó con exactitud? *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detalla la evolución, limpieza, sutura, drenado, vendaje..."
                  value={interventionForm.description}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Medicamentos Administrados & Dosis
                </label>
                <input
                  type="text"
                  placeholder="Ej. Amoxicilina 250mg c/12h, Meloxicam 0.5ml..."
                  value={interventionForm.meds}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, meds: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Personal Médico Responsable</label>
                <select
                  value={interventionForm.vet}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, vet: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-semibold text-slate-800"
                >
                  <option value="Dra. María José Mendoza Gutiérrez">Dra. María José Mendoza Gutiérrez</option>
                  <option value="Dr. Miguel Ángel Michel Rea">Dr. Miguel Ángel Michel Rea</option>
                  <option value="Dr. José Rubén Estrada Hernández">Dr. José Rubén Estrada Hernández</option>
                  <option value="Dr. César Wilfredo Solórzano Hernández">Dr. César Wilfredo Solórzano Hernández</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInterventionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  Agregar a la Bitácora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
