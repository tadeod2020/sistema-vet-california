import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  MessageCircle, 
  PawPrint, 
  Plus, 
  Star, 
  MapPin, 
  FileText, 
  Calendar,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  ShieldCheck,
  Camera,
  FolderOpen,
  Activity,
  Heart,
  Stethoscope,
  Scissors,
  Building,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Clock,
  Trash2,
  Printer,
  Image,
  UploadCloud,
  Eye,
  Download,
  FileUp
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function PatientsAndClients() {
  const { 
    clients, 
    pets, 
    addClient, 
    registerPetDirect, 
    setActiveTab,
    updatePet,
    addClinicalNote,
    addLabResult,
    deleteLabResult,
    openPetPassport,
    vaccinations = [],
    surgeries = [],
    cages = [],
    appointments = []
  } = useApp();

  const [activeView, setActiveView] = useState('pets'); // 'pets' | 'clients'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | frequent | regular

  // Modal states
  const [isQuickPetModalOpen, setIsQuickPetModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Expediente Clínico Modal State
  const [selectedPetForDossier, setSelectedPetForDossier] = useState(null);
  const [activeDossierTab, setActiveDossierTab] = useState('consultations'); // 'consultations' | 'labs' | 'vaccines' | 'surgeries' | 'hospital'
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAddingLab, setIsAddingLab] = useState(false);
  const [previewLabItem, setPreviewLabItem] = useState(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [labForm, setLabForm] = useState({
    title: '',
    category: 'Análisis de Sangre / Hemograma',
    fileType: 'image', // 'image' | 'pdf'
    fileUrl: '',
    fileName: '',
    fileSize: '',
    performedBy: 'Laboratorio Clínico California',
    notes: ''
  });
  const [noteForm, setNoteForm] = useState({
    reason: '',
    diagnosis: '',
    treatment: '',
    temperature: '',
    weight: '',
    heartRate: '',
    nextCheckup: '',
    vet: 'Médico Veterinario de Guardia'
  });

  // Quick Pet Form (Only 3 required fields: ownerPhone, ownerName, petName + optional photoUrl)
  const [quickPetForm, setQuickPetForm] = useState({
    ownerPhone: '',
    ownerName: '',
    petName: '',
    photoUrl: '',
    // Optional fields
    species: 'Canino',
    breed: '',
    ageYears: '',
    sex: 'Macho',
    weightKg: '',
    color: '',
    allergies: '',
    microchip: '',
    notes: '',
    ownerAddress: ''
  });

  // Client Only Form
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    isFrequent: false,
    tag: 'Cliente Regular',
    notes: ''
  });

  const handleQuickPetPhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQuickPetForm(prev => ({ ...prev, photoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateDossierPhoto = (petId, e) => {
    const file = e.target.files[0];
    if (file && petId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        updatePet(petId, { photoUrl: base64 });
        setSelectedPetForDossier(prev => (prev ? { ...prev, photoUrl: base64 } : prev));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle phone input in quick pet registration to auto-detect existing owner
  const handlePhoneChange = (val) => {
    setQuickPetForm(prev => ({ ...prev, ownerPhone: val }));
    const cleanNum = val.replace(/\D/g, '');
    if (cleanNum.length >= 7) {
      const match = clients.find(c => c.phone.replace(/\D/g, '').includes(cleanNum));
      if (match && !quickPetForm.ownerName) {
        setQuickPetForm(prev => ({
          ...prev,
          ownerName: match.name,
          ownerAddress: match.address || ''
        }));
      }
    }
  };

  const handleQuickPetSubmit = (e) => {
    e.preventDefault();
    if (!quickPetForm.ownerPhone.trim() || !quickPetForm.ownerName.trim() || !quickPetForm.petName.trim()) {
      alert('Los 3 campos obligatorios son: Número del dueño, Nombre del dueño y Nombre del perro.');
      return;
    }

    registerPetDirect({
      ownerPhone: quickPetForm.ownerPhone,
      ownerName: quickPetForm.ownerName,
      petName: quickPetForm.petName,
      photoUrl: quickPetForm.photoUrl || '',
      species: quickPetForm.species || 'Canino',
      breed: quickPetForm.breed || 'Sin especificar',
      ageYears: quickPetForm.ageYears,
      sex: quickPetForm.sex || 'Macho',
      weightKg: quickPetForm.weightKg,
      color: quickPetForm.color || 'Sin especificar',
      allergies: quickPetForm.allergies || 'Ninguna conocida',
      microchip: quickPetForm.microchip,
      notes: quickPetForm.notes,
      ownerAddress: quickPetForm.ownerAddress
    });

    setIsQuickPetModalOpen(false);
    setQuickPetForm({
      ownerPhone: '',
      ownerName: '',
      petName: '',
      photoUrl: '',
      species: 'Canino',
      breed: '',
      ageYears: '',
      sex: 'Macho',
      weightKg: '',
      color: '',
      allergies: '',
      microchip: '',
      notes: '',
      ownerAddress: ''
    });
    setShowOptionalFields(false);
  };

  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!selectedPetForDossier) return;

    addClinicalNote(selectedPetForDossier.id, {
      reason: noteForm.reason,
      diagnosis: noteForm.diagnosis,
      treatment: noteForm.treatment,
      vet: noteForm.vet || 'Médico Veterinario de Guardia',
      temperature: noteForm.temperature,
      weight: noteForm.weight,
      heartRate: noteForm.heartRate,
      nextCheckup: noteForm.nextCheckup
    });

    if (noteForm.weight && updatePet) {
      updatePet(selectedPetForDossier.id, { weightKg: Number(noteForm.weight) });
    }

    setIsAddingNote(false);
    setNoteForm({
      reason: '',
      diagnosis: '',
      treatment: '',
      temperature: '',
      weight: '',
      heartRate: '',
      vet: 'Médico Veterinario de Guardia'
    });
  };

  const handleLabFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      alert('Por favor selecciona una imagen (JPG, PNG, WEBP) o un documento PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLabForm(prev => ({
        ...prev,
        fileUrl: reader.result,
        fileName: file.name,
        fileType: isPdf ? 'pdf' : 'image',
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddLabSubmit = (e) => {
    e.preventDefault();
    if (!selectedPetForDossier) return;
    if (!labForm.fileUrl) {
      alert('Por favor adjunta una foto o archivo PDF del resultado de laboratorio.');
      return;
    }

    addLabResult(selectedPetForDossier.id, {
      title: labForm.title.trim() || 'Estudio de Laboratorio',
      category: labForm.category,
      fileType: labForm.fileType,
      fileUrl: labForm.fileUrl,
      fileName: labForm.fileName,
      notes: labForm.notes,
      performedBy: labForm.performedBy || 'Laboratorio Clínico California'
    });

    setIsAddingLab(false);
    setLabForm({
      title: '',
      category: 'Análisis de Sangre / Hemograma',
      fileType: 'image',
      fileUrl: '',
      fileName: '',
      fileSize: '',
      performedBy: 'Laboratorio Clínico California',
      notes: ''
    });
  };

  const handleCreateClient = (e) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.phone) {
      alert('Nombre y teléfono son obligatorios');
      return;
    }
    const cleanWa = clientForm.whatsapp ? clientForm.whatsapp.replace(/\D/g, '') : clientForm.phone.replace(/\D/g, '');
    addClient({
      ...clientForm,
      whatsapp: cleanWa.startsWith('52') ? cleanWa : `521${cleanWa}`
    });
    setIsClientModalOpen(false);
    setClientForm({
      name: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      isFrequent: false,
      tag: 'Cliente Regular',
      notes: ''
    });
  };

  // Filtered Pets
  const filteredPets = pets.filter(p => {
    const owner = clients.find(c => c.id === p.clientId);
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (owner && owner.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (owner && owner.phone.includes(searchQuery));
    
    if (filterType === 'frequent') return matchesSearch && owner?.isFrequent;
    return matchesSearch;
  });

  // Filtered Clients
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.tag && c.tag.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterType === 'frequent') return matchesSearch && c.isFrequent;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="glass-card rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-sm">
            <PawPrint className="w-6 h-6 text-rose-900" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Padrón de Mascotas & Propietarios
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
                {pets.length} Mascotas &bull; {clients.length} Propietarios
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Alta rápida simplificada (solo teléfono, dueño y mascota requeridos) y gestión de clientes frecuentes.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsQuickPetModalOpen(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-rose-900 stroke-[3]" />
            + Agregar Mascota (Rápido)
          </button>

          <button
            onClick={() => setIsClientModalOpen(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            + Nuevo Dueño
          </button>
        </div>
      </div>

      {/* View Switcher: Por Mascotas vs Por Familias / Dueños */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveView('pets')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeView === 'pets'
                ? 'bg-white text-slate-900 shadow-xs scale-102'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PawPrint className="w-4 h-4 text-amber-600" />
            Directorio de Mascotas ({pets.length})
          </button>
          <button
            onClick={() => setActiveView('clients')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeView === 'clients'
                ? 'bg-white text-slate-900 shadow-xs scale-102'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-rose-900" />
            Dueños / Familias ({clients.length})
          </button>
        </div>

        {/* Search Input and Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeView === 'pets' ? "Buscar perro, raza o dueño..." : "Buscar por dueño, teléfono..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none shadow-xs"
            />
          </div>

          <button
            onClick={() => setFilterType(prev => prev === 'frequent' ? 'all' : 'frequent')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
              filterType === 'frequent'
                ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Filtrar por clientes frecuentes / rescatistas"
          >
            <Star className={`w-3.5 h-3.5 ${filterType === 'frequent' ? 'fill-amber-600 text-amber-700' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Solo Frecuentes</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: DIRECTORY OF PETS */}
      {activeView === 'pets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPets.map((pet) => {
            const owner = clients.find(c => c.id === pet.clientId);
            const notesCount = (pet.clinicalNotes || []).length;

            return (
              <div
                key={pet.id}
                className="glass-card rounded-2xl p-4.5 border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Pet Header with Photo and Info */}
                  <div className="flex items-center gap-3.5 border-b border-slate-100 pb-3">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs flex items-center justify-center">
                      {pet.photoUrl ? (
                        <img 
                          src={pet.photoUrl} 
                          alt={pet.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <PawPrint className="w-7 h-7 text-amber-600/70" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-base font-black text-slate-900 truncate">{pet.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-200 shrink-0">
                          {pet.species}
                        </span>
                        {owner?.isFrequent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 flex items-center gap-0.5 shrink-0 shadow-xs">
                            <Star className="w-2.5 h-2.5 fill-amber-950" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium truncate">
                        {pet.breed} &bull; {pet.sex}
                      </div>
                    </div>
                  </div>

                  {/* Owner Information (Essential contact) */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 truncate">
                        <Users className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{owner ? owner.name : 'Dueño sin registrar'}</span>
                      </span>
                      {owner?.whatsapp && (
                        <a
                          href={`https://wa.me/${owner.whatsapp}?text=Hola%20${encodeURIComponent(owner.name)},%20te%20escribimos%20de%20Servicio%20Veterinario%20California%20sobre%20tu%20mascota%20${encodeURIComponent(pet.name)}...`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md hover:bg-emerald-200 transition-colors shrink-0"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" /> WhatsApp
                        </a>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      {owner ? owner.phone : 'Sin teléfono'}
                    </div>
                  </div>

                  {/* Extra Clinical Details */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Edad / Peso:</span>
                      <span className="font-semibold">{pet.ageYears} años &bull; {pet.weightKg} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Historial Clínico:</span>
                      <span className="font-semibold text-rose-950 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-600" />
                        {notesCount > 0 ? `${notesCount} consulta(s)` : 'Al día'}
                      </span>
                    </div>
                  </div>

                  {pet.allergies && pet.allergies !== 'Ninguna' && pet.allergies !== 'Ninguna conocida' && (
                    <div className="mt-2 text-[10px] text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5 shrink-0" /> Alergia: {pet.allergies}
                    </div>
                  )}
                </div>

                {/* Footer action buttons */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[10px] text-slate-400 font-mono truncate">
                    {pet.microchip ? `Chip: ${pet.microchip.slice(-6)}` : 'Sin chip'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedPetForDossier(pet);
                        setActiveDossierTab('consultations');
                        setIsAddingNote(false);
                      }}
                      className="px-2.5 py-1 font-bold text-xs bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-amber-800" />
                      Expediente
                    </button>
                    <button
                      onClick={() => openPetPassport ? openPetPassport(pet.id) : setActiveTab('passport')}
                      className="px-2.5 py-1 font-bold text-xs bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      Cartilla &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: DIRECTORY OF OWNERS & FAMILIES */}
      {activeView === 'clients' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredClients.map((client) => {
            const clientPets = pets.filter(p => p.clientId === client.id);

            return (
              <div 
                key={client.id}
                className={`glass-card rounded-2xl p-5 border transition-all ${
                  client.isFrequent ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">{client.name}</h3>
                      {client.isFrequent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                          {client.tag || 'Cliente Frecuente'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {client.phone}
                      </span>
                      {client.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {client.address}
                        </span>
                      )}
                    </div>
                  </div>

                  {client.whatsapp && (
                    <a
                      href={`https://wa.me/${client.whatsapp}?text=Hola%20${encodeURIComponent(client.name)},%20te%20escribimos%20de%20Servicio%20Veterinario%20California...`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>

                {/* Pets List */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <PawPrint className="w-3.5 h-3.5 text-rose-900" />
                      Mascotas Registradas ({clientPets.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {clientPets.map(pet => (
                      <div key={pet.id} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                        <div className="font-bold text-slate-900">{pet.name}</div>
                        <div className="text-[11px] text-slate-500">{pet.breed} &bull; {pet.ageYears} años</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ALTA RÁPIDA DE MASCOTA (Solo 3 obligatorios: Teléfono, Dueño, Perro) */}
      {/* ========================================================================= */}
      {isQuickPetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-slideUp max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <PawPrint className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Alta Rápida de Mascota</h3>
                  <p className="text-xs text-rose-900 font-semibold">
                    Solo 3 datos obligatorios: Teléfono, Dueño y Perro
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsQuickPetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickPetSubmit} className="space-y-4">
              {/* Highlighted Box: 3 MANDATORY FIELDS */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-3 shadow-xs">
                <div className="text-xs font-black text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-900" />
                  Datos Obligatorios de Registro
                </div>

                {/* 1. Teléfono del Dueño */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>1. Número de Teléfono del Dueño *</span>
                    <span className="text-[10px] text-amber-900 font-normal">Autodetecta dueños existentes</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Ej. (664) 123-4567"
                      value={quickPetForm.ownerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* 2. Nombre del Dueño */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    2. Nombre del Dueño *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Roberto Garza o Carmen Villalobos"
                    value={quickPetForm.ownerName}
                    onChange={(e) => setQuickPetForm(prev => ({ ...prev, ownerName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold text-slate-900"
                  />
                </div>

                {/* 3. Nombre del Perro / Mascota */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    3. Nombre del Perro / Mascota *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Rocky, Canela, Thor..."
                    value={quickPetForm.petName}
                    onChange={(e) => setQuickPetForm(prev => ({ ...prev, petName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border-2 border-amber-400 rounded-xl focus:ring-2 focus:ring-rose-900 focus:outline-none font-black text-rose-950 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Accordion Toggle for OPTIONAL FIELDS */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(prev => !prev)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Datos Adicionales Clínicos (Opcionales: Raza, Edad, Peso, Color...)
                  </span>
                  {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showOptionalFields && (
                  <div className="p-4 bg-white space-y-3 text-xs border-t border-slate-200">
                    {/* Foto del Perro (Opcional) */}
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="relative w-16 h-16 rounded-xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                        {quickPetForm.photoUrl ? (
                          <img src={quickPetForm.photoUrl} alt="Foto mascota" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Foto del Perro / Mascota (Opcional)
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-all">
                            <Camera className="w-3.5 h-3.5" />
                            {quickPetForm.photoUrl ? 'Cambiar Foto' : 'Subir Foto'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleQuickPetPhoto}
                              className="hidden"
                            />
                          </label>
                          {quickPetForm.photoUrl && (
                            <button
                              type="button"
                              onClick={() => setQuickPetForm(prev => ({ ...prev, photoUrl: '' }))}
                              className="text-[11px] font-semibold text-rose-700 hover:underline px-1 py-1"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          JPG o PNG. Se sincroniza con el carnet de vacunación y expediente.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Especie</label>
                        <select
                          value={quickPetForm.species}
                          onChange={(e) => setQuickPetForm(prev => ({ ...prev, species: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                        >
                          <option value="Canino">Canino (Perro)</option>
                          <option value="Felino">Felino (Gato)</option>
                          <option value="Ave">Ave</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Raza</label>
                        <input
                          type="text"
                          placeholder="Ej. Mestizo, Golden, Poodle..."
                          value={quickPetForm.breed}
                          onChange={(e) => setQuickPetForm(prev => ({ ...prev, breed: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Edad (Años)</label>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="Ej. 2"
                          value={quickPetForm.ageYears}
                          onChange={(e) => setQuickPetForm(prev => ({ ...prev, ageYears: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Peso (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ej. 12"
                          value={quickPetForm.weightKg}
                          onChange={(e) => setQuickPetForm(prev => ({ ...prev, weightKg: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Sexo</label>
                        <select
                          value={quickPetForm.sex}
                          onChange={(e) => setQuickPetForm(prev => ({ ...prev, sex: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                        >
                          <option value="Macho">Macho</option>
                          <option value="Hembra">Hembra</option>
                          <option value="Macho (Castrado)">Macho (Castrado)</option>
                          <option value="Hembra (Esterilizada)">Hembra (Esterilizada)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Color de Pelaje</label>
                        <input
                          type="text"
                          placeholder="Ej. Café con blanco"
                          value={quickPetForm.color}
                          onChange={(e) => setQuickPetForm(prev => ({ ...prev, color: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Microchip (Viaje EE.UU.)</label>
                        <input
                          type="text"
                          placeholder="Ej. 985141..."
                          value={quickPetForm.microchip}
                          onChange={(e) => setQuickPetForm(prev => ({ ...prev, microchip: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Alergias o Notas Médicas</label>
                      <input
                        type="text"
                        placeholder="Ej. Alergia a pulgas..."
                        value={quickPetForm.allergies}
                        onChange={(e) => setQuickPetForm(prev => ({ ...prev, allergies: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickPetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-black text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  Guardar Mascota y Dueño
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO CLIENTE ONLY */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-slideUp max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Registrar Dueño / Rescatista</h3>
                  <p className="text-xs text-slate-500">Nuevo contacto familiar o rescatista independiente</p>
                </div>
              </div>
              <button 
                onClick={() => setIsClientModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Roberto Garza o Sra. Carmen"
                  value={clientForm.name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Principal *</label>
                  <input
                    type="tel"
                    required
                    placeholder="(664) 000-0000"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="6640000000"
                    value={clientForm.whatsapp}
                    onChange={(e) => setClientForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dirección / Colonia (Tijuana)</label>
                <input
                  type="text"
                  placeholder="Ej. Zona Centro, Playas de Tijuana, Otay..."
                  value={clientForm.address}
                  onChange={(e) => setClientForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    Marcar como Cliente Frecuente / Rescatista
                  </div>
                  <div className="text-[11px] text-amber-900/80">
                    Dueños con múltiples mascotas o rescatistas independientes.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={clientForm.isFrequent}
                  onChange={(e) => setClientForm(prev => ({ ...prev, isFrequent: e.target.checked }))}
                  className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  Guardar Dueño
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXPEDIENTE CLÍNICO DIGITAL DE LA MASCOTA */}
      {/* ========================================================================= */}
      {selectedPetForDossier && (() => {
        const dossierPet = pets.find(p => p.id === selectedPetForDossier.id) || selectedPetForDossier;
        const dossierOwner = clients.find(c => c.id === dossierPet.clientId);
        const dossierVaccines = vaccinations.filter(v => v.petId === dossierPet.id || v.petName?.toLowerCase() === dossierPet.name.toLowerCase());
        const dossierSurgeries = surgeries.filter(s => s.petId === dossierPet.id || s.petName?.toLowerCase() === dossierPet.name.toLowerCase());
        const dossierCage = cages.find(c => c.currentOccupant?.patientId === dossierPet.id || c.currentOccupant?.patientName?.toLowerCase() === dossierPet.name.toLowerCase());
        const notes = dossierPet.clinicalNotes || [];
        const dossierLabs = dossierPet.labResults || [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slideUp">
              
              {/* HEADER BANNER WITH PATIENT IDENTITY & OWNER */}
              <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50/40 p-4 sm:p-6 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Pet Photo with Quick Change Trigger */}
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-amber-400 shadow-md flex items-center justify-center">
                        {dossierPet.photoUrl ? (
                          <img 
                            src={dossierPet.photoUrl} 
                            alt={dossierPet.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <PawPrint className="w-10 h-10 text-amber-600" />
                        )}
                      </div>
                      <label 
                        className="absolute bottom-0 right-0 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl shadow-md cursor-pointer transition-all"
                        title="Cambiar fotografía"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleUpdateDossierPhoto(dossierPet.id, e)} 
                          className="hidden" 
                        />
                      </label>
                    </div>

                    {/* Pet Details */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          {dossierPet.name}
                        </h2>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 shadow-2xs">
                          {dossierPet.species}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {dossierPet.breed}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-600">
                        <span><strong>Edad:</strong> {dossierPet.ageYears} años</span>
                        <span>&bull;</span>
                        <span><strong>Sexo:</strong> {dossierPet.sex}</span>
                        <span>&bull;</span>
                        <span><strong>Peso:</strong> {dossierPet.weightKg} kg</span>
                        {dossierPet.microchip && (
                          <>
                            <span>&bull;</span>
                            <span className="font-mono text-slate-700"><strong>Chip:</strong> {dossierPet.microchip}</span>
                          </>
                        )}
                      </div>

                      {dossierPet.allergies && dossierPet.allergies !== 'Ninguna' && dossierPet.allergies !== 'Ninguna conocida' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                          Alergia / Condición: {dossierPet.allergies}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Owner Contact Card & Close Button */}
                  <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                    <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1 text-xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Propietario
                      </div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {dossierOwner ? dossierOwner.name : 'Dueño sin registrar'}
                      </div>
                      {dossierOwner && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <a
                            href={`tel:${dossierOwner.phone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            {dossierOwner.phone}
                          </a>
                          {dossierOwner.whatsapp && (
                            <a
                              href={`https://wa.me/${dossierOwner.whatsapp}?text=Hola%20${encodeURIComponent(dossierOwner.name)},%20te%20escribimos%20de%20Servicio%20Veterinario%20California%20sobre%20el%20expediente%20de%20${encodeURIComponent(dossierPet.name)}...`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md hover:bg-emerald-200 transition-colors"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" /> WhatsApp
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start">
                      <button
                        onClick={() => setIsPrintPreviewOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Imprimir Resumen Clínico / Guardar en PDF"
                      >
                        <Printer className="w-3.5 h-3.5 text-rose-950" />
                        <span className="hidden sm:inline">Imprimir / PDF</span>
                      </button>

                      <button
                        onClick={() => setSelectedPetForDossier(null)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* DOSSIER SEGMENTED TABS */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-4 mt-2 border-t border-slate-200">
                  <button
                    onClick={() => { setActiveDossierTab('consultations'); setIsAddingNote(false); }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                      activeDossierTab === 'consultations'
                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-rose-900" />
                    Consultas & Notas Médicas
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-black/10">
                      {notes.length}
                    </span>
                  </button>

                  <button
                    onClick={() => { setActiveDossierTab('labs'); setIsAddingLab(false); }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                      activeDossierTab === 'labs'
                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-blue-700" />
                    Laboratorio & Archivos
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-black/10">
                      {dossierLabs.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveDossierTab('vaccines')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                      activeDossierTab === 'vaccines'
                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    Cartilla & Vacunas
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-black/10">
                      {dossierVaccines.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveDossierTab('surgeries')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                      activeDossierTab === 'surgeries'
                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5 text-rose-800" />
                    Cirugías
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-black/10">
                      {dossierSurgeries.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveDossierTab('hospital')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                      activeDossierTab === 'hospital'
                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5 text-slate-700" />
                    Hospitalización
                    {dossierCage && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                        Activo ({dossierCage.code})
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* BODY: TABS CONTENT */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                
                {/* TAB 1: CONSULTAS Y NOTAS */}
                {activeDossierTab === 'consultations' && (
                  <div className="space-y-4">
                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          Historial de Consultas y Evaluaciones Clínicas
                        </h4>
                        <p className="text-xs text-slate-500">
                          Registro cronológico de diagnósticos, constantes vitales y tratamientos
                        </p>
                      </div>

                      {!isAddingNote && (
                        <button
                          onClick={() => setIsAddingNote(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4 text-rose-900 stroke-[3]" />
                          + Nueva Consulta
                        </button>
                      )}
                    </div>

                    {/* FORM: AGREGAR NUEVA CONSULTA */}
                    {isAddingNote && (
                      <form onSubmit={handleAddNoteSubmit} className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border-2 border-amber-300 space-y-4 shadow-sm animate-slideDown">
                        <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                          <span className="font-black text-xs uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
                            <Stethoscope className="w-4 h-4 text-rose-900" />
                            Nueva Consulta / Nota Médica
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAddingNote(false)}
                            className="text-xs text-slate-500 hover:text-slate-800"
                          >
                            Cancelar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Motivo de Consulta *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Control preventivo, Vómitos, Claudicación..."
                              value={noteForm.reason}
                              onChange={(e) => setNoteForm(prev => ({ ...prev, reason: e.target.value }))}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none font-semibold text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Médico Veterinario</label>
                            <input
                              type="text"
                              value={noteForm.vet}
                              onChange={(e) => setNoteForm(prev => ({ ...prev, vet: e.target.value }))}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-900"
                            />
                          </div>
                        </div>

                        {/* Vitals row */}
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Temperatura (°C)</label>
                            <input
                              type="text"
                              placeholder="Ej. 38.5"
                              value={noteForm.temperature}
                              onChange={(e) => setNoteForm(prev => ({ ...prev, temperature: e.target.value }))}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Peso Actual (kg)</label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder={`Actual: ${dossierPet.weightKg}`}
                              value={noteForm.weight}
                              onChange={(e) => setNoteForm(prev => ({ ...prev, weight: e.target.value }))}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Frecuencia Cardíaca</label>
                            <input
                              type="text"
                              placeholder="Ej. 110 lpm"
                              value={noteForm.heartRate}
                              onChange={(e) => setNoteForm(prev => ({ ...prev, heartRate: e.target.value }))}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Diagnosis & Treatment */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Diagnóstico Clínico *</label>
                            <textarea
                              required
                              rows={2}
                              placeholder="Hallazgos en anamnesis y exploración física..."
                              value={noteForm.diagnosis}
                              onChange={(e) => setNoteForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Tratamiento / Receta Médica *</label>
                            <textarea
                              required
                              rows={2}
                              placeholder="Medicamentos, dosis, frecuencia y cuidados indicados..."
                              value={noteForm.treatment}
                              onChange={(e) => setNoteForm(prev => ({ ...prev, treatment: e.target.value }))}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                          <div className="w-full sm:w-auto">
                            <label className="block text-xs font-bold text-slate-800 mb-1">Próxima Cita / Seguimiento (Opcional)</label>
                            <input
                              type="date"
                              value={noteForm.nextCheckup}
                              onChange={(e) => setNoteForm(prev => ({ ...prev, nextCheckup: e.target.value }))}
                              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                            />
                          </div>

                          <div className="flex items-center gap-2 self-end">
                            <button
                              type="button"
                              onClick={() => setIsAddingNote(false)}
                              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 text-xs font-black text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95"
                            >
                              Guardar Consulta en Expediente
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Timeline of Notes */}
                    {notes.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                        <Stethoscope className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="font-bold text-xs text-slate-700">No hay consultas registradas aún</div>
                        <p className="text-[11px] text-slate-500">
                          Haz clic en "+ Nueva Consulta" para registrar la primera visita médica del paciente.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notes.map((note) => (
                          <div 
                            key={note.id}
                            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-all space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-xs text-rose-950">
                                  {note.reason}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {note.vet || 'Médico Veterinario'}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {note.date}
                              </span>
                            </div>

                            {/* Vitals Badges */}
                            {note.vitals && (
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {note.vitals.temp && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-900 border border-orange-200 font-semibold text-[11px]">
                                    🌡️ Temp: {note.vitals.temp}
                                  </span>
                                )}
                                {note.vitals.weight && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 font-semibold text-[11px]">
                                    ⚖️ Peso: {note.vitals.weight}
                                  </span>
                                )}
                                {note.vitals.heartRate && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 font-semibold text-[11px]">
                                    ❤️ F.C.: {note.vitals.heartRate}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Clinical diagnosis and treatment */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                  Diagnóstico Clínico
                                </div>
                                <p className="text-slate-800 font-medium">
                                  {note.diagnosis}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1">
                                  Tratamiento & Receta Indicada
                                </div>
                                <p className="text-slate-900 font-semibold">
                                  {note.treatment}
                                </p>
                              </div>
                            </div>

                            {note.nextCheckup && (
                              <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 inline-flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                Próxima cita de revisión programada: {note.nextCheckup}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: LABORATORIO & ARCHIVOS (FOTOS Y PDFS) */}
                {activeDossierTab === 'labs' && (
                  <div className="space-y-4">
                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          <FolderOpen className="w-4 h-4 text-blue-700" />
                          Estudios de Laboratorio & Archivos Adjuntos
                        </h4>
                        <p className="text-xs text-slate-500">
                          Sube y consulta fotos de estudios, radiografías, ultrasonidos y reportes en PDF
                        </p>
                      </div>

                      {!isAddingLab && (
                        <button
                          onClick={() => setIsAddingLab(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          + Adjuntar Foto / PDF de Laboratorio
                        </button>
                      )}
                    </div>

                    {/* FORM: AGREGAR ESTUDIO DE LABORATORIO */}
                    {isAddingLab && (
                      <form onSubmit={handleAddLabSubmit} className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border-2 border-blue-200 space-y-4 shadow-sm animate-slideDown">
                        <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                          <span className="font-black text-xs uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                            <UploadCloud className="w-4 h-4 text-blue-700" />
                            Nuevo Resultado de Laboratorio
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingLab(false);
                              setLabForm({
                                title: '',
                                category: 'Análisis de Sangre / Hemograma',
                                fileType: 'image',
                                fileUrl: '',
                                fileName: '',
                                fileSize: '',
                                performedBy: 'Laboratorio Clínico California',
                                notes: ''
                              });
                            }}
                            className="text-xs text-slate-500 hover:text-slate-800"
                          >
                            Cancelar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Nombre o Título del Estudio *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Hemograma Completo, Coprológico, Placa Tórax..."
                              value={labForm.title}
                              onChange={(e) => setLabForm(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none font-semibold text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Tipo de Estudio / Categoría</label>
                            <select
                              value={labForm.category}
                              onChange={(e) => setLabForm(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none text-slate-900"
                            >
                              <option value="Análisis de Sangre / Hemograma">Análisis de Sangre / Hemograma</option>
                              <option value="Química Sanguínea">Química Sanguínea</option>
                              <option value="Radiografía / Rayos X">Radiografía / Rayos X</option>
                              <option value="Ultrasonido / Ecografía">Ultrasonido / Ecografía</option>
                              <option value="Coprológico / Parásitos">Coprológico / Parásitos</option>
                              <option value="Urianálisis">Urianálisis</option>
                              <option value="Biopsia / Histopatología">Biopsia / Histopatología</option>
                              <option value="Prueba Rápida (Parvovirus, Moquillo, etc.)">Prueba Rápida (Parvovirus, Moquillo, etc.)</option>
                              <option value="Otro Estudio Clínico">Otro Estudio Clínico</option>
                            </select>
                          </div>
                        </div>

                        {/* File Upload Box */}
                        <div>
                          <label className="block font-bold text-slate-800 mb-1">Archivo de Resultado (Foto JPG/PNG o Documento PDF) *</label>
                          <div className="border-2 border-dashed border-blue-300 rounded-2xl p-4 bg-white/80 hover:bg-white transition-all text-center">
                            {labForm.fileUrl ? (
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-blue-50/50 rounded-xl border border-blue-200">
                                <div className="flex items-center gap-3">
                                  {labForm.fileType === 'pdf' ? (
                                    <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs shrink-0 border border-rose-300">
                                      PDF
                                    </div>
                                  ) : (
                                    <img 
                                      src={labForm.fileUrl} 
                                      alt="Vista previa" 
                                      className="w-12 h-12 object-cover rounded-xl border border-slate-300 shrink-0" 
                                    />
                                  )}
                                  <div className="text-left">
                                    <div className="font-bold text-slate-900 text-xs truncate max-w-xs">{labForm.fileName || 'Archivo adjunto'}</div>
                                    <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                                      {labForm.fileType === 'pdf' ? 'Documento PDF' : 'Imagen / Fotografía'}
                                    </span>
                                  </div>
                                </div>
                                <label className="cursor-pointer text-xs font-bold text-blue-700 hover:text-blue-900 bg-white px-3 py-1.5 rounded-lg border border-blue-300">
                                  Cambiar Archivo
                                  <input 
                                    type="file" 
                                    accept="image/*,application/pdf,.pdf" 
                                    onChange={handleLabFileUpload} 
                                    className="hidden" 
                                  />
                                </label>
                              </div>
                            ) : (
                              <label className="cursor-pointer flex flex-col items-center justify-center py-4 space-y-2">
                                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                  <FileUp className="w-6 h-6" />
                                </div>
                                <div>
                                  <span className="font-bold text-blue-900 text-xs hover:underline">Haz clic para seleccionar foto o PDF</span>
                                  <p className="text-[11px] text-slate-500 mt-0.5">Formatos admitidos: JPG, PNG, WEBP, PDF (Hasta 15MB)</p>
                                </div>
                                <input 
                                  type="file" 
                                  accept="image/*,application/pdf,.pdf" 
                                  onChange={handleLabFileUpload} 
                                  className="hidden" 
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Additional fields: Notes & Performed By */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Laboratorio o Responsable</label>
                            <input
                              type="text"
                              value={labForm.performedBy}
                              onChange={(e) => setLabForm(prev => ({ ...prev, performedBy: e.target.value }))}
                              placeholder="Ej. Laboratorio Clínico California, Dr..."
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-800 mb-1">Observaciones / Conclusión del Estudio</label>
                            <input
                              type="text"
                              value={labForm.notes}
                              onChange={(e) => setLabForm(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Ej. Sin presencia de anemia, recuento plaquetario normal..."
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none text-slate-900"
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end items-center gap-2 pt-1 border-t border-blue-200">
                          <button
                            type="button"
                            onClick={() => setIsAddingLab(false)}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all active:scale-95"
                          >
                            Guardar en Expediente
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Labs Gallery & List */}
                    {dossierLabs.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                        <FolderOpen className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="font-bold text-xs text-slate-700">Sin estudios de laboratorio adjuntos</div>
                        <p className="text-[11px] text-slate-500">
                          Haz clic en "+ Adjuntar Foto / PDF de Laboratorio" para subir análisis, rayos X o reportes clínicos.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {dossierLabs.map((lab) => (
                          <div 
                            key={lab.id}
                            className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 uppercase tracking-wide">
                                  {lab.category}
                                </span>
                                <h5 className="font-extrabold text-sm text-slate-900 mt-1">
                                  {lab.title}
                                </h5>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span>{lab.date}</span>
                                  {lab.performedBy && <span>&bull; {lab.performedBy}</span>}
                                </div>
                              </div>

                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border shrink-0 ${
                                lab.fileType === 'pdf' 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                {lab.fileType === 'pdf' ? 'DOCUMENTO PDF' : 'IMAGEN'}
                              </span>
                            </div>

                            {/* Media preview block */}
                            <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                              {lab.fileType === 'pdf' ? (
                                <div className="p-6 text-center bg-slate-50 flex flex-col items-center justify-center space-y-2">
                                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-sm border border-rose-200 shadow-2xs">
                                    PDF
                                  </div>
                                  <span className="font-mono text-xs font-semibold text-slate-700 truncate max-w-full px-4">
                                    {lab.fileName || 'Reporte_Laboratorio.pdf'}
                                  </span>
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewLabItem(lab)}
                                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> Ver PDF
                                    </button>
                                    <a
                                      href={lab.fileUrl}
                                      download={lab.fileName || 'Reporte_Laboratorio.pdf'}
                                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                                    >
                                      <Download className="w-3.5 h-3.5" /> Descargar
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <div className="group relative h-48 w-full bg-slate-900/5">
                                  <img 
                                    src={lab.fileUrl} 
                                    alt={lab.title} 
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setPreviewLabItem(lab)}
                                  />
                                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewLabItem(lab)}
                                      className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-black inline-flex items-center gap-1 shadow-md hover:bg-slate-100 cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-blue-600" /> Ver en Grande
                                    </button>
                                    <a
                                      href={lab.fileUrl}
                                      download={lab.fileName || 'Foto_Laboratorio.jpg'}
                                      className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-black inline-flex items-center gap-1 shadow-md hover:bg-slate-100 cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5 text-emerald-600" /> Descargar
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Notes / Conclusion */}
                            {lab.notes && (
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                                <span className="font-bold text-slate-900 block text-[10px] uppercase">Observaciones:</span>
                                {lab.notes}
                              </div>
                            )}

                            {/* Delete Action */}
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Eliminar el estudio "${lab.title}" del expediente?`)) {
                                    deleteLabResult(dossierPet.id, lab.id);
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                Eliminar Estudio
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: VACUNAS & CARTILLA */}
                {activeDossierTab === 'vaccines' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          Esquema de Vacunación e Inmunizaciones
                        </h4>
                        <p className="text-xs text-slate-500">
                          Dosis aplicadas registradas en la cartilla oficial y Cruce Fronterizo CBP
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedPetForDossier(null);
                          if (openPetPassport) {
                            openPetPassport(dossierPet.id);
                          } else {
                            setActiveTab('passport');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        Abrir Cartilla Oficial &rarr;
                      </button>
                    </div>

                    {dossierVaccines.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                        <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="font-bold text-xs text-slate-700">Sin vacunas registradas en el sistema</div>
                        <p className="text-[11px] text-slate-500">
                          Puedes registrar vacunas oficiales (Rabia, Séxtuple, Bordetella) desde la sección de Cartilla Oficial.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedPetForDossier(null);
                            if (openPetPassport) openPetPassport(dossierPet.id);
                            else setActiveTab('passport');
                          }}
                          className="px-4 py-2 bg-amber-400 text-amber-950 font-bold text-xs rounded-xl shadow-xs"
                        >
                          Ir a Cartilla Oficial
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dossierVaccines.map((vac) => (
                          <div key={vac.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-slate-900">{vac.vaccineName}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Vigente
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 space-y-1">
                              <div><strong>Fabricante / Lote:</strong> {vac.manufacturer} &bull; {vac.lotNumber}</div>
                              <div><strong>Aplicación:</strong> {vac.appliedDate}</div>
                              <div><strong>Próximo refuerzo:</strong> {vac.dueDate}</div>
                              <div><strong>Médico:</strong> {vac.vetName}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: CIRUGÍAS */}
                {activeDossierTab === 'surgeries' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          Historial Quirúrgico & Procedimientos
                        </h4>
                        <p className="text-xs text-slate-500">
                          Intervenciones de quirófano, esterilizaciones y procedimientos mayores
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPetForDossier(null);
                          setActiveTab('surgeries');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                      >
                        Ver Quirófano &rarr;
                      </button>
                    </div>

                    {dossierSurgeries.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                        <Scissors className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="font-bold text-xs text-slate-700">Sin cirugías registradas</div>
                        <p className="text-[11px] text-slate-500">
                          Este paciente no tiene procedimientos quirúrgicos pasados ni programados.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dossierSurgeries.map((surg) => (
                          <div key={surg.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">{surg.procedure}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-950">
                                {surg.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600">
                              <div><strong>Fecha:</strong> {surg.date} {surg.time && `&bull; ${surg.time}`}</div>
                              <div><strong>Quirófano / Sala:</strong> {surg.room || 'Quirófano Principal'}</div>
                              {surg.notes && <div className="mt-1 text-slate-500 italic">{surg.notes}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: HOSPITALIZACIÓN */}
                {activeDossierTab === 'hospital' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Estado de Hospitalización & Jaulas
                      </h4>
                      <p className="text-xs text-slate-500">
                        Estancia clínica y monitoreo en piso de hospitalización
                      </p>
                    </div>

                    {dossierCage ? (
                      <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-rose-950 flex items-center gap-2">
                            <Building className="w-5 h-5 text-rose-800" />
                            Paciente Actualmente Hospitalizado en Jaula {dossierCage.code}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-600 text-white animate-pulse">
                            En Internamiento
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 space-y-1">
                          <div><strong>Tipo de Jaula:</strong> {dossierCage.type}</div>
                          <div><strong>Ubicación:</strong> {dossierCage.location}</div>
                          {dossierCage.currentOccupant?.reason && (
                            <div><strong>Motivo de Ingreso:</strong> {dossierCage.currentOccupant.reason}</div>
                          )}
                          {dossierCage.currentOccupant?.intakeTime && (
                            <div><strong>Hora de Ingreso:</strong> {dossierCage.currentOccupant.intakeTime}</div>
                          )}
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              setSelectedPetForDossier(null);
                              setActiveTab('cages');
                            }}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs"
                          >
                            Ir a Monitoreo de Jaulas &rarr;
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                        <Building className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="font-bold text-xs text-slate-700">Paciente Ambulatorio (No Hospitalizado)</div>
                        <p className="text-[11px] text-slate-500">
                          {dossierPet.name} no se encuentra actualmente en ninguna jaula de hospitalización.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedPetForDossier(null);
                            setActiveTab('cages');
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
                        >
                          Ver Jaulas Disponibles
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FOOTER ACTIONS */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsPrintPreviewOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-rose-950" />
                    Exportar / Imprimir PDF
                  </button>

                  <button
                    onClick={() => {
                      const id = dossierPet.id;
                      setSelectedPetForDossier(null);
                      if (openPetPassport) openPetPassport(id);
                      else setActiveTab('passport');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-900" />
                    Ver Cartilla Oficial
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPetForDossier(null);
                      setActiveTab('agenda');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Agendar Cita
                  </button>
                </div>

                <button
                  onClick={() => setSelectedPetForDossier(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  Cerrar Expediente
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: VISTA PREVIA Y EXPORTACIÓN EN PDF / IMPRESIÓN OFICIAL */}
      {/* ========================================================================= */}
      {isPrintPreviewOpen && selectedPetForDossier && (() => {
        const dossierPet = pets.find(p => p.id === selectedPetForDossier.id) || selectedPetForDossier;
        const dossierOwner = clients.find(c => c.id === dossierPet.clientId);
        const dossierVaccines = vaccinations.filter(v => v.petId === dossierPet.id || v.petName?.toLowerCase() === dossierPet.name.toLowerCase());
        const dossierSurgeries = surgeries.filter(s => s.petId === dossierPet.id || s.petName?.toLowerCase() === dossierPet.name.toLowerCase());
        const notes = dossierPet.clinicalNotes || [];
        const dossierLabs = dossierPet.labResults || [];
        const reportFolio = `EXP-${dossierPet.id.replace('pet-', '').toUpperCase()}-${new Date().getFullYear()}`;
        const currentDate = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-6 animate-fadeIn">
            {/* Top floating bar (hidden during print) */}
            <div className="no-print max-w-4xl w-full bg-slate-900 text-white rounded-2xl p-4 mb-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 sticky top-4 z-20 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5 text-rose-950" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    Resumen Clínico Oficial &bull; {dossierPet.name}
                    <span className="text-[10px] font-mono bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-slate-700">
                      FOLIO: {reportFolio}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Formato membretado listo para imprimir o descargar como archivo PDF oficial
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-rose-950" />
                  Imprimir / Guardar en PDF
                </button>
                <button
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar Vista Previa
                </button>
              </div>
            </div>

            {/* Printable Document Paper */}
            <div className="printable-clinical-report bg-white text-slate-900 max-w-4xl w-full p-6 sm:p-10 rounded-3xl shadow-2xl border-2 border-slate-200 print:border-none print:shadow-none print:p-0 print:rounded-none space-y-5 my-auto">
              
              {/* OFFICIAL CLINIC LETTERHEAD */}
              <div className="border-b-2 border-slate-900 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <BrandLogo className="w-14 h-14" />
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                        SERVICIO VETERINARIO CALIFORNIA
                      </h1>
                      <p className="text-xs font-bold text-rose-900 uppercase tracking-widest">
                        Todo para su mascota &bull; Tijuana, B.C.
                      </p>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Matriz: Calle 3ra #7184, Zona Centro, Tijuana &bull; Tel. (664) 685-8512
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right self-stretch sm:self-auto space-y-1 text-xs border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <div className="inline-block font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-md border border-slate-300">
                      FOLIO: {reportFolio}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Fecha de Emisión: <strong>{currentDate}</strong>
                    </div>
                    <div className="text-[10px] text-rose-900 font-bold uppercase">
                      Documento Oficial Certificado
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                  <span><strong>Granero California:</strong> Calle 3ra #7160 (Tel. 664-688-2875)</span>
                  <span><strong>Acua-Vet GDL:</strong> Av. Mutualismo #887 (Tel. 664-685-9961)</span>
                  <span><strong>Registro Sanitario:</strong> REG-VET-TJ-2026</span>
                </div>
              </div>

              {/* TITLE BANNER */}
              <div className="text-center bg-slate-900 text-white py-2 px-4 rounded-xl">
                <h2 className="text-sm sm:text-base font-black tracking-wider uppercase">
                  RESUMEN DE EXPEDIENTE CLÍNICO VETERINARIO
                </h2>
                <span className="text-[10px] text-amber-400 font-bold tracking-wide uppercase">
                  OFFICIAL VETERINARY CLINICAL SUMMARY & HEALTH RECORD &bull; CBP TRAVEL COMPLIANT
                </span>
              </div>

              {/* SECTION I: PATIENT & OWNER */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                
                {/* Left 8 cols: Patient Details */}
                <div className="md:col-span-8 p-4 rounded-2xl border border-slate-300 bg-slate-50/40 space-y-2 text-xs">
                  <div className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>I. DATOS DE IDENTIDAD DEL PACIENTE / PATIENT IDENTIFICATION</span>
                    <span className="font-mono text-[10px] font-bold text-slate-600">ID: {dossierPet.id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
                    <div>
                      <span className="font-bold text-slate-500 block text-[10px]">Nombre del Paciente / Name:</span>
                      <span className="font-black text-sm text-slate-900">{dossierPet.name}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block text-[10px]">Especie / Species:</span>
                      <span className="font-bold text-slate-800">{dossierPet.species}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block text-[10px]">Raza / Breed:</span>
                      <span className="font-semibold text-slate-800">{dossierPet.breed}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block text-[10px]">Sexo / Sex:</span>
                      <span className="font-semibold text-slate-800">{dossierPet.sex}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block text-[10px]">Edad / Age:</span>
                      <span className="font-semibold text-slate-800">{dossierPet.ageYears} años</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block text-[10px]">Peso Actual / Weight:</span>
                      <span className="font-bold text-slate-900">{dossierPet.weightKg} kg</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-bold text-slate-500 block text-[10px]">Color y Señas Particulares / Markings:</span>
                      <span className="font-semibold text-slate-800">{dossierPet.color || 'No especificadas'}</span>
                    </div>
                  </div>

                  {/* Microchip Badge */}
                  <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between">
                    <span className="font-bold text-[11px] text-amber-950">
                      Microchip Identificador (ISO 11784/11785 CBP EE.UU.):
                    </span>
                    <span className="font-mono font-black text-xs text-rose-950">
                      {dossierPet.microchip || 'Pendiente / Sin registrar'}
                    </span>
                  </div>

                  {dossierPet.allergies && dossierPet.allergies !== 'Ninguna' && (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-[11px] font-bold">
                      ⚠️ Alergias o Condiciones Crónicas: {dossierPet.allergies}
                    </div>
                  )}
                </div>

                {/* Right 4 cols: Photo */}
                <div className="md:col-span-4 p-3 rounded-2xl border border-slate-300 flex flex-col items-center justify-center bg-slate-50/40">
                  {dossierPet.photoUrl ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <img 
                        src={dossierPet.photoUrl} 
                        alt={dossierPet.name} 
                        className="w-full h-40 object-cover rounded-xl border border-slate-300 shadow-2xs" 
                      />
                      <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">
                        Fotografía Oficial de Registro
                      </span>
                    </div>
                  ) : (
                    <div className="text-center p-4 text-slate-400">
                      <PawPrint className="w-12 h-12 mx-auto text-slate-300 mb-1" />
                      <span className="text-[10px] font-bold block uppercase text-slate-500">Sin Fotografía</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION II: OWNER DETAILS */}
              <div className="p-3.5 rounded-2xl border border-slate-300 bg-slate-50/20 space-y-1.5 text-xs">
                <div className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  II. PROPIETARIO / RESPONSABLE LEGAL (OWNER INFORMATION)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px]">Nombre Completo / Owner Name:</span>
                    <span className="font-bold text-slate-900">{dossierOwner ? dossierOwner.name : 'Cliente Registrado'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px]">Teléfono / Phone Number:</span>
                    <span className="font-semibold text-slate-800">{dossierOwner?.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px]">Domicilio / Address:</span>
                    <span className="font-semibold text-slate-800">{dossierOwner?.address || 'Tijuana, B.C.'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION III: VACCINES TABLE */}
              <div className="space-y-1.5 text-xs">
                <div className="font-black text-xs uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>III. ESQUEMA DE VACUNACIÓN / VACCINATION RECORD</span>
                  <span className="text-[10px] font-semibold text-slate-500">Aprobado para Cruce Fronterizo CBP</span>
                </div>

                {dossierVaccines.length === 0 ? (
                  <div className="p-2.5 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs">
                    Sin vacunas registradas en la cartilla digital al momento de esta emisión.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-900 text-[10px] uppercase">
                        <th className="p-2 border-r border-slate-300">Vacuna / Biological</th>
                        <th className="p-2 border-r border-slate-300">Fabricante & Lote / Lot</th>
                        <th className="p-2 border-r border-slate-300">Aplicación / Date</th>
                        <th className="p-2 border-r border-slate-300">Vencimiento / Due Date</th>
                        <th className="p-2">Médico / Cédula</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dossierVaccines.map((v, idx) => (
                        <tr key={idx} className="border-b border-slate-200 even:bg-slate-50/50">
                          <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{v.vaccineName}</td>
                          <td className="p-2 font-mono text-[11px] border-r border-slate-200">{v.manufacturer} &bull; {v.lotNumber}</td>
                          <td className="p-2 font-semibold border-r border-slate-200">{v.appliedDate}</td>
                          <td className="p-2 font-bold text-rose-950 border-r border-slate-200">{v.dueDate}</td>
                          <td className="p-2 text-slate-600 text-[11px]">{v.vetName || 'Médico Veterinario Autorizado'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* SECTION IV: CONSULTATION NOTES */}
              <div className="space-y-1.5 text-xs">
                <div className="font-black text-xs uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1">
                  IV. HISTORIAL DE CONSULTAS, CONSTANTES VITALES & TRATAMIENTOS
                </div>

                {notes.length === 0 ? (
                  <div className="p-2.5 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs">
                    No se registran notas médicas en el historial clínico.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notes.map((n, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl border border-slate-300 bg-white space-y-1 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                          <span className="font-black text-slate-900">{n.reason}</span>
                          <span className="font-mono text-slate-500 text-[11px] font-bold">{n.date}</span>
                        </div>
                        {n.vitals && (
                          <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-semibold text-slate-700 bg-slate-50 p-1.5 rounded-md border border-slate-200">
                            {n.vitals.temp && <span>🌡️ Temp: <strong>{n.vitals.temp}</strong></span>}
                            {n.vitals.weight && <span>⚖️ Peso: <strong>{n.vitals.weight}</strong></span>}
                            {n.vitals.heartRate && <span>❤️ F.C.: <strong>{n.vitals.heartRate}</strong></span>}
                            <span className="text-slate-400">|</span>
                            <span>Médico: {n.vet || 'Médico Veterinario de Guardia'}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-0.5">
                          <div>
                            <strong className="text-slate-700">Diagnóstico:</strong> {n.diagnosis}
                          </div>
                          <div>
                            <strong className="text-rose-950">Tratamiento Indicado:</strong> {n.treatment}
                          </div>
                        </div>
                        {n.nextCheckup && (
                          <div className="text-[10px] text-emerald-800 font-semibold pt-0.5">
                            Próxima cita de revisión programada: {n.nextCheckup}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION V: SURGERIES IF ANY */}
              {dossierSurgeries.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <div className="font-black text-xs uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1">
                    V. PROCEDIMIENTOS QUIRÚRGICOS
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dossierSurgeries.map((s, idx) => (
                      <div key={idx} className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-[11px]">
                        <div className="font-bold text-slate-900">{s.procedure}</div>
                        <div className="text-slate-600">Fecha: {s.date} {s.time && `&bull; ${s.time}`}</div>
                        <div className="text-slate-500 font-medium">Estado: {s.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION VI: LAB RESULTS & ATTACHMENTS IF ANY */}
              {dossierLabs.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <div className="font-black text-xs uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                    <span>VI. RESULTADOS DE LABORATORIO & GABINETE / CLINICAL LAB STUDIES</span>
                    <span className="text-[10px] font-semibold text-slate-500">Expediente Digital Integrado</span>
                  </div>
                  <div className="space-y-2">
                    {dossierLabs.map((l, idx) => (
                      <div key={idx} className="p-2 rounded-xl border border-slate-300 bg-slate-50/50 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{l.title}</span>
                          <span className="text-[10px] font-mono font-bold text-slate-600">{l.date}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-2">
                          <span className="font-semibold text-blue-900">{l.category}</span>
                          <span>&bull;</span>
                          <span>Tipo: {l.fileType === 'pdf' ? 'Reporte PDF' : 'Imagen Fotográfica'} ({l.fileName})</span>
                          {l.performedBy && (
                            <>
                              <span>&bull;</span>
                              <span>Realizado por: {l.performedBy}</span>
                            </>
                          )}
                        </div>
                        {l.notes && (
                          <div className="text-[11px] text-slate-700 italic bg-white p-1.5 rounded-lg border border-slate-200">
                            <strong>Conclusión:</strong> {l.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OFFICIAL SIGNATURE & STAMP BLOCK */}
              <div className="pt-6 border-t-2 border-slate-900">
                <div className="grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="flex flex-col items-center justify-end">
                    <div className="w-56 border-b-2 border-slate-900 mb-2"></div>
                    <span className="font-black text-slate-900 text-xs">MÉDICO VETERINARIO RESPONSABLE</span>
                    <span className="text-[11px] text-slate-600">C.M.V.Z. &bull; Céd. Prof. 8492019-BC</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Servicio Veterinario California</span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-400 rounded-2xl min-h-[90px] bg-slate-50/50">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                      SELLO OFICIAL DE LA CLÍNICA
                    </span>
                    <span className="text-[9px] text-slate-400 mt-1 uppercase">
                      Servicio Veterinario California &bull; Tijuana B.C.
                    </span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 mt-5 font-medium">
                  Este resumen médico veterinario certifica el estado de salud y registro clínico del paciente a la fecha de emisión. Documento expedido por Servicio Veterinario California para fines médicos, informativos o de cruce fronterizo hacia los Estados Unidos.
                </div>
              </div>

            </div>
          </div>
        );
      })()}
      {/* ========================================================================= */}
      {/* MODAL: VISOR DE FOTO O PDF DE LABORATORIO A PANTALLA COMPLETA */}
      {/* ========================================================================= */}
      {previewLabItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg text-xs font-black ${
                  previewLabItem.fileType === 'pdf' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {previewLabItem.fileType === 'pdf' ? 'PDF' : 'IMG'}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white truncate max-w-md">
                    {previewLabItem.title}
                  </h4>
                  <div className="text-[11px] text-slate-300">
                    {previewLabItem.category} &bull; {previewLabItem.date}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewLabItem.fileUrl}
                  download={previewLabItem.fileName || 'estudio_laboratorio'}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewLabItem(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center">
              {previewLabItem.fileType === 'pdf' ? (
                <iframe
                  src={previewLabItem.fileUrl}
                  title={previewLabItem.title}
                  className="w-full h-[70vh] rounded-xl border border-slate-300 bg-white shadow-inner"
                />
              ) : (
                <div className="max-h-[72vh] flex items-center justify-center">
                  <img
                    src={previewLabItem.fileUrl}
                    alt={previewLabItem.title}
                    className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-300"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer (Notes) */}
            {previewLabItem.notes && (
              <div className="p-3 bg-white border-t border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900">Observaciones del estudio:</strong> {previewLabItem.notes}
                </div>
                {previewLabItem.performedBy && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    {previewLabItem.performedBy}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
