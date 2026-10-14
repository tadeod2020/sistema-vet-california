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
  ShieldCheck
} from 'lucide-react';

export function PatientsAndClients() {
  const { clients, pets, addClient, registerPetDirect, setActiveTab } = useApp();

  const [activeView, setActiveView] = useState('pets'); // 'pets' | 'clients'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | frequent | regular

  // Modal states
  const [isQuickPetModalOpen, setIsQuickPetModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Quick Pet Form (Only 3 required fields: ownerPhone, ownerName, petName)
  const [quickPetForm, setQuickPetForm] = useState({
    ownerPhone: '',
    ownerName: '',
    petName: '',
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
            return (
              <div
                key={pet.id}
                className="glass-card rounded-2xl p-4.5 border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Pet Name & Species Badge */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black text-slate-900">{pet.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-200">
                          {pet.species}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">
                        {pet.breed} &bull; {pet.sex}
                      </div>
                    </div>

                    {owner?.isFrequent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 flex items-center gap-1 shadow-xs">
                        <Star className="w-2.5 h-2.5 fill-amber-950" /> Frecuente
                      </span>
                    )}
                  </div>

                  {/* Owner Information (Essential contact) */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {owner ? owner.name : 'Dueño sin registrar'}
                      </span>
                      {owner?.whatsapp && (
                        <a
                          href={`https://wa.me/${owner.whatsapp}?text=Hola%20${encodeURIComponent(owner.name)},%20te%20escribimos%20de%20Servicio%20Veterinario%20California%20sobre%20tu%20mascota%20${encodeURIComponent(pet.name)}...`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md hover:bg-emerald-200 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" /> WhatsApp
                        </a>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
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
                      <span className="text-slate-400 block text-[10px]">Color:</span>
                      <span className="font-semibold">{pet.color}</span>
                    </div>
                  </div>

                  {pet.allergies && pet.allergies !== 'Ninguna' && pet.allergies !== 'Ninguna conocida' && (
                    <div className="mt-2 text-[10px] text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" /> Alergia: {pet.allergies}
                    </div>
                  )}
                </div>

                {/* Footer action */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {pet.microchip ? `Chip: ${pet.microchip.slice(-6)}` : 'Sin chip'}
                  </span>
                  <button
                    onClick={() => setActiveTab('passport')}
                    className="font-bold text-xs text-rose-900 hover:text-amber-600 transition-colors flex items-center gap-1"
                  >
                    Ver Cartilla &rarr;
                  </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-slideUp">
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
    </div>
  );
}
