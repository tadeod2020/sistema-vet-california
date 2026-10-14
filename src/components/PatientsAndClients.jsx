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
  Mail, 
  MapPin, 
  FileText, 
  Calendar,
  XCircle,
  AlertCircle
} from 'lucide-react';

export function PatientsAndClients() {
  const { clients, pets, addClient, addPet, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | frequent | regular
  const [selectedClientForPet, setSelectedClientForPet] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);

  // Form Client State
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

  // Form Pet State
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Canino',
    breed: '',
    ageYears: '',
    sex: 'Macho',
    weightKg: '',
    color: '',
    allergies: '',
    microchip: '',
    notes: ''
  });

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) ||
      (client.tag && client.tag.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterType === 'frequent') return matchesSearch && client.isFrequent;
    if (filterType === 'regular') return matchesSearch && !client.isFrequent;
    return matchesSearch;
  });

  const handleCreateClient = (e) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.phone) {
      alert('Nombre y teléfono son obligatorios');
      return;
    }
    // Clean whatsapp number
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

  const openAddPetModal = (client) => {
    setSelectedClientForPet(client);
    setIsPetModalOpen(true);
  };

  const handleCreatePet = (e) => {
    e.preventDefault();
    if (!petForm.name || !selectedClientForPet) return;

    addPet({
      ...petForm,
      clientId: selectedClientForPet.id,
      ageYears: Number(petForm.ageYears) || 1,
      weightKg: Number(petForm.weightKg) || 5
    });

    setIsPetModalOpen(false);
    setPetForm({
      name: '',
      species: 'Canino',
      breed: '',
      ageYears: '',
      sex: 'Macho',
      weightKg: '',
      color: '',
      allergies: '',
      microchip: '',
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="glass-card rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-sm">
            <Users className="w-6 h-6 text-rose-900" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Directorio de Clientes & Mascotas
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
                {clients.length} Propietarios &bull; {pets.length} Mascotas
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Gestión de expedientes familiares, rescatistas y dueños con múltiples mascotas.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsClientModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4 text-rose-900" />
          Nuevo Cliente / Rescatista
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o etiqueta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none shadow-xs"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterType === 'all' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setFilterType('frequent')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterType === 'frequent' 
                ? 'bg-amber-400 text-amber-950 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
            Clientes Frecuentes / Rescatistas
          </button>
        </div>
      </div>

      {/* Clients Cards Grid */}
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
              {/* Header with Name & Badges */}
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
                    <span className="flex items-center gap-1">
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

                {/* WhatsApp button */}
                {client.whatsapp && (
                  <a
                    href={`https://wa.me/${client.whatsapp}?text=Hola%20${encodeURIComponent(client.name)},%20te%20escribimos%20de%20Servicio%20Veterinario%20California...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                )}
              </div>

              {client.notes && (
                <div className="mt-2.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl italic border border-slate-100">
                  "{client.notes}"
                </div>
              )}

              {/* Pets Section for this client */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <PawPrint className="w-3.5 h-3.5 text-rose-900" />
                    Mascotas Registradas ({clientPets.length})
                  </span>
                  <button
                    onClick={() => openAddPetModal(client)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 px-2 py-0.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    Agregar Mascota
                  </button>
                </div>

                {clientPets.length === 0 ? (
                  <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Sin mascotas asignadas aún
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {clientPets.map(pet => (
                      <div 
                        key={pet.id}
                        className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                              {pet.name}
                              <span className="text-[10px] font-medium text-slate-500">
                                ({pet.species})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {pet.breed} &bull; {pet.ageYears} años &bull; {pet.weightKg} kg
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {pet.sex} &bull; {pet.color}
                            </div>
                          </div>
                        </div>

                        {pet.allergies && pet.allergies !== 'Ninguna' && pet.allergies !== 'Ninguna conocida' && (
                          <div className="mt-1.5 text-[10px] text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" />
                            {pet.allergies}
                          </div>
                        )}

                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-mono">
                            {pet.microchip ? `ID: ${pet.microchip.slice(-6)}` : 'Sin microchip'}
                          </span>
                          <button
                            onClick={() => setActiveTab('passport')}
                            className="font-bold text-amber-900 hover:text-rose-900 hover:underline"
                          >
                            Ver Cartilla / Travel &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Registrar Nuevo Cliente */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Registrar Cliente / Rescatista</h3>
                  <p className="text-xs text-slate-500">Nuevo propietario de mascotas en el sistema</p>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp (Para avisos)</label>
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

              {/* Cliente Frecuente Toggle */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    Marcar como Cliente Frecuente / Rescatista
                  </div>
                  <div className="text-[11px] text-amber-900/80">
                    Para dueños con múltiples mascotas, viajes frecuentes o rescatistas independientes.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={clientForm.isFrequent}
                  onChange={(e) => setClientForm(prev => ({ ...prev, isFrequent: e.target.checked }))}
                  className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
              </div>

              {clientForm.isFrequent && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Etiqueta Personalizada</label>
                  <input
                    type="text"
                    placeholder="Ej. Rescatista Independiente, Viajero Frecuente a California..."
                    value={clientForm.tag}
                    onChange={(e) => setClientForm(prev => ({ ...prev, tag: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notas Médicas o Generales</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre hábitos o preferencias..."
                  value={clientForm.notes}
                  onChange={(e) => setClientForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
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
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agregar Mascota a Cliente */}
      {isPetModalOpen && selectedClientForPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                  <PawPrint className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Nueva Mascota para {selectedClientForPet.name}
                  </h3>
                  <p className="text-xs text-slate-500">Expediente clínico veterinario</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePet} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de Mascota *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Max, Luna, Toby..."
                    value={petForm.name}
                    onChange={(e) => setPetForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Especie</label>
                  <select
                    value={petForm.species}
                    onChange={(e) => setPetForm(prev => ({ ...prev, species: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="Canino">Canino (Perro)</option>
                    <option value="Felino">Felino (Gato)</option>
                    <option value="Ave">Ave</option>
                    <option value="Roedor / Conejo">Roedor / Conejo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Raza</label>
                  <input
                    type="text"
                    placeholder="Ej. Golden, Poodle, Mestizo..."
                    value={petForm.breed}
                    onChange={(e) => setPetForm(prev => ({ ...prev, breed: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sexo / Esterilización</label>
                  <select
                    value={petForm.sex}
                    onChange={(e) => setPetForm(prev => ({ ...prev, sex: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                    <option value="Macho (Castrado)">Macho (Castrado)</option>
                    <option value="Hembra (Esterilizada)">Hembra (Esterilizada)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Edad (Años)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ej. 2"
                    value={petForm.ageYears}
                    onChange={(e) => setPetForm(prev => ({ ...prev, ageYears: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej. 14.5"
                    value={petForm.weightKg}
                    onChange={(e) => setPetForm(prev => ({ ...prev, weightKg: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Color de Pelaje</label>
                  <input
                    type="text"
                    placeholder="Ej. Canela / Negro"
                    value={petForm.color}
                    onChange={(e) => setPetForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Microchip (Para viaje)</label>
                  <input
                    type="text"
                    placeholder="Ej. 98514100..."
                    value={petForm.microchip}
                    onChange={(e) => setPetForm(prev => ({ ...prev, microchip: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alergias o Condiciones</label>
                  <input
                    type="text"
                    placeholder="Ej. Alergia a pulgas, ninguna..."
                    value={petForm.allergies}
                    onChange={(e) => setPetForm(prev => ({ ...prev, allergies: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  Registrar Mascota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
