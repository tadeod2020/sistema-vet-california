import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  Plus, 
  ShieldCheck, 
  Award, 
  Syringe, 
  Calendar, 
  User, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  Plane,
  XCircle,
  Camera,
  Layers,
  BookOpen,
  Check,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

const CLINIC_SERVICES = [
  "Histopatológia", "Consultas",
  "Salud Dental", "Vacunaciones",
  "Medicina Preventiva", "Análisis Clínicos",
  "Programas Antiparasitarios", "Cirugías",
  "Radiológia", "Reproducción Asistida",
  "Hospitalización", "Ecografías"
];

export function VaccinationPassport() {
  const { pets, clients, vaccinations, addVaccination, selectedPetIdForPassport, updatePet } = useApp();

  const [selectedPetId, setSelectedPetId] = useState(() => selectedPetIdForPassport || (pets.length > 0 ? pets[0].id : null));
  const [activeCarnetPage, setActiveCarnetPage] = useState('spread'); // 'spread' (interior completo) | 'cover' | 'vaccines'
  const [isVacModalOpen, setIsVacModalOpen] = useState(false);
  const [petPhotoUrl, setPetPhotoUrl] = useState({});

  React.useEffect(() => {
    if (selectedPetIdForPassport) {
      setSelectedPetId(selectedPetIdForPassport);
    }
  }, [selectedPetIdForPassport]);

  // Form State
  const [vacForm, setVacForm] = useState({
    vaccineName: 'Vacuna Antirrábica (Rabies)',
    manufacturer: 'Nobivac Rabies',
    lotNumber: 'RAB-2026-TJ',
    appliedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    vetName: 'Médico Veterinario Autorizado',
    licenseNumber: 'CÉD. PROF. 8492019-BC',
    notes: 'Aprobado para cruce fronterizo EE.UU. / California CBP'
  });

  const selectedPet = pets.find(p => p.id === selectedPetId) || pets[0] || null;
  const petOwner = selectedPet ? clients.find(c => c.id === selectedPet.clientId) : null;
  const petVaccines = vaccinations.filter(v => v.petId === selectedPet?.id);

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

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file && selectedPet) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setPetPhotoUrl(prev => ({ ...prev, [selectedPet.id]: base64 }));
        if (updatePet) {
          updatePet(selectedPet.id, { photoUrl: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Determine species checkboxes
  const isDog = selectedPet?.species?.toLowerCase().includes('canino') || selectedPet?.species?.toLowerCase().includes('perro');
  const isCat = selectedPet?.species?.toLowerCase().includes('felino') || selectedPet?.species?.toLowerCase().includes('gato');
  const isOther = !isDog && !isCat;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-sm">
            <Plane className="w-6 h-6 text-rose-900" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Cartilla Oficial & Passport to Travel
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
                Formato Físico Bilingüe Oficial
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Réplica digital exacta de las páginas interiores y portada física para cruce internacional (Tijuana - EE.UU.).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsVacModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-rose-900 stroke-[3]" />
            Aplicar Vacuna a Cartilla
          </button>
        </div>
      </div>

      {/* Pet Selector and Page Navigation */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0">Mascota:</span>
          {pets.map(p => {
            const isSelected = selectedPet?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPetId(p.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
                  isSelected 
                    ? 'bg-amber-400 text-amber-950 shadow-xs scale-102' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.name} ({p.species})
              </button>
            );
          })}
        </div>

        {/* Carnet Section Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl w-full sm:w-auto justify-center">
          <button
            onClick={() => setActiveCarnetPage('spread')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeCarnetPage === 'spread' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Interior 1 (Datos & Foto)
          </button>
          <button
            onClick={() => setActiveCarnetPage('vaccines')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeCarnetPage === 'vaccines' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Interior 2 (Sellos de Vacunas)
          </button>
          <button
            onClick={() => setActiveCarnetPage('cover')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeCarnetPage === 'cover' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Portada Amarilla
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFFICIAL PHYSICAL BOOKLET DIGITAL DISPLAY */}
      {/* ========================================================================= */}
      {selectedPet ? (
        <div className="space-y-8">
          
          {/* ===================================================================== */}
          {/* SPREAD 1: INTERIOR 1 (Exact copy of carnet_interior_1.jpeg) */}
          {/* ===================================================================== */}
          {activeCarnetPage === 'spread' && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border-2 border-slate-300 max-w-4xl mx-auto">
              
              {/* TOP HALF: SERVICES WITH PAW PRINTS */}
              <div className="text-center border-b-2 border-slate-200 pb-8 mb-8">
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                  SERVICIO VETERINARIO CALIFORNIA
                </h2>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-widest mt-1">
                  CUENTA CON LOS SIGUIENTES SERVICIOS:
                </h3>

                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-6 max-w-2xl mx-auto text-left text-xs sm:text-sm font-semibold text-slate-800">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">🐾</span> Histopatológia
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">🐾</span> Salud Dental
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">🐾</span> Medicina Preventiva
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">🐾</span> Programas Antiparasitarios
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">🐾</span> Reproducción Asistida
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">🐾</span> Consultas
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">🐾</span> Vacunaciones
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">🐾</span> Análisis Clínicos
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">🐾</span> Cirugías
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">🐾</span> Radiológia
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">🐾</span> Hospitalización
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">🐾</span> Ecografías
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM HALF: 2 BOXES (PET DATA + OWNER ON LEFT, PHOTO ON RIGHT) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                
                {/* LEFT BOX: DATOS DE LA MASCOTA & PROPIETARIO */}
                <div className="md:col-span-7 rounded-2xl border-2 border-slate-900 p-4 sm:p-5 flex flex-col justify-between space-y-4 text-xs">
                  
                  {/* SUBSECTION 1: DATOS DE LA MASCOTA - PET DATA */}
                  <div className="space-y-2.5 border-b-2 border-slate-900 pb-4">
                    <div className="font-black text-xs uppercase tracking-wider text-slate-900">
                      DATOS DE LA MASCOTA - PET DATA
                    </div>

                    {/* Nombre */}
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-[11px] text-slate-600 leading-tight">Nombre:<br /><span className="text-[9px] text-slate-400">Name</span></span>
                      <span className="flex-1 font-extrabold text-sm text-slate-900 border-b border-slate-400 pb-0.5 px-1 font-mono">
                        {selectedPet.name}
                      </span>
                    </div>

                    {/* Species Checkboxes: Perro [ ]  Gato [ ]  Otro [ ] */}
                    <div className="flex items-center gap-6 pt-1 text-xs font-bold text-slate-800">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <span className={`w-4 h-4 rounded border-2 border-slate-900 flex items-center justify-center ${isDog ? 'bg-amber-400 text-slate-900' : 'bg-white'}`}>
                          {isDog && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                        <span>Perro</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <span className={`w-4 h-4 rounded border-2 border-slate-900 flex items-center justify-center ${isCat ? 'bg-amber-400 text-slate-900' : 'bg-white'}`}>
                          {isCat && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                        <span>Gato</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <span className={`w-4 h-4 rounded border-2 border-slate-900 flex items-center justify-center ${isOther ? 'bg-amber-400 text-slate-900' : 'bg-white'}`}>
                          {isOther && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                        <span>Otro</span>
                      </label>
                    </div>

                    {/* Raza and Color */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-[11px] text-slate-600">Raza:<br /><span className="text-[9px] text-slate-400">Breed</span></span>
                        <span className="flex-1 font-semibold text-xs border-b border-slate-400 pb-0.5 px-1 truncate">
                          {selectedPet.breed}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-[11px] text-slate-600">Color:<br /><span className="text-[9px] text-slate-400">Color</span></span>
                        <span className="flex-1 font-semibold text-xs border-b border-slate-400 pb-0.5 px-1 truncate">
                          {selectedPet.color || 'No especificado'}
                        </span>
                      </div>
                    </div>

                    {/* Fecha de Nacimiento and Sexo */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-[11px] text-slate-600">Fecha Nac.:<br /><span className="text-[9px] text-slate-400">Birthday</span></span>
                        <span className="flex-1 font-semibold text-xs border-b border-slate-400 pb-0.5 px-1 font-mono">
                          {selectedPet.ageYears ? `${selectedPet.ageYears} años` : '-'}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-[11px] text-slate-600">Sexo:<br /><span className="text-[9px] text-slate-400">Sex</span></span>
                        <span className="flex-1 font-semibold text-xs border-b border-slate-400 pb-0.5 px-1 truncate">
                          {selectedPet.sex}
                        </span>
                      </div>
                    </div>

                    {/* Micro Chip */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="font-bold text-[11px] text-slate-600">Micro Chip:</span>
                      <span className="flex-1 font-mono font-bold text-xs border-b border-slate-400 pb-0.5 px-1 text-rose-950">
                        {selectedPet.microchip || 'Pendiente / No registrado'}
                      </span>
                    </div>
                  </div>

                  {/* SUBSECTION 2: PROPIETARIO - OWNER */}
                  <div className="space-y-2.5">
                    <div className="font-black text-xs uppercase tracking-wider text-slate-900">
                      PROPIETARIO - OWNER
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-[11px] text-slate-600">Nombre:<br /><span className="text-[9px] text-slate-400">Name</span></span>
                      <span className="flex-1 font-bold text-xs border-b border-slate-400 pb-0.5 px-1">
                        {petOwner ? petOwner.name : 'Cliente General'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-[11px] text-slate-600">Dirección:<br /><span className="text-[9px] text-slate-400">Address</span></span>
                      <span className="flex-1 font-medium text-xs border-b border-slate-400 pb-0.5 px-1 truncate">
                        {petOwner?.address || 'Tijuana, B.C.'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-[11px] text-slate-600">Teléfono:<br /><span className="text-[9px] text-slate-400">Telephone</span></span>
                      <span className="flex-1 font-mono font-bold text-xs border-b border-slate-400 pb-0.5 px-1">
                        {petOwner ? petOwner.phone : '-'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-[11px] text-slate-600">Correo Electrónico:<br /><span className="text-[9px] text-slate-400">E-mail</span></span>
                      <span className="flex-1 font-medium text-xs border-b border-slate-400 pb-0.5 px-1 truncate">
                        {petOwner?.email || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT BOX: BIG ROUNDED RECTANGLE FOR PET PHOTO */}
                <div className="md:col-span-5 rounded-2xl border-2 border-slate-900 p-4 flex flex-col items-center justify-center min-h-[300px] relative bg-slate-50/50 group">
                  {(petPhotoUrl[selectedPet.id] || selectedPet.photoUrl) ? (
                    <div className="w-full h-full rounded-xl overflow-hidden flex flex-col items-center justify-center">
                      <img 
                        src={petPhotoUrl[selectedPet.id] || selectedPet.photoUrl} 
                        alt={selectedPet.name} 
                        className="w-full h-64 object-cover rounded-xl shadow-xs"
                      />
                      <label className="mt-2 text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1">
                        <Camera className="w-3 h-3" /> Cambiar Fotografía
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-20 h-20 rounded-full bg-slate-200/80 mx-auto flex items-center justify-center text-slate-400">
                        <Camera className="w-8 h-8 text-slate-500" />
                      </div>
                      <div className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                        FOTOGRAFÍA DE LA MASCOTA
                        <span className="block text-[10px] text-slate-400 font-normal">PET PHOTO</span>
                      </div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all">
                        <Camera className="w-3.5 h-3.5" />
                        Subir Foto
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SPREAD 2: INTERIOR 2 (Exact copy of carnet_interior_2.jpeg) */}
          {/* PROGRAMA DE VACUNACIÓN - VACCINATION (4 STICKER BOXES) */}
          {/* ===================================================================== */}
          {activeCarnetPage === 'vaccines' && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border-2 border-slate-300 max-w-4xl mx-auto space-y-6">
              
              <div className="text-center border-b-2 border-slate-200 pb-3">
                <span className="inline-block px-5 py-1 rounded-full bg-slate-900 text-amber-400 font-black text-xs uppercase tracking-widest">
                  PROGRAMA DE VACUNACIÓN - VACCINATION
                </span>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Registro oficial con sellos de frasco, lote y firma del médico veterinario
                </p>
              </div>

              {/* 2x2 Grid of Vaccine Cards (Replicating exact format of carnet_interior_2.jpeg) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const vaccine = petVaccines[slotIdx] || null;

                  return (
                    <div 
                      key={slotIdx}
                      className="rounded-2xl border-2 border-slate-800 p-4 space-y-3 flex flex-col justify-between bg-slate-50/20"
                    >
                      {/* Top: Vacuna Aplicada (Vaccine) */}
                      <div>
                        <div className="flex items-baseline gap-2 border-b border-slate-300 pb-1">
                          <span className="text-[11px] font-black text-slate-800 leading-tight">
                            Vacuna Aplicada <span className="font-normal text-[9px] text-slate-500">(Vaccine)</span>:
                          </span>
                          <span className="font-black text-xs text-rose-950 flex-1 truncate font-mono">
                            {vaccine ? vaccine.vaccineName : '______________________'}
                          </span>
                        </div>

                        {/* Middle: 2 Vertical Sticker Boxes on Left + Dates on Right */}
                        <div className="grid grid-cols-12 gap-3 mt-3 items-stretch">
                          {/* 2 Vertical Sticker Boxes */}
                          <div className="col-span-6 grid grid-cols-2 gap-1.5">
                            <div className="rounded-xl border-2 border-slate-400 bg-white min-h-[90px] p-1 flex flex-col items-center justify-center text-center">
                              {vaccine ? (
                                <div className="text-[9px] leading-tight text-slate-700 font-mono">
                                  <div className="font-bold text-amber-800">{vaccine.manufacturer.split(' ')[0]}</div>
                                  <div className="text-[8px] text-slate-400">LOT: {vaccine.lotNumber}</div>
                                  <div className="text-[7px] text-emerald-700 font-black mt-1">✓ VIRUS ACTIVO</div>
                                </div>
                              ) : (
                                <span className="text-[8px] text-slate-300 font-mono">Etiqueta Frasco</span>
                              )}
                            </div>

                            <div className="rounded-xl border-2 border-slate-400 bg-white min-h-[90px] p-1 flex flex-col items-center justify-center text-center">
                              {vaccine ? (
                                <div className="text-[9px] leading-tight text-slate-700 font-mono">
                                  <div className="font-bold text-slate-900">1.0 mL</div>
                                  <div className="text-[8px] text-slate-500">Subcutánea</div>
                                  <div className="text-[7px] text-blue-700 font-bold mt-1">CBP VÁLIDO</div>
                                </div>
                              ) : (
                                <span className="text-[8px] text-slate-300 font-mono">Etiqueta Diluyente</span>
                              )}
                            </div>
                          </div>

                          {/* Dates on Right */}
                          <div className="col-span-6 flex flex-col justify-between py-1 border-l-2 border-slate-200 pl-3 space-y-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                                Fecha de Vacunación <br />
                                <span className="text-[8px] text-slate-400 font-normal">(Vaccination Date)</span>
                              </span>
                              <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5 border-b border-slate-300 pb-0.5">
                                {vaccine ? vaccine.appliedDate : '______________'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                                Próxima Aplicación <br />
                                <span className="text-[8px] text-slate-400 font-normal">(Date of the Next Application)</span>
                              </span>
                              <span className="font-mono font-black text-xs text-rose-900 block mt-0.5 border-b border-slate-300 pb-0.5">
                                {vaccine ? vaccine.dueDate : '______________'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom: Signature line */}
                      <div className="pt-2 border-t border-slate-200 flex flex-col items-center">
                        <div className="font-serif italic text-xs text-[#7A1416] tracking-wide mb-0.5">
                          {vaccine?.vetName || 'Médico Veterinario Autorizado'}
                        </div>
                        <div className="w-full border-t border-slate-800"></div>
                        <span className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">
                          Firma del Veterinario
                        </span>
                        {vaccine && (
                          <span className="text-[8px] font-mono text-slate-400">
                            {vaccine.licenseNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action to add more vaccines */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setIsVacModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 text-rose-900 stroke-[3]" />
                  Agregar Vacuna / Sello a la Cartilla
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SPREAD 3: COVER & BACKCOVER (Exact copy of carnet_portada & contraportada) */}
          {/* ===================================================================== */}
          {activeCarnetPage === 'cover' && (
            <div className="bg-gradient-to-b from-[#FFF066] via-[#FFDE33] to-[#FFD200] rounded-3xl p-8 sm:p-12 shadow-2xl border-4 border-[#7A1416] max-w-lg mx-auto text-center space-y-6">
              
              {/* Header Title */}
              <div className="border-b-2 border-[#7A1416]/40 pb-4">
                <h1 className="text-xl sm:text-2xl font-black text-[#7A1416] tracking-tight uppercase leading-tight">
                  CERTIFICADO VETERINARIO DE VACUNACIÓN
                </h1>
              </div>

              {/* Paw Logo */}
              <div className="flex flex-col items-center justify-center my-4">
                <div className="w-28 h-28 rounded-full bg-[#FFF8CC] border-4 border-[#7A1416] p-2 shadow-lg flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs" fill="none">
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
                <span className="text-sm font-black tracking-widest uppercase text-[#7A1416] mt-2">
                  SERVICIO VETERINARIO CALIFORNIA
                </span>
              </div>

              {/* White Name Box (As seen in the physical carnet) */}
              <div className="bg-white rounded-xl py-3 px-6 shadow-inner border border-amber-300 font-extrabold text-lg text-slate-900 tracking-wider">
                {selectedPet.name} &bull; {selectedPet.species}
              </div>

              {/* Address and Contact info */}
              <div className="text-xs font-bold text-slate-900 space-y-1 pt-2">
                <div>Felipe Carrillo Puerto No. 7184, Local 1</div>
                <div>Calle Tercera</div>
                <div className="font-extrabold text-sm text-[#7A1416]">Zona Centro, Tijuana, B.C.</div>
                <div className="pt-1">Tel. (664) 685-8512</div>
                <div className="font-extrabold flex items-center justify-center gap-1 text-slate-900">
                  <span>WhatsApp: (663) 435-9988</span>
                </div>
              </div>

              {/* Bottom Official Passport Stamp */}
              <div className="pt-4 border-t-2 border-[#7A1416]/40 space-y-1">
                <div className="text-xs font-black text-slate-900 tracking-widest uppercase">
                  VETERINARY, CERTIFICATE OF VACCINATION
                </div>
                <div className="inline-block px-4 py-1.5 rounded-full bg-[#7A1416] text-amber-300 font-black text-sm tracking-widest uppercase shadow-md">
                  PASSPORT TO TRAVEL
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 glass-card rounded-3xl">
          Selecciona una mascota para visualizar y emitir su cartilla física.
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVA VACUNA */}
      {isVacModalOpen && selectedPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <Syringe className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Asentar Vacuna para {selectedPet.name}
                  </h3>
                  <p className="text-xs text-slate-500">Genera el sello oficial para el Programa de Vacunación</p>
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
                  <option value="Desparasitación Externa (Bravecto / Pipeta)">Desparasitación Externa (Bravecto / Pipeta)</option>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Próxima Aplicación (Vigencia)</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Personal Veterinario</label>
                  <select
                    value={vacForm.vetName}
                    onChange={(e) => setVacForm(prev => ({ 
                      ...prev, 
                      vetName: e.target.value,
                      licenseNumber: 'CÉD. PROF. 8492019-BC'
                    }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="Médico Veterinario Autorizado">Médico Veterinario Autorizado</option>
                    <option value="Personal Clínico California">Personal Clínico California</option>
                    <option value="Director Médico Veterinario">Director Médico Veterinario</option>
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
