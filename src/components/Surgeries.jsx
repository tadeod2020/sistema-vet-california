import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getLocalDateString, shiftLocalDateString } from '../lib/dateUtils.js';
import { SurgeryReportModal } from './SurgeryReportModal';
import { 
  Activity, 
  Plus, 
  Calendar, 
  User, 
  CheckCircle2, 
  Scissors, 
  XCircle,
  Eye,
  Pencil,
  Trash2,
  Syringe,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Printer,
  CalendarDays,
  ListFilter
} from 'lucide-react';

const COMPLEMENTARY_PROCEDURES = [
  { label: 'Defensor 1 (Vacuna contra la Rabia)', category: 'vacuna' },
  { label: 'Vanguard Plus 5 (Distemper, Adenovirus 2, Parainfluenza, Parvovirus)', category: 'vacuna' },
  { label: 'Vanguard Plus 5/CV-L (DAPPi + Coronavirus + Leptospira)', category: 'vacuna' },
  { label: 'Vanguard Plus 5 L4 CV (DAPPi + Coronavirus + Leptospira L4)', category: 'vacuna' },
  { label: 'Bronchicine CAe (Bordetella / Traqueobronquitis Infecciosa Canina)', category: 'vacuna' },
  { label: 'PUREVAX Feline 4 (Rinotraqueítis, Calicivirosis, Panleucopenia y Clamidiasis)', category: 'vacuna' },
  { label: 'Nobivac Feline 1-HCP + FeLV (Triple Felina + Leucemia)', category: 'vacuna' },
  { label: 'Desparasitación Interna (Endovet)', category: 'preventivo' },
  { label: 'Desparasitación Externa (Bravecto / Pipeta)', category: 'preventivo' },
  { label: 'Implantación de Microchip ISO', category: 'procedimiento' },
  { label: 'Profilaxis / Limpieza Dental', category: 'procedimiento' },
  { label: 'Extracción de Pieza Dental', category: 'procedimiento' },
  { label: 'Corte de Uñas y Limpieza de Oídos', category: 'procedimiento' },
  { label: 'Limpieza de Glándulas Anales', category: 'procedimiento' },
  { label: 'Hemograma / Química Pre-Operatoria', category: 'procedimiento' }
];

const STANDARD_SURGERIES = [
  'Ovariohisterectomía (Esterilización Hembra)',
  'Orquiectomía (Castración Macho)',
  'Profilaxis & Limpieza Dental Ultrasónica',
  'Extracción de Pieza Dental',
  'Sutura y Cierre de Herida Traumatológica',
  'Cesárea de Emergencia',
  'Extirpación de Neoplasia / Tumor Cutáneo',
  'Drenaje y Desbridamiento de Absceso',
  'Cirugía Ocular (Entropión / Ojo de Cereza)',
  'Laparotomía Exploratoria / Cuerpo Extraño'
];

export function Surgeries() {
  const {
    surgeries,
    addSurgery,
    updateSurgery,
    updateSurgeryStatus,
    deleteSurgery,
    pets,
    clients,
    rescues
  } = useApp();

  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSurgeryId, setEditingSurgeryId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCustomProcedure, setIsCustomProcedure] = useState(false);
  const [customExtraInput, setCustomExtraInput] = useState('');

  // Daily View Mode like Agenda & PDF Print
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'all'
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [printSurgery, setPrintSurgery] = useState(null);

  const shiftDate = (days) => {
    setSelectedDate(prev => shiftLocalDateString(prev, days));
  };

  const defaultForm = {
    petId: '',
    clientId: '',
    patientName: '',
    patientType: 'Mascota con dueño',
    ownerName: '',
    procedure: 'Ovariohisterectomía (Esterilización Hembra)',
    additionalProcedures: [],
    autoRegisterVaccines: true,
    surgeon: 'Dra. María José Mendoza Gutiérrez',
    anesthetist: 'Especialista en Anestesiología',
    date: selectedDate || getLocalDateString(),
    anesthesiaType: 'Inhalatoria (Isoflurano) + Premedicación',
    preOpNotes: 'Ayuno de 10 horas confirmado. Hemograma básico en rangos normales.',
    intraOpNotes: '',
    postOpNotes: 'Collar isabelino obligatorio por 10 días. Reposo absoluto.',
    status: 'Programada'
  };

  const [form, setForm] = useState(defaultForm);

  const daySurgeries = surgeries.filter(s => s.date === selectedDate);
  const displayedSurgeries = viewMode === 'day' ? daySurgeries : surgeries;

  const filteredSurgeries = displayedSurgeries.filter(s => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  // Daily statistics for selected day
  const dayScheduledCount = daySurgeries.filter(s => s.status === 'Programada').length;
  const dayInSurgeryCount = daySurgeries.filter(s => s.status === 'En Quirófano').length;
  const dayRecoveryCount = daySurgeries.filter(s => s.status === 'En Recuperación').length;
  const dayDischargedCount = daySurgeries.filter(s => s.status === 'Alta Médica').length;

  const openNewSurgeryModal = () => {
    setEditingSurgeryId(null);
    setIsCustomProcedure(false);
    setCustomExtraInput('');
    setForm({
      ...defaultForm,
      date: selectedDate || getLocalDateString()
    });
    setIsModalOpen(true);
  };

  const openEditSurgeryModal = (surgery) => {
    const isStandard = STANDARD_SURGERIES.includes(surgery.procedure);
    setEditingSurgeryId(surgery.id);
    setIsCustomProcedure(!isStandard && Boolean(surgery.procedure));
    setCustomExtraInput('');
    setForm({
      petId: surgery.petId || '',
      clientId: surgery.clientId || '',
      patientName: surgery.patientName || '',
      patientType: surgery.patientType || 'Mascota con dueño',
      ownerName: surgery.ownerName || '',
      procedure: surgery.procedure || STANDARD_SURGERIES[0],
      additionalProcedures: Array.isArray(surgery.additionalProcedures) ? [...surgery.additionalProcedures] : [],
      autoRegisterVaccines: true,
      surgeon: surgery.surgeon || 'Dra. María José Mendoza Gutiérrez',
      anesthetist: surgery.anesthetist || 'Especialista en Anestesiología',
      date: surgery.date || getLocalDateString(),
      anesthesiaType: surgery.anesthesiaType || 'Inhalatoria (Isoflurano) + Premedicación',
      preOpNotes: surgery.preOpNotes || '',
      intraOpNotes: surgery.intraOpNotes || '',
      postOpNotes: surgery.postOpNotes || '',
      status: surgery.status || 'Programada'
    });
    setSelectedSurgery(null);
    setIsModalOpen(true);
  };

  const toggleAdditionalProcedure = (procLabel) => {
    setForm(prev => {
      const current = prev.additionalProcedures || [];
      const exists = current.includes(procLabel);
      return {
        ...prev,
        additionalProcedures: exists
          ? current.filter(item => item !== procLabel)
          : [...current, procLabel]
      };
    });
  };

  const handleAddCustomExtraProcedure = () => {
    const trimmed = customExtraInput.trim();
    if (!trimmed) return;
    setForm(prev => {
      const current = prev.additionalProcedures || [];
      if (current.includes(trimmed)) return prev;
      return {
        ...prev,
        additionalProcedures: [...current, trimmed]
      };
    });
    setCustomExtraInput('');
  };

  const handleSaveSurgery = (e) => {
    e.preventDefault();
    if (!form.patientName.trim() || !form.procedure.trim()) {
      alert('Paciente y procedimiento principal son obligatorios');
      return;
    }

    // If user typed a custom extra procedure and didn't click "+ Agregar", include it automatically
    const finalExtras = [...(form.additionalProcedures || [])];
    if (customExtraInput.trim() && !finalExtras.includes(customExtraInput.trim())) {
      finalExtras.push(customExtraInput.trim());
    }

    const payload = {
      ...form,
      patientName: form.patientName.trim(),
      procedure: form.procedure.trim(),
      additionalProcedures: finalExtras
    };

    if (editingSurgeryId) {
      updateSurgery(editingSurgeryId, payload);
    } else {
      addSurgery(payload);
    }

    setIsModalOpen(false);
    setEditingSurgeryId(null);
    setIsCustomProcedure(false);
    setCustomExtraInput('');
    setForm(defaultForm);
  };

  const handleQuickSelectPatient = (val) => {
    if (val.startsWith('pet-')) {
      const pet = pets.find(p => p.id === val);
      if (pet) {
        const owner = clients.find(c => c.id === pet.clientId);
        setForm(prev => ({
          ...prev,
          petId: pet.id,
          clientId: pet.clientId || '',
          patientName: `${pet.name} (${pet.breed})`,
          patientType: 'Mascota con dueño',
          ownerName: owner ? owner.name : 'Cliente registrado'
        }));
      }
    } else if (val.startsWith('resc-')) {
      const rescue = rescues.find(r => r.id === val);
      if (rescue) {
        setForm(prev => ({
          ...prev,
          petId: '',
          clientId: '',
          patientName: `${rescue.code} - ${rescue.physicalDescription.slice(0, 30)}...`,
          patientType: 'Rescate Callejero',
          ownerName: rescue.rescuerName || 'Refugio / En Adopción'
        }));
      }
    }
  };

  // Keep selectedSurgery in sync with state updates
  const activeSelectedSurgery = selectedSurgery
    ? (surgeries.find(s => s.id === selectedSurgery.id) || selectedSurgery)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner & View Switcher */}
      <div className="glass-card rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-sm">
            <Activity className="w-6 h-6 text-rose-900" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex flex-wrap items-center gap-2">
              Registro & Bitácora de Cirugías
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200">
                {surgeries.length} intervenciones registradas
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Protocolos anestésicos, cirugías del día y procedimientos complementarios (vacunas, desparasitación, microchip, etc.).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* View Mode Toggle: Day vs All */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                viewMode === 'day'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-rose-900" />
              Vista por Día
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                viewMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-amber-600" />
              Todas ({surgeries.length})
            </button>
          </div>

          <button
            onClick={openNewSurgeryModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-rose-900 stroke-[3]" />
            Nueva Cirugía
          </button>
        </div>
      </div>

      {/* Date Navigation & Daily Stats (When in Day View Mode) */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                Jornada Quirúrgica:
              </span>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => shiftDate(-1)} 
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95 cursor-pointer"
                  title="Día anterior"
                  aria-label="Día anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <input 
                  type="date" 
                  aria-label="Seleccionar fecha de cirugías"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
                />

                <button 
                  onClick={() => shiftDate(1)} 
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95 cursor-pointer"
                  title="Día siguiente"
                  aria-label="Día siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDate(getLocalDateString())}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  selectedDate === getLocalDateString()
                    ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-2xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Hoy
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Mostrando cirugías programadas para: <strong className="text-slate-800">{selectedDate}</strong>
            </div>
          </div>

          {/* Daily Quick Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card rounded-2xl p-3.5 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cirugías del Día</div>
              <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1.5">
                {daySurgeries.length}
                <span className="text-[11px] font-semibold text-slate-400">pacientes</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3.5 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Programadas</div>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {dayScheduledCount}
              </div>
            </div>

            <div className={`glass-card rounded-2xl p-3.5 border transition-colors ${
              dayInSurgeryCount > 0 ? 'border-rose-300 bg-rose-50/60' : 'border-slate-200'
            }`}>
              <div className="text-[11px] font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                {dayInSurgeryCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />}
                En Quirófano
              </div>
              <div className="text-2xl font-black text-rose-950 mt-1">
                {dayInSurgeryCount}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3.5 border border-slate-200">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Recuperación / Altas</div>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                {dayRecoveryCount + dayDischargedCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'Programada', 'En Quirófano', 'En Recuperación', 'Alta Médica'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filterStatus === st 
                ? 'bg-slate-900 text-amber-400 font-bold shadow-xs' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st === 'all' 
              ? (viewMode === 'day' ? `Todas del Día (${daySurgeries.length})` : `Histórico Completo (${surgeries.length})`) 
              : st}
          </button>
        ))}
      </div>

      {/* Surgeries Grid */}
      {filteredSurgeries.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/70 border border-dashed border-slate-300 rounded-3xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
            <Scissors className="w-7 h-7 text-rose-900" />
          </div>
          <div className="font-extrabold text-base text-slate-800">
            {viewMode === 'day' 
              ? `No hay cirugías registradas para el día ${selectedDate}` 
              : 'No hay cirugías registradas en este filtro'}
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {viewMode === 'day'
              ? 'El quirófano se encuentra programado libre para esta fecha. Puedes agendar una intervención quirúrgica con sus protocolos haciendo clic en el botón inferior.'
              : 'Haz clic en "+ Nueva Cirugía" para programar una intervención quirúrgica y procedimientos adicionales.'}
          </p>
          <button
            onClick={openNewSurgeryModal}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {viewMode === 'day' ? `+ Programar Cirugía para ${selectedDate}` : '+ Programar Cirugía'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSurgeries.map((surgery) => {
            const extraProcs = Array.isArray(surgery.additionalProcedures) ? surgery.additionalProcedures : [];

            return (
              <div
                key={surgery.id}
                className="glass-card rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                        {surgery.patientType}
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900 mt-1.5 flex items-center gap-1.5">
                        {surgery.patientName}
                      </h3>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" /> {surgery.ownerName}
                      </div>
                    </div>

                    <select
                      value={surgery.status || 'Programada'}
                      onChange={(e) => updateSurgeryStatus(surgery.id, e.target.value)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border focus:outline-none cursor-pointer ${
                        surgery.status === 'Alta Médica'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : surgery.status === 'En Quirófano'
                          ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                          : surgery.status === 'En Recuperación'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      <option value="Programada">Programada</option>
                      <option value="En Quirófano">En Quirófano</option>
                      <option value="En Recuperación">En Recuperación</option>
                      <option value="Alta Médica">Alta Médica</option>
                    </select>
                  </div>

                  {/* Procedure Name & Additional Procedures */}
                  <div className="mt-3">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{surgery.procedure}</span>
                    </div>

                    {extraProcs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                          + Procedimientos Adicionales ({extraProcs.length}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {extraProcs.map((proc, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-950 border border-amber-300"
                            >
                              <Syringe className="w-2.5 h-2.5 text-rose-900 shrink-0" />
                              {proc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-slate-400" /> {surgery.date}
                      <span>&bull;</span>
                      <span>{surgery.surgeon}</span>
                    </div>
                  </div>

                  {/* Anesthesia callout */}
                  <div className="mt-3 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <div>
                      <strong className="text-slate-700">Anestesia:</strong> {surgery.anesthesiaType}
                    </div>
                    {surgery.postOpNotes && (
                      <div className="text-rose-900 font-medium pt-1 border-t border-slate-200/60">
                        <strong>Post-Op:</strong> {surgery.postOpNotes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditSurgeryModal(surgery)}
                      className="px-2.5 py-1 font-bold text-xs text-slate-700 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Editar cirugía o agregar más procedimientos / vacunas"
                    >
                      <Pencil className="w-3 h-3 text-rose-900" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintSurgery(surgery)}
                      className="px-2.5 py-1 font-bold text-xs text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Imprimir u obtener Reporte Quirúrgico en PDF"
                    >
                      <Printer className="w-3 h-3 text-rose-900" />
                      PDF
                    </button>
                    {deleteSurgery && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar el registro quirúrgico de ${surgery.patientName}?`)) {
                            deleteSurgery(surgery.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar cirugía"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedSurgery(surgery)}
                    className="font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    Ver Hoja
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Detalle de Hoja Quirúrgica */}
      {activeSelectedSurgery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-slideUp space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <Scissors className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Hoja de Protocolo Quirúrgico</h3>
                  <p className="text-xs text-slate-500">Servicio Veterinario California &bull; Quirófano</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSurgery(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Paciente:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{activeSelectedSurgery.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Propietario / Rescate:</span>
                  <span className="font-bold text-slate-800">{activeSelectedSurgery.ownerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Cirujano Principal:</span>
                  <span className="font-bold text-slate-800">{activeSelectedSurgery.surgeon}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Anestesiólogo:</span>
                  <span className="font-bold text-slate-800">{activeSelectedSurgery.anesthetist}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Procedimiento Quirúrgico Principal:</span>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 font-extrabold text-rose-950">
                  {activeSelectedSurgery.procedure}
                </div>
              </div>

              {Array.isArray(activeSelectedSurgery.additionalProcedures) && activeSelectedSurgery.additionalProcedures.length > 0 && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1">
                    Procedimientos Adicionales / Vacunas Aplicadas ({activeSelectedSurgery.additionalProcedures.length}):
                  </span>
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-wrap gap-1.5">
                    {activeSelectedSurgery.additionalProcedures.map((proc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-white text-emerald-950 border border-emerald-300 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {proc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-800 block mb-1">Protocolo Anestésico:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {activeSelectedSurgery.anesthesiaType}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Evaluación Pre-Operatoria:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {activeSelectedSurgery.preOpNotes}
                </p>
              </div>

              {activeSelectedSurgery.intraOpNotes && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Notas Trans-Operatorias:</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {activeSelectedSurgery.intraOpNotes}
                  </p>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-800 block mb-1">Indicaciones Post-Operatorias & Medicación:</span>
                <p className="text-rose-950 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {activeSelectedSurgery.postOpNotes}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintSurgery(activeSelectedSurgery)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-rose-900" />
                  Imprimir Reporte (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => openEditSurgeryModal(activeSelectedSurgery)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-rose-900" />
                  Agregar Procedimientos / Editar
                </button>
              </div>

              <button
                onClick={() => setSelectedSurgery(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cerrar Hoja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nueva Cirugía o Editar Cirugía */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-slideUp max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  {editingSurgeryId ? (
                    <Pencil className="w-5 h-5 text-rose-900" />
                  ) : (
                    <Scissors className="w-5 h-5 text-rose-900" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingSurgeryId ? 'Editar Cirugía y Procedimientos' : 'Programar Nueva Cirugía'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Control de quirófano, protocolo anestésico y procedimientos adicionales (vacunas, desparasitación, etc.)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSurgery} className="space-y-4">
              {/* Quick Pick from registered pets or rescues */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargar Paciente desde Base de Datos (Opcional)
                </label>
                <select
                  onChange={(e) => handleQuickSelectPatient(e.target.value)}
                  value={form.petId || ''}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="">-- Seleccionar Mascota o Rescate --</option>
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
                        {r.code} ({r.physicalDescription.slice(0, 35)}...)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Paciente *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Max o Rescate #104"
                    value={form.patientName}
                    onChange={(e) => setForm(prev => ({ ...prev, patientName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dueño / Rescatista</label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={form.ownerName}
                    onChange={(e) => setForm(prev => ({ ...prev, ownerName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Procedimiento Quirúrgico Principal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Procedimiento Quirúrgico Principal *</label>
                <div className="space-y-2">
                  <select
                    value={isCustomProcedure ? 'OTRO' : (form.procedure || STANDARD_SURGERIES[0])}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'OTRO') {
                        setIsCustomProcedure(true);
                        setForm(prev => ({ ...prev, procedure: '' }));
                      } else {
                        setIsCustomProcedure(false);
                        setForm(prev => ({ ...prev, procedure: val }));
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-semibold text-slate-900"
                  >
                    <optgroup label="Procedimientos Frecuentes">
                      {STANDARD_SURGERIES.map(proc => (
                        <option key={proc} value={proc}>{proc}</option>
                      ))}
                    </optgroup>
                    <option value="OTRO">➕ Otro Tipo de Cirugía (Personalizada)...</option>
                  </select>

                  {isCustomProcedure && (
                    <div className="animate-slideDown">
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Escribe el nombre o tipo de cirugía personalizada..."
                        value={form.procedure}
                        onChange={(e) => setForm(prev => ({ ...prev, procedure: e.target.value }))}
                        className="w-full px-3 py-2 text-xs bg-amber-50/70 border-2 border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold text-slate-900"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* NUEVO: PROCEDIMIENTOS ADICIONALES (VACUNAS, DESPARASITACIÓN, ESTÉTICA CLÍNICA, OTROS) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Syringe className="w-4 h-4 text-rose-900" />
                    Procedimientos Adicionales (Vacunas, Desparasitación, Otros)
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950">
                    {(form.additionalProcedures || []).length} seleccionados
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Selecciona vacunas o procedimientos extra que se le realizarán aprovechando la intervención o escribe cualquiera personalizado:
                </p>

                {/* Quick toggle chips */}
                <div className="flex flex-wrap gap-1.5">
                  {COMPLEMENTARY_PROCEDURES.map(item => {
                    const isSelected = (form.additionalProcedures || []).includes(item.label);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => toggleAdditionalProcedure(item.label)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-amber-400 hover:bg-amber-50'
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3 text-amber-400 stroke-[3]" /> : <Plus className="w-3 h-3 text-slate-400" />}
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom additional procedure input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Escribir otro procedimiento o vacuna (ej. Vacuna Giardia, Curación de oreja, Retiro de quiste...)"
                    value={customExtraInput}
                    onChange={(e) => setCustomExtraInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomExtraProcedure();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomExtraProcedure}
                    className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-2xs shrink-0 transition-all active:scale-95"
                  >
                    + Agregar
                  </button>
                </div>

                {/* Selected procedures summary list */}
                {(form.additionalProcedures || []).length > 0 && (
                  <div className="pt-2 border-t border-amber-200/80 space-y-2">
                    <div className="text-[11px] font-bold text-slate-800">
                      Procedimientos extra incluidos en esta cirugía:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {form.additionalProcedures.map((proc, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-bold"
                        >
                          <span>{proc}</span>
                          <button
                            type="button"
                            onClick={() => toggleAdditionalProcedure(proc)}
                            className="text-emerald-700 hover:text-rose-700 font-black"
                            title="Quitar procedimiento"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {!editingSurgeryId && (
                      <label className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.autoRegisterVaccines}
                          onChange={(e) => setForm(prev => ({ ...prev, autoRegisterVaccines: e.target.checked }))}
                          className="rounded text-amber-500 focus:ring-amber-400"
                        />
                        <span>Si incluye vacunas, registrarlas también automáticamente en la Cartilla Oficial de la mascota</span>
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div className={`grid ${editingSurgeryId ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'} gap-3`}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cirujano Responsable</label>
                  <select
                    value={form.surgeon}
                    onChange={(e) => setForm(prev => ({ ...prev, surgeon: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="Dra. María José Mendoza Gutiérrez">Dra. María José Mendoza Gutiérrez</option>
                    <option value="Dr. Miguel Ángel Michel Rea">Dr. Miguel Ángel Michel Rea</option>
                    <option value="Dr. José Rubén Estrada Hernández">Dr. José Rubén Estrada Hernández</option>
                    <option value="Dr. César Wilfredo Solórzano Hernández">Dr. César Wilfredo Solórzano Hernández</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Programada</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                {editingSurgeryId && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Estado Quirúrgico</label>
                    <select
                      value={form.status || 'Programada'}
                      onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="Programada">Programada</option>
                      <option value="En Quirófano">En Quirófano</option>
                      <option value="En Recuperación">En Recuperación</option>
                      <option value="Alta Médica">Alta Médica</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Protocolo Anestésico</label>
                <input
                  type="text"
                  placeholder="Ej. Inhalatoria (Isoflurano) + Tramadol / Xilacina"
                  value={form.anesthesiaType}
                  onChange={(e) => setForm(prev => ({ ...prev, anesthesiaType: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Evaluación Pre-Op / Ayuno</label>
                <textarea
                  rows={2}
                  placeholder="Detalles de análisis sanguíneos, ayuno confirmado..."
                  value={form.preOpNotes}
                  onChange={(e) => setForm(prev => ({ ...prev, preOpNotes: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cuidados Post-Op & Medicación</label>
                <textarea
                  rows={2}
                  placeholder="Instrucciones para el dueño, retiro de puntos, collar isabelino..."
                  value={form.postOpNotes}
                  onChange={(e) => setForm(prev => ({ ...prev, postOpNotes: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  {editingSurgeryId ? 'Guardar Cambios' : 'Registrar Cirugía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Official Printable Surgery Report Modal */}
      {printSurgery && (
        <SurgeryReportModal
          surgery={printSurgery}
          onClose={() => setPrintSurgery(null)}
        />
      )}
    </div>
  );
}
