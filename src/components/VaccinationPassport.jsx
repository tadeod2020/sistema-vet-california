import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  Plus, 
  Printer, 
  ShieldCheck, 
  Award, 
  Syringe, 
  Calendar, 
  User, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  QrCode,
  Plane,
  XCircle
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function VaccinationPassport() {
  const { pets, clients, vaccinations, addVaccination } = useApp();

  const [selectedPetId, setSelectedPetId] = useState(() => pets.length > 0 ? pets[0].id : null);
  const [isVacModalOpen, setIsVacModalOpen] = useState(false);

  // New Vaccine Form State
  const [vacForm, setVacForm] = useState({
    vaccineName: 'Vacuna Antirrábica (Rabies)',
    manufacturer: 'Nobivac Rabies (MSD)',
    lotNumber: 'RAB-2026-TJ',
    appliedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    vetName: 'Dr. Mario Estrada',
    licenseNumber: 'CÉD. PROF. 8492019-BC',
    notes: 'Aprobado para cruce fronterizo EE.UU. / California CBP'
  });

  const selectedPet = pets.find(p => p.id === selectedPetId) || pets[0] || null;
  const petOwner = selectedPet ? clients.find(c => c.id === selectedPet.clientId) : null;
  const petVaccines = vaccinations.filter(v => v.petId === selectedPet?.id);

  const handlePrint = () => {
    window.print();
  };

  const handleCreateVaccine = (e) => {
    e.preventDefault();
    if (!selectedPet) return;

    addVaccination({
      ...vacForm,
      petId: selectedPet.id,
      petName: selectedPet.name,
      ownerName: petOwner ? petOwner.name : 'Cliente Registrado',
      isTravelValid: true
    });

    setIsVacModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (hidden in print) */}
      <div className="glass-card rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-sm">
            <Plane className="w-6 h-6 text-rose-900" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Cartilla de Vacunación & Passport to Travel
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
                Certificado Oficial Bilingüe (Tijuana - California)
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Emisión de pasaportes de viaje y certificados con aval para cruce internacional (CBP / CDC).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsVacModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-rose-900 stroke-[3]" />
            Registrar Vacuna
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            Imprimir Carnet Físico
          </button>
        </div>
      </div>

      {/* Pet Selector (hidden in print) */}
      <div className="glass-card rounded-2xl p-3 flex items-center gap-3 no-print overflow-x-auto">
        <span className="text-xs font-bold text-slate-500 shrink-0">Seleccionar Mascota:</span>
        <div className="flex items-center gap-2">
          {pets.map(p => {
            const isSelected = selectedPet?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPetId(p.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
                  isSelected 
                    ? 'bg-amber-400 text-amber-950 shadow-xs scale-105' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.name} ({p.species} - {p.breed})
              </button>
            );
          })}
        </div>
      </div>

      {/* Official Yellow Passport View (Faithful reproduction of physical carnet) */}
      {selectedPet ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Printable Yellow Physical Booklet Card */}
          <div className="lg:col-span-8 space-y-4">
            <div className="passport-print-page bg-gradient-to-b from-[#FFF066] via-[#FFDE33] to-[#FFD200] text-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border-4 border-[#7A1416] relative overflow-hidden transition-all">
              
              {/* Header Title */}
              <div className="text-center border-b-2 border-[#7A1416]/30 pb-4 mb-4">
                <h1 className="text-xl md:text-2xl font-black text-[#7A1416] tracking-tight uppercase">
                  CERTIFICADO VETERINARIO DE VACUNACIÓN
                </h1>
                <div className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest mt-0.5">
                  VETERINARY, CERTIFICATE OF VACCINATION
                </div>
                <div className="inline-block mt-2 px-4 py-1 rounded-full bg-[#7A1416] text-amber-300 font-extrabold text-xs md:text-sm tracking-widest uppercase shadow-xs">
                  PASSPORT TO TRAVEL
                </div>
              </div>

              {/* Center Emblem */}
              <div className="flex flex-col items-center justify-center my-4">
                <div className="w-24 h-24 rounded-full bg-[#FFF8CC] border-4 border-[#7A1416] p-1.5 shadow-md flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                    <path 
                      d="M50 78C38 78 31 66 35 56C38 48 46 51 50 48C54 51 62 48 65 56C69 66 62 78 50 78Z" 
                      fill="#7A1416" 
                    />
                    <ellipse cx="33" cy="40" rx="7" ry="11" transform="rotate(-18 33 40)" fill="#7A1416" />
                    <ellipse cx="44" cy="31" rx="6.5" ry="11" transform="rotate(-4 44 31)" fill="#7A1416" />
                    <ellipse cx="56" cy="31" rx="6.5" ry="11" transform="rotate(4 56 31)" fill="#7A1416" />
                    <ellipse cx="67" cy="40" rx="7" ry="11" transform="rotate(18 67 40)" fill="#7A1416" />
                  </svg>
                </div>
                <span className="text-xs font-black tracking-widest uppercase text-[#7A1416] mt-1.5">
                  SERVICIO VETERINARIO CALIFORNIA
                </span>
                <span className="text-[10px] font-bold text-slate-700 italic">
                  Todo para su mascota
                </span>
              </div>

              {/* Patient and Owner Credentials Box */}
              <div className="bg-white/95 rounded-2xl p-4 shadow-sm border border-[#7A1416]/20 my-4 text-xs space-y-2.5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Mascota / Pet Name</span>
                    <span className="font-extrabold text-sm text-[#7A1416]">{selectedPet.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Especie & Raza / Breed</span>
                    <span className="font-bold text-slate-800">{selectedPet.species} &bull; {selectedPet.breed}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Sexo & Edad / Age</span>
                    <span className="font-bold text-slate-800">{selectedPet.sex} &bull; {selectedPet.ageYears} años</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Peso / Weight</span>
                    <span className="font-bold text-slate-800">{selectedPet.weightKg} kg</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Propietario / Owner</span>
                    <span className="font-bold text-slate-900">{petOwner ? petOwner.name : 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Teléfono / Phone</span>
                    <span className="font-bold text-slate-900">{petOwner ? petOwner.phone : '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Microchip ID (CBP)</span>
                    <span className="font-mono font-bold text-rose-950">
                      {selectedPet.microchip || 'Pendiente de implantar'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Official Vaccination Records Table */}
              <div className="bg-white/95 rounded-2xl p-4 shadow-sm border border-[#7A1416]/20 my-4 overflow-x-auto">
                <div className="text-xs font-black text-[#7A1416] uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Registro de Inmunización / Immunization Log</span>
                  <span className="text-[10px] font-bold text-slate-500">Validez Sanitaria Bilingüe</span>
                </div>

                {petVaccines.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 italic">
                    Sin vacunas registradas aún en esta cartilla.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b-2 border-amber-300 text-[10px] font-extrabold uppercase text-slate-600">
                        <th className="py-1.5 px-2">Biológico / Vaccine</th>
                        <th className="py-1.5 px-2">Laboratorio & Lote</th>
                        <th className="py-1.5 px-2">Aplicación</th>
                        <th className="py-1.5 px-2">Próxima / Due</th>
                        <th className="py-1.5 px-2 text-right">Médico Veterinario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {petVaccines.map((vac) => (
                        <tr key={vac.id} className="hover:bg-amber-50/40">
                          <td className="py-2 px-2 font-bold text-slate-900">
                            {vac.vaccineName}
                            {vac.isTravelValid && (
                              <span className="ml-1 text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                                Travel OK
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-slate-600 font-mono text-[11px]">
                            {vac.manufacturer} <br />
                            <span className="text-slate-400 text-[10px]">Lote: {vac.lotNumber}</span>
                          </td>
                          <td className="py-2 px-2 font-bold text-slate-800">{vac.appliedDate}</td>
                          <td className="py-2 px-2 font-black text-rose-900">{vac.dueDate}</td>
                          <td className="py-2 px-2 text-right">
                            <span className="font-bold text-slate-900 block">{vac.vetName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{vac.licenseNumber}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Official Seal and Signature Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t-2 border-[#7A1416]/20 text-xs">
                <div className="space-y-1 text-[11px] leading-tight text-slate-900">
                  <div className="font-extrabold text-[#7A1416]">SERVICIO VETERINARIO CALIFORNIA</div>
                  <div>Felipe Carrillo Puerto No. 7184, Local 1 (Calle Tercera)</div>
                  <div>Zona Centro, Tijuana, B.C. &bull; Tel. (664) 685-8512</div>
                  <div className="font-bold text-slate-900">WhatsApp: (664) 394-9984</div>
                </div>

                <div className="flex flex-col items-center justify-end text-center">
                  <div className="w-48 border-b-2 border-slate-900 pb-1 mb-1 font-serif italic text-sm text-[#7A1416]">
                    Dr. Mario Estrada
                  </div>
                  <span className="text-[10px] font-bold uppercase text-slate-800">
                    Firma & Sello del Médico Veterinario
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    CÉDULA PROFESIONAL: 8492019-BC
                  </span>
                </div>
              </div>

              {/* Backside Branches Footer */}
              <div className="mt-6 pt-3 border-t border-[#7A1416]/20 flex flex-wrap items-center justify-around text-[10px] text-slate-800 font-semibold">
                <span><strong>Granero California:</strong> Calle 3ra No. 7160 Local 3 &bull; Tel. (664) 688-2875</span>
                <span>&bull;</span>
                <span><strong>Acua-Vet GDL:</strong> Av. Mutualismo 887 (2da y 3ra) &bull; Tel. (664) 685-9961</span>
              </div>
            </div>
          </div>

          {/* Right Column: Travel Checklist & Verification (hidden in print) */}
          <div className="lg:col-span-4 space-y-4 no-print">
            <div className="glass-card rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Requisitos de Cruce (Tijuana &rarr; EE.UU.)
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Vacuna Antirrábica Vigente</strong>
                    <span className="text-slate-500 text-[11px]">
                      Debe tener al menos 28 días de aplicada si es primera vez.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Certificado de Salud Bilingüe</strong>
                    <span className="text-slate-500 text-[11px]">
                      Emitido dentro de los 10 días previos al cruce por Garita San Ysidro / Otay.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Microchip ISO 11784/11785</strong>
                    <span className="text-slate-500 text-[11px]">
                      Compatible con lectores universales estadounidenses.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handlePrint}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-rose-900" />
                  Imprimir Certificado Bilingüe
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 glass-card rounded-3xl">
          Selecciona una mascota para ver o emitir su cartilla.
        </div>
      )}

      {/* Modal: Registrar Nueva Vacuna */}
      {isVacModalOpen && selectedPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <Syringe className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Registrar Vacuna para {selectedPet.name}
                  </h3>
                  <p className="text-xs text-slate-500">Cartilla oficial de Servicio Veterinario California</p>
                </div>
              </div>
              <button 
                onClick={() => setIsVacModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVaccine} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Biológico / Vacuna *</label>
                <select
                  value={vacForm.vaccineName}
                  onChange={(e) => setVacForm(prev => ({ ...prev, vaccineName: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="Vacuna Antirrábica (Rabies)">Vacuna Antirrábica (Rabies)</option>
                  <option value="Múltiple Canina Séxtuple (DHPPi+L)">Múltiple Canina Séxtuple (DHPPi+L)</option>
                  <option value="Bordetella Bronchiseptica (Tos de Perreras)">Bordetella Bronchiseptica</option>
                  <option value="Puppy DP (Parvovirus y Distemper)">Puppy DP (Parvovirus y Distemper)</option>
                  <option value="Triple Felina (FVRCP)">Triple Felina (FVRCP)</option>
                  <option value="Desparasitación Interna (Endovet)">Desparasitación Interna (Endovet)</option>
                  <option value="Desparasitación Externa (Pipeta / Bravecto)">Desparasitación Externa (Pipeta / Bravecto)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Laboratorio Fabricante</label>
                  <input
                    type="text"
                    value={vacForm.manufacturer}
                    onChange={(e) => setVacForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número de Lote</label>
                  <input
                    type="text"
                    value={vacForm.lotNumber}
                    onChange={(e) => setVacForm(prev => ({ ...prev, lotNumber: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Aplicación</label>
                  <input
                    type="date"
                    value={vacForm.appliedDate}
                    onChange={(e) => setVacForm(prev => ({ ...prev, appliedDate: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Próximo Refuerzo (Vigencia)</label>
                  <input
                    type="date"
                    value={vacForm.dueDate}
                    onChange={(e) => setVacForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Médico Veterinario</label>
                  <select
                    value={vacForm.vetName}
                    onChange={(e) => setVacForm(prev => ({ 
                      ...prev, 
                      vetName: e.target.value,
                      licenseNumber: e.target.value.includes('Mario') ? 'CÉD. PROF. 8492019-BC' : 'CÉD. PROF. 9102831-BC'
                    }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="Dr. Mario Estrada">Dr. Mario Estrada</option>
                    <option value="Dra. Sofía Rincón">Dra. Sofía Rincón</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cédula Profesional</label>
                  <input
                    type="text"
                    readOnly
                    value={vacForm.licenseNumber}
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVacModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  Asentar en Cartilla Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
