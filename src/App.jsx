import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Agenda } from './components/Agenda';
import { PatientsAndClients } from './components/PatientsAndClients';
import { Rescues } from './components/Rescues';
import { Surgeries } from './components/Surgeries';
import { VaccinationPassport } from './components/VaccinationPassport';
import { Cages } from './components/Cages';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  MapPin, 
  Phone, 
  MessageCircle, 
  ShieldCheck, 
  Heart,
  Plane
} from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
          <div className="glass-card rounded-3xl p-8 max-w-lg w-full text-center space-y-4 shadow-xl border border-rose-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mx-auto font-black text-xl">
              ⚠️
            </div>
            <h2 className="text-xl font-black text-slate-900">Ocurrió un detalle en la vista</h2>
            <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 font-mono text-left overflow-auto max-h-32">
              {this.state.error?.toString()}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  localStorage.removeItem('vet_california_system_v1');
                  window.location.reload();
                }}
                className="px-4 py-2 bg-amber-400 text-amber-950 font-bold text-xs rounded-xl shadow-xs"
              >
                Limpiar Caché y Recargar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Recargar Página
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainContent() {
  const { activeTab, notification } = useApp();

  return (
    <div className="min-h-full flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'agenda' && <Agenda />}
        {activeTab === 'clients' && <PatientsAndClients />}
        {activeTab === 'cages' && <Cages />}
        {activeTab === 'rescues' && <Rescues />}
        {activeTab === 'surgeries' && <Surgeries />}
        {activeTab === 'passport' && <VaccinationPassport />}
      </main>

      {/* Floating Apple-like Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-800 flex items-center gap-3 animate-slideUp">
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : notification.type === 'info' ? (
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <div className="text-xs font-semibold leading-tight flex-1">
            {notification.message}
          </div>
        </div>
      )}

      {/* Footer with Branches and Physical Locations */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm">
              SERVICIO VETERINARIO CALIFORNIA
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-rose-900 font-bold">Todo para su mascota</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span>
              <strong>Matriz:</strong> Calle 3ra #7184, Zona Centro, Tijuana &bull; Tel. (664) 685-8512
            </span>
            <span>
              <strong>Granero California:</strong> Calle 3ra #7160 &bull; Tel. (664) 688-2875
            </span>
            <span>
              <strong>Acua-Vet GDL:</strong> Av. Mutualismo #887 &bull; Tel. (664) 685-9961
            </span>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
            <span>Passport to Travel Bilingüe &bull; Tijuana B.C.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
