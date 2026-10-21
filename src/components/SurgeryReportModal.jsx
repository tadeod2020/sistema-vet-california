import React from 'react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { 
  Printer, 
  X, 
  Scissors, 
  Calendar, 
  User, 
  Activity, 
  ShieldCheck, 
  Stethoscope, 
  Syringe, 
  Clock, 
  FileText 
} from 'lucide-react';

export function SurgeryReportModal({ surgery, onClose }) {
  const { pets = [], clients = [] } = useApp();

  if (!surgery) return null;

  // Enlazar paciente y cliente para enriquecer datos del reporte
  const matchedPet = pets.find(p => p.id === surgery.petId) ||
    pets.find(p => surgery.patientName?.toLowerCase().startsWith(p.name.toLowerCase()));

  const matchedOwner = clients.find(c => c.id === (surgery.clientId || matchedPet?.clientId)) ||
    clients.find(c => surgery.ownerName && c.name?.toLowerCase().trim() === surgery.ownerName.toLowerCase().trim());

  const extraProcs = Array.isArray(surgery.additionalProcedures) ? surgery.additionalProcedures : [];
  const surgeryFolio = `QX-${String(surgery.id).replace('surg-', '').slice(-6).toUpperCase()}-${new Date().getFullYear()}`;
  const currentDate = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-6 animate-fadeIn">
      {/* Top Floating Control Bar (hidden during printing) */}
      <div className="no-print max-w-4xl w-full bg-slate-900 text-white rounded-2xl p-4 mb-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 sticky top-4 z-20 border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
            <Printer className="w-5 h-5 text-rose-950" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              Reporte Quirúrgico Oficial &bull; {surgery.patientName}
              <span className="text-[10px] font-mono bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-slate-700">
                FOLIO: {surgeryFolio}
              </span>
            </h3>
            <p className="text-[11px] text-slate-300">
              Formato membretado listo para imprimir en papel o guardar como archivo PDF
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
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Vista Previa
          </button>
        </div>
      </div>

      {/* Printable Paper Canvas */}
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
                FOLIO: {surgeryFolio}
              </div>
              <div className="text-[11px] text-slate-600">
                Fecha de Emisión: <strong>{currentDate}</strong>
              </div>
              <div className="text-[10px] text-rose-900 font-bold uppercase tracking-wider">
                Protocolo Quirúrgico y Hoja de Alta
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <span><strong>Granero California:</strong> Calle 3ra #7160 (Tel. 664-688-2875)</span>
            <span><strong>Acua-Vet GDL:</strong> Av. Mutualismo #887 (Tel. 664-685-9961)</span>
            <span><strong>Registro Sanitario:</strong> REG-VET-TJ-2026</span>
          </div>
        </div>

        {/* DOCUMENT TITLE */}
        <div className="text-center bg-slate-900 text-white py-2 px-4 rounded-xl">
          <h2 className="text-sm sm:text-base font-black tracking-wider uppercase">
            REPORTE DE INTERVENCIÓN QUIRÚRGICA Y PROTOCOLO ANESTÉSICO
          </h2>
        </div>

        {/* PATIENT & OWNER DATA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div className="space-y-1">
            <h3 className="font-black text-slate-900 text-sm border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-rose-900" />
              Datos del Paciente
            </h3>
            <div><strong>Nombre del Paciente:</strong> {surgery.patientName}</div>
            <div><strong>Especie / Raza:</strong> {matchedPet?.species || 'Canino'} &bull; {matchedPet?.breed || 'Sin especificar'}</div>
            <div><strong>Sexo / Edad:</strong> {matchedPet?.sex || 'N/E'} &bull; {matchedPet ? `${matchedPet.ageYears || 0} años ${matchedPet.ageMonths ? `${matchedPet.ageMonths} meses` : ''}` : 'N/E'}</div>
            <div><strong>Peso Registrado:</strong> {matchedPet?.weightKg ? `${matchedPet.weightKg} kg` : 'Evaluado en pesaje clínico'}</div>
            {matchedPet?.allergies && matchedPet.allergies !== 'Ninguna conocida' && (
              <div className="text-rose-700 font-semibold"><strong>Alergias Conocidas:</strong> {matchedPet.allergies}</div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-black text-slate-900 text-sm border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-700" />
              Propietario / Tutor Responsable
            </h3>
            <div><strong>Nombre del Propietario:</strong> {surgery.ownerName || matchedOwner?.name || 'Cliente Registrado'}</div>
            <div><strong>Teléfono de Contacto:</strong> {matchedOwner?.phone || 'Registrado en expediente'}</div>
            {matchedOwner?.address && <div><strong>Dirección:</strong> {matchedOwner.address}</div>}
            <div><strong>Tipo de Paciente:</strong> {surgery.patientType || 'Mascota con dueño'}</div>
          </div>
        </div>

        {/* SURGERY & TEAM DETAILS */}
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
            <div>
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                Procedimiento Quirúrgico Principal
              </span>
              <h4 className="text-base font-black text-slate-900">
                {surgery.procedure}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Estado</span>
              <span className="inline-block px-2.5 py-0.5 rounded-full font-black text-[11px] bg-slate-900 text-amber-300">
                {surgery.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <span className="text-slate-500 font-bold block text-[11px]">Fecha de Cirugía:</span>
              <span className="font-bold text-slate-900">{surgery.date}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[11px]">Cirujano Responsable:</span>
              <span className="font-bold text-slate-900">{surgery.surgeon}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[11px]">Anestesiología:</span>
              <span className="font-bold text-slate-900">{surgery.anesthetist || 'Especialista en Anestesiología'}</span>
            </div>
          </div>

          {extraProcs.length > 0 && (
            <div className="pt-2 border-t border-amber-200/70">
              <span className="font-bold text-amber-950 block text-[11px] mb-1">
                Procedimientos Complementarios Realizados:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {extraProcs.map((extra, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-amber-300 font-bold text-[10px] text-amber-950">
                    ✓ {extra}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CLINICAL PROTOCOLS: ANESTHESIA, PRE-OP, INTRA-OP, POST-OP */}
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Syringe className="w-3.5 h-3.5 text-rose-900" />
              Protocolo Anestésico y Premedicación:
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">
              {surgery.anesthesiaType || 'Anestesia inhalatoria balanceada (Isoflurano) con monitoreo multiparamétrico.'}
            </p>
          </div>

          {surgery.preOpNotes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 mb-1">Evaluación Pre-Quirúrgica:</div>
              <p className="text-slate-700 leading-relaxed">
                {surgery.preOpNotes}
              </p>
            </div>
          )}

          {surgery.intraOpNotes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 mb-1">Descripción Quirúrgica & Hallazgos Trans-Operatorios:</div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {surgery.intraOpNotes}
              </p>
            </div>
          )}

          <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200">
            <div className="font-bold text-rose-950 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-900" />
              Indicaciones de Recuperación y Cuidados Post-Operatorios:
            </div>
            <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-line">
              {surgery.postOpNotes || 'Reposo relativo por 7 a 10 días. Evitar que el paciente se lama la herida (uso estricto de collar isabelino). Administrar analgésicos y antibióticos según receta médica.'}
            </p>
          </div>
        </div>

        {/* SIGNATURES AREA */}
        <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-2">
            <div className="h-14 border-b border-slate-400 mx-auto w-4/5"></div>
            <div className="font-bold text-slate-900">{surgery.surgeon}</div>
            <div className="text-[10px] text-slate-500 font-medium">
              Médico Veterinario Zootecnista &bull; Céd. Prof. 8492019-BC
            </div>
            <div className="text-[10px] text-slate-400">Servicio Veterinario California</div>
          </div>

          <div className="space-y-2">
            <div className="h-14 border-b border-slate-400 mx-auto w-4/5"></div>
            <div className="font-bold text-slate-900">
              {surgery.ownerName || matchedOwner?.name || 'Propietario / Tutor'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Firma de Conformidad y Recepción de Indicaciones
            </div>
            <div className="text-[10px] text-slate-400">Tijuana, Baja California</div>
          </div>
        </div>

        {/* DOCUMENT FOOTER */}
        <div className="text-center pt-2 text-[10px] text-slate-400 font-mono">
          Servicio Veterinario California &bull; Calle 3ra #7184, Zona Centro, Tijuana &bull; Tel. (664) 685-8512
        </div>
      </div>
    </div>
  );
}
