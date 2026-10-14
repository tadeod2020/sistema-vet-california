import React from 'react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { 
  CalendarDays, 
  Users, 
  HeartHandshake, 
  Activity, 
  FileText, 
  Home,
  Download, 
  RotateCcw,
  MessageCircle,
  Phone
} from 'lucide-react';

export function Navbar() {
  const { activeTab, setActiveTab, exportBackup, resetToDefaults, appointments, rescues, cages = [] } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAptsCount = appointments.filter(a => a.date === todayStr && a.status !== 'Cancelada').length;
  const activeRescuesCount = rescues.filter(r => r.healthStatus !== 'Adoptado').length;
  const needsCleaningCount = cages.filter(c => c.status === 'Necesita Limpieza').length;

  const tabs = [
    { id: 'agenda', label: 'Agenda de Citas', icon: CalendarDays, badge: todayAptsCount > 0 ? `${todayAptsCount} hoy` : null },
    { id: 'clients', label: 'Clientes & Mascotas', icon: Users, badge: 'Frecuentes' },
    { id: 'cages', label: 'Jaulas & Hospital', icon: Home, badge: needsCleaningCount > 0 ? `${needsCleaningCount} x aseo` : null },
    { id: 'rescues', label: 'Rescates Callejeros', icon: HeartHandshake, badge: activeRescuesCount > 0 ? `${activeRescuesCount} activos` : null },
    { id: 'surgeries', label: 'Cirugías', icon: Activity },
    { id: 'passport', label: 'Cartilla & Pasaporte', icon: FileText, badge: 'Bilingüe' },
  ];

  return (
    <header className="sticky top-0 z-40 glass-nav transition-all">
      {/* Top Banner with clinic contact */}
      <div className="bg-amber-400 text-amber-950 px-4 py-1 text-xs font-semibold flex items-center justify-between border-b border-amber-300">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-900 inline-block"></span>
            Matriz Tijuana: Felipe Carrillo Puerto No. 7184, Calle 3ra, Zona Centro
          </span>
          <span className="hidden md:inline-block text-amber-900/60">&bull;</span>
          <span className="hidden md:flex items-center gap-1">
            <Phone className="w-3 h-3" /> (664) 685-8512
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href="https://wa.me/5216643949984" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-900 px-2 py-0.5 rounded-md transition-colors"
          >
            <MessageCircle className="w-3 h-3 text-emerald-800" />
            <span>WhatsApp Directo: (664) 394-9984</span>
          </a>
        </div>
      </div>

      {/* Main Apple-like Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab('agenda')}>
            <BrandLogo showText={true} />
          </div>

          {/* Quick Data Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportBackup}
              title="Descargar respaldo JSON de la base de datos"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all hover:border-slate-300 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Respaldar BD</span>
            </button>

            <button
              onClick={resetToDefaults}
              title="Reiniciar datos de demostración"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Apple Style Segmented Tab Controls */}
        <div className="py-2.5 overflow-x-auto flex items-center justify-start sm:justify-center border-t border-slate-200/50">
          <nav className="inline-flex p-1 rounded-2xl bg-slate-200/60 backdrop-blur-md shadow-inner gap-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 select-none ${
                    isActive
                      ? 'bg-white text-rose-950 shadow-sm shadow-slate-300/40 ring-1 ring-slate-900/5 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-900' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-amber-400 text-amber-950' 
                        : 'bg-slate-300/80 text-slate-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
