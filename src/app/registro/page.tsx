'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { evolutionService } from '@/lib/evolution-api';
import { 
  Search, CheckCircle2, UserCheck, MessageSquare, 
  MapPin, AlertCircle, Loader2 
} from 'lucide-react';
import { animate } from 'animejs';

interface MesaInfo {
  numero: number;
  nombre: string;
}

interface AsistenteInfo {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  condominio: string;
  municipio: string;
  mesa_preasignada_id: string | null;
  asistio: boolean;
}

interface DbMesaResponse {
  id: string;
  numero: number;
  nombre: string;
}

export default function RegistroPage() {
  const [cedula, setCedula] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Registration result states
  const [registrado, setRegistrado] = useState(false);
  const [asistenteInfo, setAsistenteInfo] = useState<AsistenteInfo | null>(null);
  const [mesaAsignada, setMesaAsignada] = useState<MesaInfo | null>(null);
  const [waStatus, setWaStatus] = useState<{ success: boolean; msg: string } | null>(null);
  
  // Animation refs
  const cardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setRegistrado(false);
    setAsistenteInfo(null);
    setMesaAsignada(null);
    setWaStatus(null);

    try {
      // 1. Search for guest by Cédula
      const { data: guests, error: searchError } = await supabase
        .from('asistentes')
        .select('*')
        .eq('cedula', cedula.trim());

      if (searchError) throw searchError;

      if (!guests || guests.length === 0) {
        setErrorMsg('Esta cédula no se encuentra registrada en la lista oficial de invitados.');
        setLoading(false);
        return;
      }

      const guest = guests[0] as AsistenteInfo;
      let mesaId = guest.mesa_preasignada_id;

      // 2. Auto assign mesa if not pre-assigned
      if (!mesaId) {
        // Query all mesas
        const { data: dbMesas, error: errorMesas } = await supabase
          .from('mesas_trabajo')
          .select('*')
          .order('numero', { ascending: true });
        
        if (errorMesas) throw errorMesas;

        if (dbMesas && dbMesas.length > 0) {
          // Default assign to Mesa 1 or rotate
          const typedMesas = dbMesas as DbMesaResponse[];
          mesaId = typedMesas[0].id;
          
          // Update database with the assigned mesa
          const { error: updMesaErr } = await supabase
            .from('asistentes')
            .update({ mesa_preasignada_id: mesaId })
            .eq('id', guest.id);
          
          if (updMesaErr) console.error('Error auto-assigning mesa:', updMesaErr);
          guest.mesa_preasignada_id = mesaId;
        }
      }

      // 3. Retrieve assigned mesa info
      let mesaInfo: MesaInfo | null = null;
      if (mesaId) {
        const { data: dbMesa, error: errorMesa } = await supabase
          .from('mesas_trabajo')
          .select('numero, nombre')
          .eq('id', mesaId)
          .single();
        if (errorMesa) throw errorMesa;
        mesaInfo = dbMesa as MesaInfo;
      }

      // 4. Mark attendance
      const { error: updateError } = await supabase
        .from('asistentes')
        .update({
          asistio: true,
          fecha_registro: new Date().toISOString(),
        })
        .eq('id', guest.id);

      if (updateError) throw updateError;

      setAsistenteInfo(guest);
      setMesaAsignada(mesaInfo);
      setRegistrado(true);

      // 5. Send WhatsApp Message (EvolutionAPI)
      if (guest.telefono && mesaInfo) {
        const customMessage = `¡Hola, ${guest.nombre}! Le damos una cordial bienvenida al Primer Encuentro de Condominios. 

Ha sido asignado a la: 
📌 *Mesa ${mesaInfo.numero}: ${mesaInfo.nombre}*

Su participación es fundamental para el desarrollo y bienestar de su comunidad (${guest.condominio}). ¡Nos vemos adentro!`;

        setWaStatus({ success: false, msg: 'Enviando mensaje de confirmación...' });
        
        const waResult = await evolutionService.sendWhatsAppMessage(guest.telefono, customMessage);

        if (waResult.success) {
          setWaStatus({ success: true, msg: 'Mensaje de WhatsApp enviado con éxito' });
          await supabase
            .from('asistentes')
            .update({ whatsapp_status: 'enviado' })
            .eq('id', guest.id);
        } else {
          setWaStatus({ success: false, msg: `No se pudo enviar el WhatsApp: ${waResult.error}` });
          await supabase
            .from('asistentes')
            .update({ 
              whatsapp_status: 'error',
              whatsapp_error: waResult.error
            })
            .eq('id', guest.id);
        }
      } else {
        setWaStatus({ success: false, msg: 'No se pudo enviar WhatsApp: Datos incompletos.' });
      }

    } catch (error) {
      console.error(error);
      const err = error as Error;
      setErrorMsg(err.message || 'Ocurrió un error inesperado durante el registro.');
    } finally {
      setLoading(false);
    }
  };

  // AnimeJS Micro-interactions
  useEffect(() => {
    if (registrado && cardRef.current) {
      animate(cardRef.current, {
        scale: [0.95, 1],
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        easing: 'easeOutElastic(1, .6)'
      });
    }
  }, [registrado]);

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      {/* Encabezado */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#004e74]/20 text-[#60c0ea] mb-3">
          <UserCheck className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Registro de Asistencia</h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Ingresa la Cédula de Identidad del presidente de condominio para registrar su asistencia y enviarle la asignación de mesa por WhatsApp.
        </p>
      </div>

      {/* Formulario de registro */}
      {!registrado && (
        <form 
          ref={formRef}
          onSubmit={handleRegister} 
          className="bg-[#111a2e] border border-[#1e2d4a] rounded-2xl p-6 shadow-xl space-y-6 animate-slide-up"
        >
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Número de Cédula de Identidad
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={loading}
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                placeholder="Ingresa cédula (Ej. 12345678)"
                className="w-full bg-[#1a2640] border border-[#1e2d4a] text-white text-lg font-mono rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#60c0ea] focus:ring-1 focus:ring-[#60c0ea] transition-all disabled:opacity-50"
              />
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !cedula.trim()}
            className="w-full py-4 bg-[#004e74] hover:bg-[#004e74]/80 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#004e74]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Validando Asistente...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Registrar Asistencia
              </>
            )}
          </button>

          {errorMsg && (
            <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-bold block">Acceso Denegado</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Pantalla de Confirmación de Registro Exitoso */}
      {registrado && asistenteInfo && mesaAsignada && (
        <div 
          ref={cardRef}
          className="bg-[#111a2e] border border-emerald-500/30 rounded-2xl p-8 shadow-2xl space-y-6 text-center"
        >
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <CheckCircle2 className="h-10 w-10 animate-bounce-slow" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest block">Asistencia Confirmada</span>
            <h2 className="text-2xl font-bold text-white">{asistenteInfo.nombre}</h2>
            <p className="text-gray-400 text-sm">{asistenteInfo.condominio} | C.I. {asistenteInfo.cedula}</p>
          </div>

          <div className="p-6 bg-[#0b111e] border border-[#1e2d4a] rounded-xl flex flex-col items-center gap-2">
            <MapPin className="h-6 w-6 text-[#60c0ea]" />
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Mesa Asignada</span>
            <span className="text-2xl font-black text-white">Mesa {mesaAsignada.numero}</span>
            <span className="text-sm text-gray-300 font-medium">{mesaAsignada.nombre}</span>
          </div>

          {/* Estado de notificación de Whatsapp */}
          <div className="border-t border-[#1e2d4a] pt-6 flex items-center justify-center gap-3">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
              waStatus?.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#1a2640] text-gray-400'
            }`}>
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="text-left">
              <span className="text-xs text-gray-400 block font-semibold">Notificación de WhatsApp</span>
              <span className="text-sm text-gray-200">{waStatus?.msg || 'Procesando envío...'}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setRegistrado(false);
              setCedula('');
              setAsistenteInfo(null);
              setMesaAsignada(null);
              setWaStatus(null);
            }}
            className="w-full py-3 bg-[#1a2640] hover:bg-[#1a2640]/80 text-white font-bold rounded-xl transition-all"
          >
            Registrar Siguiente Participante
          </button>
        </div>
      )}
    </div>
  );
}
