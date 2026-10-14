import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Activity, 
  Plus, 
  Clock, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Stethoscope, 
  Scissors, 
  ShieldAlert,
  XCircle,
  Eye
} from 'lucide-react';

export function Surgeries() {
  const { surgeries, addSurgery, updateSurgeryStatus, pets, rescues } = useApp();

  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // New Surgery Form State
  const [form, setForm] = useState({
    patientName: '',
    patientType: 'Mascota con dueño',
    ownerName: '',
    procedure: 'Ovariohisterectomía (Esterilización)',
    surgeon: 'Dr. Mario Estrada',
    anesthetist: 'Dra. Sofía Rincón',
    date: new Date().toISOString().split('T')[0],
    anesthesiaType: 'Inhalatoria (Isoflurano) + Premedicación',
    preOpNotes: 'Ayuno de 10 horas confirmado. Hemograma básico en rangos normales.',
    intraOpNotes: '',
    postOpNotes: 'Collar isabelino obligatorio por 10 días. Reposo absoluto.',
    status: 'Programada'
  });

  const filteredSurgeries = surgeries.filter(s => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  const handleCreateSurgery = (e) => {
    e.preventDefault();
    if (!form.patientName || !form.procedure) {
      alert('Paciente y procedimiento son obligatorios');
      return;
    }

    addSurgery(form);
    setIsModalOpen(false);
    setForm({
      patientName: '',
      patientType: 'Mascota con dueño',
      ownerName: '',
      procedure: 'Ovariohisterectomía (Esterilización)',
      surgeon: 'Dr. Mario Estrada',
      anesthetist: 'Dra. Sofía Rincón',
      date: new Date().toISOString().split('T')[0],
      anesthesiaType: 'Inhalatoria (Isoflurano) + Premedicación',
      preOpNotes: 'Ayuno de 10 horas confirmado. Hemograma básico en rangos normales.',
      intraOpNotes: '',
      postOpNotes: 'Collar isabelino obligatorio por 10 días. Reposo absoluto.',
      status: 'Programada'
    });
  };

  const handleQuickSelectPatient = (val) => {
    if (val.startsWith('pet-')) {
      const pet = pets.find(p => p.id === val);
      if (pet) {
        setForm(prev => ({
          ...prev,
          patientName: `${pet.name} (${pet.breed})`,
          patientType: 'Mascota con dueño',
          ownerName: 'Cliente registrado'
        }));
      }
    } else if (val.startsWith('resc-')) {
      const rescue = rescues.find(r => r.id === val);
      if (rescue) {
        setForm(prev => ({
          ...prev,
          patientName: `${rescue.code} - ${rescue.physicalDescription.slice(0, 30)}...`,
          patientType: 'Rescate Callejero',
          ownerName: 'Refugio / En Adopción'
        }));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-sm">
            <Activity className="w-6 h-6 text-rose-900" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Registro & Bitácora de Cirugías
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200">
                {surgeries.length} intervenciones en quirófano
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Protocolos anestésicos, cirujanos responsables, notas trans-operatorias y cuidados post-quirúrgicos.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-rose-900 stroke-[3]" />
          Nueva Cirugía
        </button>
      </div>

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
            {st === 'all' ? `Todas las Cirugías (${surgeries.length})` : st}
          </button>
        ))}
      </div>

      {/* Surgeries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSurgeries.map((surgery) => (
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
                  value={surgery.status}
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

              {/* Procedure Name */}
              <div className="mt-3">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-amber-600" />
                  {surgery.procedure}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
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

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-mono">
                ID: {surgery.id.slice(-6)}
              </span>
              <button
                onClick={() => setSelectedSurgery(surgery)}
                className="font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                Ver Hoja Quirúrgica
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Detalle de Hoja Quirúrgica */}
      {selectedSurgery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-slideUp space-y-4">
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
                  <span className="font-extrabold text-slate-900 text-sm">{selectedSurgery.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Propietario / Rescate:</span>
                  <span className="font-bold text-slate-800">{selectedSurgery.ownerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Cirujano Principal:</span>
                  <span className="font-bold text-slate-800">{selectedSurgery.surgeon}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Anestesiólogo:</span>
                  <span className="font-bold text-slate-800">{selectedSurgery.anesthetist}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Procedimiento:</span>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 font-extrabold text-rose-950">
                  {selectedSurgery.procedure}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Protocolo Anestésico:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {selectedSurgery.anesthesiaType}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Evaluación Pre-Operatoria:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {selectedSurgery.preOpNotes}
                </p>
              </div>

              {selectedSurgery.intraOpNotes && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Notas Trans-Operatorias:</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {selectedSurgery.intraOpNotes}
                  </p>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-800 block mb-1">Indicaciones Post-Operatorias & Medicación:</span>
                <p className="text-rose-950 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {selectedSurgery.postOpNotes}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setSelectedSurgery(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cerrar Hoja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nueva Cirugía */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <Scissors className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Programar Nueva Cirugía</h3>
                  <p className="text-xs text-slate-500">Control de quirófano y protocolo anestésico</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSurgery} className="space-y-3.5">
              {/* Quick Pick from registered pets or rescues */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargar Paciente desde Base de Datos (Opcional)
                </label>
                <select
                  onChange={(e) => handleQuickSelectPatient(e.target.value)}
                  defaultValue=""
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
                    placeholder="Ej. Canela o Rescate #104"
                    value={form.patientName}
                    onChange={(e) => setForm(prev => ({ ...prev, patientName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dueño / Rescatista</label>
                  <input
                    type="text"
                    placeholder="Ej. Carmen Villalobos"
                    value={form.ownerName}
                    onChange={(e) => setForm(prev => ({ ...prev, ownerName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Procedimiento Quirúrgico *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ovariohisterectomía, Orquiectomía, Limpieza Dental Ultrasónica..."
                  value={form.procedure}
                  onChange={(e) => setForm(prev => ({ ...prev, procedure: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cirujano Responsable</label>
                  <select
                    value={form.surgeon}
                    onChange={(e) => setForm(prev => ({ ...prev, surgeon: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="Dr. Mario Estrada">Dr. Mario Estrada (Céd. Prof. 8492019-BC)</option>
                    <option value="Dra. Sofía Rincón">Dra. Sofía Rincón (Céd. Prof. 9102831-BC)</option>
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
                  Registrar Cirugía
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
