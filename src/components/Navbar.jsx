import React from 'react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { getLocalDateString } from '../lib/dateUtils.js';
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
  Phone,
  LogOut,
  UserCheck,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export function Navbar() {
  const { 
    activeTab, 
    setActiveTab, 
    exportBackup, 
    resetToDefaults, 
    appointments, 
    rescues, 
    cages = [],
    currentUser,
    logout,
    cloudStatus,
    lastSyncedAt,
    syncNow
  } = useApp();

  const todayStr = getLocalDateString();
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
      <div className="bg-amber-400 text-amber-950 px-3 sm:px-4 py-1 text-[11px] sm:text-xs font-semibold flex items-center justify-between border-b border-amber-300">
        <div className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-900 inline-block shrink-0"></span>
          <span className="truncate font-bold">Matriz Tijuana: Calle 3ra #7184, Zona Centro</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a 
            href="https://wa.me/5216634359988" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-900 px-2 py-0.5 rounded-md transition-colors text-[10px] sm:text-xs font-bold"
          >
            <MessageCircle className="w-3 h-3 text-emerald-800 shrink-0" />
            <span className="hidden sm:inline">WhatsApp: (663) 435-9988</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Main Apple-like Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 sm:gap-4 cursor-pointer min-w-0" onClick={() => setActiveTab('agenda')}>
            <BrandLogo showText={true} />
          </div>

          {/* Quick Data Actions & User Session */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Supabase Cloud Sync Badge */}
            <button
              type="button"
              onClick={syncNow}
              title={
                cloudStatus === 'synced'
                  ? `Conectado a la nube de Supabase${lastSyncedAt ? ` (Última subida: ${lastSyncedAt})` : ''}. Haz clic para sincronizar ahora.`
                  : cloudStatus === 'syncing'
                  ? 'Subiendo cambios a la nube de Supabase...'
                  : 'Haz clic para reintentar conexión con Supabase'
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-xl border shadow-xs transition-all active:scale-95 cursor-pointer ${
                cloudStatus === 'synced'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : cloudStatus === 'syncing'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
              }`}
            >
              {cloudStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
              ) : cloudStatus === 'synced' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              )}
              <Cloud className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
              <span className="hidden md:inline">
                {cloudStatus === 'syncing'
                  ? 'Subiendo a Supabase...'
                  : cloudStatus === 'synced'
                  ? 'Supabase: En Nube'
                  : 'Reintentar Nube'}
              </span>
            </button>

            <button
              onClick={exportBackup}
              title="Descargar respaldo JSON de la base de datos"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all hover:border-slate-300 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Respaldar BD</span>
            </button>

            <button
              onClick={resetToDefaults}
              title="Reiniciar datos de demostración"
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* User Session Badge & Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200">
              <div className="hidden xl:flex flex-col text-right">
                <span className="text-xs font-black text-slate-900 leading-tight">
                  {currentUser?.name || 'Administrador'}
                </span>
                <span className="text-[10px] font-bold text-[#7A1416]">
                  {currentUser?.role || 'Personal Clínico'}
                </span>
              </div>

              <button
                onClick={logout}
                title="Cerrar sesión"
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Salir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Apple Style Segmented Tab Controls (Mobile & Tablet touch-optimized) */}
        <div className="py-2 overflow-x-auto flex items-center justify-start sm:justify-center border-t border-slate-200/50 -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-none">
          <nav className="inline-flex p-1 rounded-2xl bg-slate-200/60 backdrop-blur-md shadow-inner gap-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2 text-xs font-semibold rounded-xl transition-all duration-200 select-none min-h-[40px] sm:min-h-[38px] active:scale-95 ${
                    isActive
                      ? 'bg-white text-rose-950 shadow-sm shadow-slate-300/40 ring-1 ring-slate-900/5 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-900' : 'text-slate-500'}`} />
                  <span className="whitespace-nowrap">{tab.label}</span>
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
