import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  PawPrint, 
  Trash2, 
  ShieldAlert, 
  XCircle,
  Filter,
  Check,
  Stethoscope,
  SprayCan,
  Building,
  Pencil
} from 'lucide-react';

function getCagePets(occupant) {
  if (!occupant) return [];
  if (Array.isArray(occupant.patientNames) && occupant.patientNames.length > 0) {
    return occupant.patientNames.map(s => String(s).trim()).filter(Boolean);
  }
  if (occupant.patientName) {
    return String(occupant.patientName).split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export function Cages() {
  const { 
    cages = [], 
    addCage, 
    assignPatientToCage, 
    releaseCage, 
    markCageClean, 
    updateCageStatus, 
    deleteCage,
    pets, 
    clients = [],
    rescues 
  } = useApp();

  const [filterStatus, setFilterStatus] = useState('all'); // all | Disponible | Ocupada | Necesita Limpieza | Mantenimiento
  const [filterZone, setFilterZone] = useState('all');

  // Modals
  const [isAddCageModalOpen, setIsAddCageModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCageForAssign, setSelectedCageForAssign] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');

  // New Cage Form
  const [cageForm, setCageForm] = useState({
    code: '',
    name: '',
    size: 'Mediana (Perros 10-25kg)',
    zone: 'Hospitalización General',
    status: 'Disponible'
  });

  // Assign Patient Form (supports 2 or more pets in the same cage via patientNames)
  const [assignForm, setAssignForm] = useState({
    patientNames: [''],
    ownerName: '',
    reason: '',
    specialCare: '',
    intakeTime: ''
  });

  // Filtered cages
  const filteredCages = cages.filter(cage => {
    const matchesStatus = filterStatus === 'all' || cage.status === filterStatus;
    const matchesZone = filterZone === 'all' || cage.zone === filterZone;
    return matchesStatus && matchesZone;
  });

  // Statistics
  const totalCages = cages.length;
  const availableCount = cages.filter(c => c.status === 'Disponible').length;
  const occupiedCount = cages.filter(c => c.status === 'Ocupada').length;
  const needsCleaningCount = cages.filter(c => c.status === 'Necesita Limpieza').length;

  const zones = Array.from(new Set(cages.map(c => c.zone)));

  const handleCreateCage = (e) => {
    e.preventDefault();
    if (!cageForm.code || !cageForm.name) {
      alert('Código y nombre de la jaula son obligatorios');
      return;
    }

    addCage(cageForm);
    setIsAddCageModalOpen(false);
    setCageForm({
      code: '',
      name: '',
      size: 'Mediana (Perros 10-25kg)',
      zone: 'Hospitalización General',
      status: 'Disponible'
    });
  };

  const openAssignModal = (cage, appendEmptySlot = false) => {
    setSelectedCageForAssign(cage);
    const occ = cage.currentOccupant;
    const existingPets = getCagePets(occ);
    const matchedClient = occ?.ownerName
      ? clients.find(c => c.name.trim().toLowerCase() === occ.ownerName.trim().toLowerCase())
      : null;
    setSelectedClientId(matchedClient ? matchedClient.id : '');

    let initialPetNames = existingPets.length > 0 ? [...existingPets] : [''];
    if (appendEmptySlot && existingPets.length > 0) {
      initialPetNames.push('');
    }

    setAssignForm({
      patientNames: initialPetNames,
      ownerName: occ?.ownerName || '',
      reason: occ?.reason || '',
      specialCare: occ?.specialCare || '',
      intakeTime: occ?.intakeTime || new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    const validPets = (assignForm.patientNames || []).map(n => n.trim()).filter(Boolean);
    if (validPets.length === 0 || !selectedCageForAssign) {
      alert('El nombre de al menos una mascota es obligatorio');
      return;
    }

    assignPatientToCage(selectedCageForAssign.id, {
      ...assignForm,
      patientNames: validPets,
      patientName: validPets.join(', ')
    });
    setIsAssignModalOpen(false);
  };

  const handlePatientNameChange = (index, value) => {
    setAssignForm(prev => {
      const updated = [...(prev.patientNames || [''])];
      updated[index] = value;
      return { ...prev, patientNames: updated };
    });
  };

  const addPatientField = () => {
    setAssignForm(prev => ({
      ...prev,
      patientNames: [...(prev.patientNames || ['']), '']
    }));
  };

  const removePatientField = (index) => {
    setAssignForm(prev => {
      if ((prev.patientNames || []).length <= 1) return prev;
      return {
        ...prev,
        patientNames: prev.patientNames.filter((_, i) => i !== index)
      };
    });
  };

  const toggleCompanionPet = (petLabel) => {
    setAssignForm(prev => {
      const current = (prev.patientNames || []).map(p => p.trim()).filter(Boolean);
      const exists = current.includes(petLabel);
      let nextPets;
      if (exists) {
        nextPets = current.filter(p => p !== petLabel);
        if (nextPets.length === 0) nextPets = [''];
      } else {
        nextPets = [...current, petLabel];
      }
      return { ...prev, patientNames: nextPets };
    });
  };

  const removeSinglePetFromOccupiedCage = (cage, petIndexToRemove) => {
    const currentPets = getCagePets(cage.currentOccupant);
    if (currentPets.length <= 1) {
      releaseCage(cage.id, true);
      return;
    }
    const remainingPets = currentPets.filter((_, idx) => idx !== petIndexToRemove);
    assignPatientToCage(cage.id, {
      ...cage.currentOccupant,
      patientNames: remainingPets,
      patientName: remainingPets.join(', ')
    });
  };

  const handleQuickPatientSelect = (val) => {
    if (!val) return;
    let label = '';
    let resolvedOwnerName = '';

    if (val.startsWith('pet-')) {
      const p = pets.find(item => item.id === val);
      if (p) {
        const owner = clients.find(c => c.id === p.clientId);
        label = `${p.name} (${p.breed})`;
        resolvedOwnerName = owner ? owner.name : 'Cliente registrado';
        if (p.clientId) setSelectedClientId(p.clientId);
      }
    } else if (val.startsWith('resc-')) {
      const r = rescues.find(item => item.id === val);
      if (r) {
        label = `${r.code} - ${r.physicalDescription.slice(0, 25)}...`;
        resolvedOwnerName = 'Rescate Callejero';
      }
    }

    if (!label) return;

    setAssignForm(prev => {
      const currentList = [...(prev.patientNames || [''])];
      const alreadyIncluded = currentList.some(item => item.trim().toLowerCase() === label.toLowerCase());
      if (alreadyIncluded) return prev;

      const emptyIndex = currentList.findIndex(item => !item.trim());
      if (emptyIndex !== -1) {
        currentList[emptyIndex] = label;
      } else {
        currentList.push(label);
      }

      return {
        ...prev,
        patientNames: currentList,
        ownerName: prev.ownerName?.trim() ? prev.ownerName : resolvedOwnerName
      };
    });
  };

  const ownerCompanionPets = selectedClientId
    ? pets.filter(p => p.clientId === selectedClientId)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-sm">
            <Home className="w-6 h-6 text-rose-900" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Control de Jaulas & Hospitalización
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
                {totalCages} Jaulas Registradas
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Disponibilidad en tiempo real, asignación de pacientes internados y control de aseo/desinfección.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddCageModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-rose-900 stroke-[3]" />
          Agregar Nueva Jaula
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-card rounded-2xl p-4 border border-slate-200">
          <span className="text-xs font-bold text-slate-500 block">Total de Jaulas</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalCages}</span>
          <span className="text-[11px] text-slate-400">Capacidad clínica instalada</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-emerald-200 bg-emerald-50/20">
          <span className="text-xs font-bold text-emerald-800 block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Disponibles
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{availableCount}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Listas para ingreso</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-purple-200 bg-purple-50/20">
          <span className="text-xs font-bold text-purple-800 block flex items-center gap-1">
            <PawPrint className="w-3.5 h-3.5 text-purple-600" /> Ocupadas
          </span>
          <span className="text-2xl font-black text-purple-800 mt-1 block">{occupiedCount}</span>
          <span className="text-[11px] text-purple-600 font-medium">Pacientes en estancia</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-amber-300 bg-amber-50/30">
          <span className="text-xs font-bold text-amber-900 block flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Requieren Limpieza
          </span>
          <span className="text-2xl font-black text-amber-900 mt-1 block">{needsCleaningCount}</span>
          <span className="text-[11px] text-amber-800 font-medium">Pendientes de aseo</span>
        </div>
      </div>

      {/* Filters (Zone & Status) */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl overflow-x-auto w-full sm:w-auto">
          {['all', 'Disponible', 'Ocupada', 'Necesita Limpieza', 'Mantenimiento'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
                filterStatus === st
                  ? 'bg-white text-slate-900 shadow-xs scale-102'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? `Todas (${cages.length})` : st}
            </button>
          ))}
        </div>

        {/* Zone Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Área:</span>
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none shadow-xs w-full sm:w-auto cursor-pointer"
          >
            <option value="all">Todas las Áreas</option>
            {zones.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCages.map((cage) => {
          const isOccupied = cage.status === 'Ocupada';
          const needsCleaning = cage.status === 'Necesita Limpieza';
          const isAvailable = cage.status === 'Disponible';

          return (
            <div
              key={cage.id}
              className={`glass-card rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                isOccupied
                  ? 'border-purple-300 bg-purple-50/15 shadow-sm'
                  : needsCleaning
                  ? 'border-amber-300 bg-amber-50/25 ring-1 ring-amber-300/40 shadow-sm'
                  : isAvailable
                  ? 'border-emerald-200 bg-emerald-50/10 hover:border-emerald-300'
                  : 'border-slate-200 bg-slate-50/30'
              }`}
            >
              <div>
                {/* Header: Code & Status */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black px-2 py-0.5 rounded-lg bg-slate-900 text-amber-400">
                      {cage.code}
                    </span>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 leading-tight">{cage.name}</h3>
                      <span className="text-[10px] text-slate-400 block">{cage.zone}</span>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={cage.status}
                    onChange={(e) => updateCageStatus(cage.id, e.target.value)}
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md border focus:outline-none cursor-pointer ${
                      isAvailable
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isOccupied
                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                        : needsCleaning
                        ? 'bg-amber-100 text-amber-900 border-amber-400'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Ocupada">Ocupada</option>
                    <option value="Necesita Limpieza">Necesita Limpieza</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                  </select>
                </div>

                {/* Size Badge */}
                <div className="mt-2 text-[10px] font-medium text-slate-500 flex items-center justify-between">
                  <span>Tamaño: <strong>{cage.size}</strong></span>
                  {cage.lastCleaned && (
                    <span className="text-slate-400">Aseo: {cage.lastCleaned}</span>
                  )}
                </div>

                {/* OCCUPIED CONTENT */}
                {isOccupied && cage.currentOccupant && (() => {
                  const cagePets = getCagePets(cage.currentOccupant);
                  const isMultiPet = cagePets.length > 1;
                  return (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-purple-200 shadow-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          {isMultiPet && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
                              🐾 {cagePets.length} mascotas compartiendo jaula
                            </span>
                          )}
                          {isMultiPet ? (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {cagePets.map((petLabel, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-100 text-purple-950 border border-purple-200 text-xs font-extrabold"
                                >
                                  <PawPrint className="w-3 h-3 text-purple-700 shrink-0" />
                                  <span>{petLabel}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeSinglePetFromOccupiedCage(cage, idx)}
                                    title={`Dar de alta únicamente a ${petLabel}`}
                                    aria-label={`Dar de alta únicamente a ${petLabel}`}
                                    className="ml-0.5 text-purple-500 hover:text-rose-700 font-black cursor-pointer"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="font-extrabold text-xs text-purple-950 flex items-center gap-1.5">
                              <PawPrint className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                              <span className="truncate">{cage.currentOccupant.patientName}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded shrink-0">
                          {cage.currentOccupant.intakeTime}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600">
                        <strong>Dueño:</strong> {cage.currentOccupant.ownerName || 'Cliente registrado'}
                      </div>

                      <div className="text-[11px] text-slate-700 bg-purple-50/50 p-1.5 rounded-lg border border-purple-100 leading-snug">
                        <strong>Motivo:</strong> {cage.currentOccupant.reason}
                      </div>

                      {cage.currentOccupant.specialCare && (
                        <div className="text-[10px] text-rose-900 bg-rose-50 p-1.5 rounded-lg border border-rose-200 leading-snug">
                          <strong>Cuidados:</strong> {cage.currentOccupant.specialCare}
                        </div>
                      )}

                      <div className="pt-1 flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => openAssignModal(cage, true)}
                          className="w-full py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-[11px] rounded-lg border border-amber-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-rose-900 stroke-[2.5]" />
                          Agregar 2da Mascota / Editar Jaula
                        </button>
                        <button
                          type="button"
                          onClick={() => releaseCage(cage.id, true)}
                          className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold text-[11px] rounded-lg border border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Dar de Alta y Marcar para Limpieza
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* NEEDS CLEANING CONTENT */}
                {needsCleaning && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Requiere Desinfección
                    </div>
                    {cage.cleaningNotes && (
                      <p className="text-[11px] text-amber-900/90 leading-tight italic">
                        "{cage.cleaningNotes}"
                      </p>
                    )}
                    <button
                      onClick={() => markCageClean(cage.id)}
                      className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <SprayCan className="w-3.5 h-3.5 text-rose-900" />
                      Marcar como Limpia y Lista
                    </button>
                  </div>
                )}

                {/* AVAILABLE CONTENT */}
                {isAvailable && (
                  <div className="mt-4 text-center py-4 bg-emerald-50/40 rounded-xl border border-dashed border-emerald-200 space-y-2">
                    <span className="text-xs font-bold text-emerald-800 block">
                      ✓ Limpia & Sanitizada
                    </span>
                    <button
                      onClick={() => openAssignModal(cage)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ingresar Paciente
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom footer */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono">ID: {cage.id.slice(-6)}</span>
                <button
                  onClick={() => {
                    if (window.confirm(`¿Eliminar ${cage.name} del inventario?`)) {
                      deleteCage(cage.id);
                    }
                  }}
                  className="hover:text-rose-600 transition-colors"
                  title="Eliminar jaula"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: AGREGAR NUEVA JAULA */}
      {/* ========================================================================= */}
      {isAddCageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <Home className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Agregar Nueva Jaula / Canil</h3>
                  <p className="text-xs text-slate-500">Expansión de capacidad hospitalaria</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddCageModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCage} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código Identificador *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. J-09 o CAN-01"
                    value={cageForm.code}
                    onChange={(e) => setCageForm(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Descriptivo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Jaula Grande 09"
                    value={cageForm.name}
                    onChange={(e) => setCageForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tamaño / Capacidad</label>
                <select
                  value={cageForm.size}
                  onChange={(e) => setCageForm(prev => ({ ...prev, size: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="Chica (Gatos / Perros pequeños <8kg)">Chica (Gatos / Perros pequeños &lt;8kg)</option>
                  <option value="Mediana (Perros 10-25kg)">Mediana (Perros 10-25kg)</option>
                  <option value="Grande (Perros >25kg)">Grande (Perros &gt;25kg)</option>
                  <option value="Extragrande / Gigante">Extragrande / Gigante</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Área / Zona Clínica</label>
                <select
                  value={cageForm.zone}
                  onChange={(e) => setCageForm(prev => ({ ...prev, zone: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="Hospitalización General">Hospitalización General</option>
                  <option value="Recuperación Quirófano">Recuperación Quirófano</option>
                  <option value="Área de Rescates">Área de Rescates</option>
                  <option value="Hospitalización Felina">Hospitalización Felina</option>
                  <option value="Aislamiento Infeccioso">Aislamiento Infeccioso</option>
                  <option value="Guardería / Estancia">Guardería / Estancia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estado Inicial</label>
                <select
                  value={cageForm.status}
                  onChange={(e) => setCageForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="Disponible">Disponible (Limpia y desinfectada)</option>
                  <option value="Necesita Limpieza">Necesita Limpieza</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCageModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  Registrar Jaula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INGRESAR PACIENTE A JAULA */}
      {/* ========================================================================= */}
      {isAssignModalOpen && selectedCageForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <PawPrint className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Ingresar Paciente a {selectedCageForAssign.code}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedCageForAssign.name} &bull; {selectedCageForAssign.zone}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3.5">
              {/* Quick Select from pets/rescues */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargar desde Pacientes Registrados (Puedes elegir 1 o 2 mascotas)
                </label>
                <select
                  onChange={(e) => {
                    handleQuickPatientSelect(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="">-- Seleccionar Mascota o Rescate para agregar a la jaula --</option>
                  <optgroup label="Mascotas con Dueño">
                    {pets.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.species} - {p.breed})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Rescates Callejeros">
                    {rescues.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.physicalDescription.slice(0, 35)}...
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Mascotas en esta Jaula (Soporta 2 o más mascotas en la misma jaula) */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <PawPrint className="w-4 h-4 text-rose-900" />
                    Mascotas en esta Jaula *
                  </label>
                  <button
                    type="button"
                    onClick={addPatientField}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    Agregar 2da mascota
                  </button>
                </div>

                {/* Si el dueño tiene más mascotas registradas, mostrar selección rápida con 1 clic */}
                {ownerCompanionPets.length > 1 && (
                  <div className="pb-1">
                    <div className="text-[11px] font-semibold text-slate-600 mb-1">
                      Mascotas registradas de este dueño (clic para compartir jaula):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ownerCompanionPets.map(pet => {
                        const label = `${pet.name} (${pet.breed})`;
                        const isSelected = (assignForm.patientNames || []).some(
                          p => p.trim().toLowerCase() === label.toLowerCase() || p.trim().toLowerCase() === pet.name.trim().toLowerCase()
                        );
                        return (
                          <button
                            key={pet.id}
                            type="button"
                            onClick={() => toggleCompanionPet(label)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
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
                  {(assignForm.patientNames || ['']).map((petName, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white border border-amber-300 text-amber-950 text-xs font-bold inline-flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        required={index === 0}
                        placeholder={
                          index === 0
                            ? 'Ej. Barry (Canino) o Mascota #1'
                            : `Nombre de la mascota #${index + 1} (Ej. Bella)`
                        }
                        value={petName}
                        onChange={(e) => handlePatientNameChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold"
                      />
                      {(assignForm.patientNames || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePatientField(index)}
                          title="Quitar esta mascota de la jaula"
                          aria-label={`Quitar mascota ${index + 1}`}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Usa <strong>+ Agregar 2da mascota</strong> o selecciona otra mascota de la lista si 2 pacientes compartirán esta jaula.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dueño / Rescatista</label>
                <input
                  type="text"
                  placeholder="Ej. Letty Morales o Víctor Aquino"
                  value={assignForm.ownerName}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, ownerName: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo de Internamiento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Recuperación post-operatoria, suero por parvovirus, observación..."
                  value={assignForm.reason}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instrucciones Clínicas & Cuidados Especiales
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Solución Hartmann a 20ml/hr, revisar temperatura a las 16:00, dieta blanda..."
                  value={assignForm.specialCare}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, specialCare: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  Confirmar Ingreso a Jaula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
