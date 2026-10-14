import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export function Login() {
  const { login, PROVISIONAL_CREDENTIALS } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const res = login(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Credenciales incorrectas');
        setIsLoading(false);
      }
    }, 400);
  };

  const fillProvisionalCredentials = () => {
    setEmail(PROVISIONAL_CREDENTIALS.email);
    setPassword(PROVISIONAL_CREDENTIALS.password);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-gradient-to-br from-amber-50/70 via-slate-50 to-rose-50/40 relative overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-300/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#7A1416]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex justify-center mb-1">
            <BrandLogo size="lg" showText={false} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              SERVICIO VETERINARIO CALIFORNIA
            </h1>
            <p className="text-xs sm:text-sm font-bold text-[#7A1416] tracking-wide mt-0.5 uppercase">
              Todo para su mascota &bull; Tijuana, B.C.
            </p>
          </div>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Acceso exclusivo al sistema clínico, agenda de citas, hospitalización y pasaporte de viaje.
          </p>
        </div>

        {/* Card Form */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 backdrop-blur-xl space-y-5">
          
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-500" />
              Iniciar Sesión
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Sistema Seguro
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@veterinariacalifornia.com"
                  autoComplete="email"
                  className="w-full px-4 py-2.5 text-sm bg-white/90 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-10 text-sm bg-white/90 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-950/30 border-t-amber-950 rounded-full animate-spin" />
                  <span>Verificando acceso...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema Clínico</span>
                  <ArrowRight className="w-4 h-4 text-rose-900" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Provisional Credentials Box */}
          <div className="mt-4 pt-4 border-t border-slate-200/70 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                Credenciales Provisionales:
              </span>
              <button
                type="button"
                onClick={fillProvisionalCredentials}
                className="text-[11px] font-bold text-[#7A1416] hover:text-rose-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer active:scale-95"
              >
                ⚡ Autorrellenar
              </button>
            </div>

            <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200 text-xs font-mono space-y-1 text-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-sans font-bold">Correo:</span>
                <span className="font-bold text-slate-800">{PROVISIONAL_CREDENTIALS.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-sans font-bold">Contraseña:</span>
                <span className="font-bold text-[#7A1416]">{PROVISIONAL_CREDENTIALS.password}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Clinic Location Footer */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-600">
            Matriz: Calle 3ra #7184, Zona Centro, Tijuana &bull; Tel. (664) 685-8512
          </p>
          <p className="text-slate-400">
            Sucursal Granero: Calle 4ta y Mutualismo &bull; Tijuana, Baja California
          </p>
        </div>

      </div>
    </div>
  );
}
