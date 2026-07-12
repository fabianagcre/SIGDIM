import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LayoutDashboard, FileText, Users, Settings, LogOut,
  Bell, Search, ChevronRight, ChevronDown, Eye, Plus,
  X, Clock, CheckCircle, AlertCircle, XCircle, TrendingUp,
  Calendar, Filter, Download, Upload, Shield, Globe,
  User, Lock, ArrowRight, MoreHorizontal, Phone, Mail,
  MapPin, Paperclip, MessageSquare, RefreshCw, Menu,
  Briefcase, Home, BookOpen, HelpCircle, Navigation,
  Star, ChevronLeft, ExternalLink, Send, Info, Building2,
  ClipboardList, FileCheck, UserCheck, ArrowUpRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const API_URL = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "http://localhost:3000";

type AppRole = "abogado" | "solicitante" | null;
type AbogadoView = "dashboard" | "expedientes" | "clientes" | "configuracion";
type SolicitanteView = "inicio" | "mistramites" | "solicitar" | "oficinas" | "ayuda" | "asignarabogado" | "miabogado";

type PermisoRepresentacion = "VER_EXPEDIENTE" | "SUBIR_DOCUMENTOS" | "GESTIONAR_TRAMITE" | "RECIBIR_NOTIFICACIONES";

type Representacion = {
  abogado: { nombre: string; licencia: string; email: string; despacho: string };
  permisos: PermisoRepresentacion[];
  fecha: string;
};

// ─── Shared data ───────────────────────────────────────────────────────────

interface Expediente {
  id: string; numero: string; cliente: string; pasaporte: string;
  tipo: string; estado: EstadoKey; fecha: string; vencimiento: string;
  responsable: string; prioridad: "alta" | "media" | "baja";
}

type EstadoKey = "activo" | "pendiente" | "aprobado" | "rechazado" | "revision" | "borrador" | "doc_faltantes";

const EXPEDIENTES: Expediente[] = [
  { id: "1", numero: "EXP-2024-0451", cliente: "María González Herrera", pasaporte: "PA1847293", tipo: "Residencia Permanente", estado: "activo", fecha: "2024-01-15", vencimiento: "2024-07-15", responsable: "Lcda. Soto", prioridad: "alta" },
  { id: "2", numero: "EXP-2024-0389", cliente: "Carlos Martínez Lima", pasaporte: "PE0934821", tipo: "Visa de Trabajo", estado: "pendiente", fecha: "2024-01-10", vencimiento: "2024-04-10", responsable: "Lcdo. Ramos", prioridad: "alta" },
  { id: "3", numero: "EXP-2024-0312", cliente: "Ana Rodríguez Pinto", pasaporte: "PA2841937", tipo: "Naturalización", estado: "revision", fecha: "2023-11-20", vencimiento: "2024-05-20", responsable: "Lcda. Soto", prioridad: "media" },
  { id: "4", numero: "EXP-2024-0288", cliente: "Roberto Chen Wei", pasaporte: "CN5723841", tipo: "Visa de Inversionista", estado: "aprobado", fecha: "2023-10-05", vencimiento: "2026-10-05", responsable: "Lcdo. Pérez", prioridad: "baja" },
  { id: "5", numero: "EXP-2024-0271", cliente: "Lucía Fernández Castro", pasaporte: "PA3928471", tipo: "Residencia Provisional", estado: "rechazado", fecha: "2023-09-14", vencimiento: "2024-03-14", responsable: "Lcdo. Ramos", prioridad: "alta" },
  { id: "6", numero: "EXP-2024-0445", cliente: "James William Scott", pasaporte: "US7481923", tipo: "Permiso de Trabajo", estado: "activo", fecha: "2024-01-18", vencimiento: "2025-01-18", responsable: "Lcda. Morales", prioridad: "media" },
  { id: "7", numero: "EXP-2024-0398", cliente: "Fatima Al-Hassan", pasaporte: "SY2847193", tipo: "Reunificación Familiar", estado: "doc_faltantes", fecha: "2024-01-12", vencimiento: "2024-06-12", responsable: "Lcda. Morales", prioridad: "media" },
  { id: "8", numero: "EXP-2024-0201", cliente: "Diego Vargas Méndez", pasaporte: "PA9182734", tipo: "Doble Nacionalidad", estado: "aprobado", fecha: "2023-08-22", vencimiento: "2033-08-22", responsable: "Lcdo. Pérez", prioridad: "baja" },
];

const METRICAS_MENSUALES = [
  { mes: "Ago", tramites: 42, aprobados: 31 },
  { mes: "Sep", tramites: 38, aprobados: 27 },
  { mes: "Oct", tramites: 55, aprobados: 41 },
  { mes: "Nov", tramites: 48, aprobados: 35 },
  { mes: "Dic", tramites: 35, aprobados: 26 },
  { mes: "Ene", tramites: 62, aprobados: 47 },
];

const TIPOS_DATA = [
  { name: "Residencia", value: 38, color: "#1A3A6C" },
  { name: "Visa Trabajo", value: 24, color: "#2980B9" },
  { name: "Naturalización", value: 18, color: "#2E7D32" },
  { name: "Inversionista", value: 12, color: "#F39C12" },
  { name: "Otros", value: 8, color: "#9AAAC2" },
];

const estadoConfig: Record<EstadoKey, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  activo:       { label: "Activo",            color: "#1A3A6C", bg: "#E4EAF4", icon: Clock },
  pendiente:    { label: "Pendiente",         color: "#B7791F", bg: "#FEF3C7", icon: AlertCircle },
  aprobado:     { label: "Aprobado",          color: "#2E7D32", bg: "#E8F5E9", icon: CheckCircle },
  rechazado:    { label: "Rechazado",         color: "#C0392B", bg: "#FDECEA", icon: XCircle },
  revision:     { label: "En Revisión",       color: "#6D28D9", bg: "#EDE9FE", icon: RefreshCw },
  borrador:     { label: "Borrador",          color: "#9AAAC2", bg: "#F0F3F8", icon: FileText },
  doc_faltantes:{ label: "Docs. Faltantes",   color: "#C0392B", bg: "#FFF0E6", icon: Paperclip },
};

const prioridadConfig = {
  alta:  { label: "Alta",  color: "#C0392B" },
  media: { label: "Media", color: "#F39C12" },
  baja:  { label: "Baja",  color: "#2E7D32" },
};

function StatusBadge({ estado }: { estado: EstadoKey }) {
  const cfg = estadoConfig[estado];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <Icon size={11} strokeWidth={2.5} />{cfg.label}
    </span>
  );
}

function PrioridadDot({ prioridad }: { prioridad: "alta" | "media" | "baja" }) {
  const cfg = prioridadConfig[prioridad];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: cfg.color }}>
      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ─── System brand ──────────────────────────────────────────────────────────

function SystemLogo({ size = "md" }: { size?: "sm" | "md" | "lg"; light?: boolean }) {
  const sizes = { sm: "h-11", md: "h-16", lg: "h-24" };
  return (
    <div className="inline-flex items-center rounded-xl bg-white px-2 py-1.5 shadow-sm" aria-label="SIGDIM">
      <img src="/logoSIGDIM.png" alt="SIGDIM — Sistema Integrado de Gestión de Debida Diligencia Migratoria" className={`${sizes[size]} w-auto object-contain`} />
    </div>
  );
}

async function descargarExpedientePdf(exp: Expediente) {
  const pdf = new jsPDF();
  pdf.setFillColor(26, 58, 108);
  pdf.rect(0, 0, 210, 36, "F");
  const logo = await fetch("/logoSIGDIM.png").then((response) => response.blob()).then((blob) => new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  }));
  pdf.addImage(logo, "PNG", 12, 4, 24, 27);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.text("República de Panamá — Servicio Nacional de Migración", 42, 15);
  pdf.setFontSize(8);
  pdf.text(`Generado: ${new Date().toLocaleDateString("es-PA")}`, 42, 23);
  pdf.setTextColor(15, 31, 61);
  pdf.setFontSize(15);
  pdf.text(`Expediente ${exp.numero}`, 14, 48);
  pdf.setFontSize(10);
  pdf.text(`Estado actual: ${estadoConfig[exp.estado].label}`, 14, 55);
  autoTable(pdf, {
    startY: 62,
    head: [["Datos del cliente", "Información"]],
    body: [["Nombre", exp.cliente], ["Pasaporte", exp.pasaporte], ["Abogado asignado", exp.responsable]],
    headStyles: { fillColor: [26, 58, 108] },
  });
  const detailsY = (pdf as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  autoTable(pdf, {
    startY: detailsY,
    head: [["Trámite", "Apertura", "Vencimiento", "Prioridad"]],
    body: [[exp.tipo, exp.fecha, exp.vencimiento, exp.prioridad]],
    headStyles: { fillColor: [26, 58, 108] },
  });
  const documentsY = (pdf as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  autoTable(pdf, {
    startY: documentsY,
    head: [["Documento", "Estado", "Fecha de entrega"]],
    body: [["Cédula de identidad", "Verificado", "12 Ene 2024"], ["Pasaporte vigente", "Verificado", "12 Ene 2024"], ["Antecedentes penales", "Pendiente", "—"]],
    headStyles: { fillColor: [26, 58, 108] },
  });
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(8);
  pdf.setTextColor(90, 110, 140);
  pdf.text("Documento generado por SIGDIM — Confidencial", 105, pageHeight - 10, { align: "center" });
  pdf.save(`${exp.numero}.pdf`);
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────

function RegistroSolicitante({ onRegistrado, onCancelar }: { onRegistrado: () => void; onCancelar: () => void }) {
  const [nombre, setNombre] = useState("");
  const [pasaporte, setPasaporte] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, pasaporte, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "No se pudo crear la cuenta.");
        return;
      }
      onRegistrado();
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    border: "1.5px solid #D0D9EA", background: "#F7F9FC", color: "#0F1F3D", fontFamily: "inherit",
  };

  return (
    <div className="w-full max-w-[420px]">
      <div className="lg:hidden mb-8"><SystemLogo size="md" /></div>
      <div className="mb-6">
        <h2 className="font-extrabold text-2xl mb-1" style={{ color: "#0F1F3D" }}>Crear cuenta</h2>
        <p className="text-sm" style={{ color: "#5A6E8C" }}>Regístrate como solicitante para dar seguimiento a tus trámites</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{ background: "#FDECEA", border: "1px solid rgba(192,57,43,0.2)" }}>
          <AlertCircle size={15} style={{ color: "#C0392B", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: "#C0392B" }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F1F3D" }}>Nombre completo</label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AAAC2" }} />
            <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej. María González"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border outline-none" style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F1F3D" }}>Número de pasaporte</label>
          <div className="relative">
            <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AAAC2" }} />
            <input type="text" required value={pasaporte} onChange={e => setPasaporte(e.target.value)}
              placeholder="Ej. PA1234567"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border outline-none" style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F1F3D" }}>Correo electrónico</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AAAC2" }} />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="correo@email.com"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border outline-none" style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F1F3D" }}>Contraseña</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AAAC2" }} />
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border outline-none" style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F1F3D" }}>Confirmar contraseña</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AAAC2" }} />
            <input type="password" required value={confirmar} onChange={e => setConfirmar(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border outline-none" style={inputStyle} />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all mt-1"
          style={{ background: loading ? "#9AAAC2" : "#1A3A6C", color: "white" }}>
          {loading ? <><RefreshCw size={15} className="animate-spin" />Creando cuenta...</> : <>Crear cuenta <ArrowRight size={15} /></>}
        </button>

        <p className="text-center text-xs" style={{ color: "#9AAAC2" }}>
          ¿Ya tienes cuenta? <span className="font-semibold cursor-pointer" style={{ color: "#1A3A6C" }} onClick={onCancelar}>Inicia sesión</span>
        </p>
      </form>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (role: AppRole) => void }) {
  const [role, setRole] = useState<"abogado" | "solicitante">("abogado");
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(role); }, 1100);
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-10 relative overflow-hidden" style={{ background: "linear-gradient(145deg, #0B1E45 0%, #1A3A6C 55%, #1A5296 100%)" }}>
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fff, transparent)" }} />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #2980B9, transparent)" }} />

        <div className="relative z-10">
          <SystemLogo size="md" light />
        </div>

        <div className="relative z-10">
          <div className="flex gap-1 mb-6">
            <div className="w-8 h-1.5 rounded-full bg-white opacity-90" />
            <div className="w-4 h-1.5 rounded-full bg-white opacity-40" />
            <div className="w-2 h-1.5 rounded-full bg-white opacity-20" />
          </div>
          <h1 className="text-white font-extrabold text-4xl leading-tight mb-4">
            Gestión de trámites<br />migratorios al alcance<br />de tus manos
          </h1>
          <p className="text-blue-200 text-base leading-relaxed max-w-sm">
            Plataforma oficial para la gestión de trámites migratorios, representaciones legales y seguimiento de expedientes en la República de Panamá.
          </p>
          <div className="flex gap-6 mt-8">
            {[{ n: "1,240+", l: "Expedientes" }, { n: "98%", l: "Satisfacción" }, { n: "24h", l: "Soporte" }].map(s => (
              <div key={s.l}>
                <div className="text-white font-bold text-2xl">{s.n}</div>
                <div className="text-blue-300 text-xs mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex gap-0.5">
            {["#C0392B","#fff","#C0392B","#fff"].map((c, i) => <div key={i} className="w-5 h-3.5 rounded-sm" style={{ background: c }} />)}
          </div>
          <span className="text-blue-200 text-xs">República de Panamá · Autorizado por el SNM</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        {modo === "registro" ? (
          <RegistroSolicitante onRegistrado={() => onLogin("solicitante")} onCancelar={() => setModo("login")} />
        ) : (
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-8"><SystemLogo size="md" /></div>

          <div className="mb-6">
            <h2 className="font-extrabold text-2xl mb-1" style={{ color: "#0F1F3D" }}>Bienvenido</h2>
            <p className="text-sm" style={{ color: "#5A6E8C" }}>Selecciona tu perfil e ingresa tus credenciales</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-5 p-1 rounded-xl" style={{ background: "#F0F3F8" }}>
            {([
              { id: "abogado", icon: Briefcase, label: "Abogado / Despacho", sub: "Gestión de expedientes" },
              { id: "solicitante", icon: User, label: "Solicitante", sub: "Ver mis trámites" },
            ] as const).map(r => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-all text-center"
                style={{
                  background: role === r.id ? "white" : "transparent",
                  boxShadow: role === r.id ? "0 1px 6px rgba(26,58,108,0.12)" : "none",
                  color: role === r.id ? "#1A3A6C" : "#9AAAC2",
                }}
              >
                <r.icon size={18} strokeWidth={role === r.id ? 2.5 : 1.8} />
                <span className="text-xs font-bold leading-tight">{r.label}</span>
                <span className="text-[10px]" style={{ color: role === r.id ? "#5A6E8C" : "#C0CAD8" }}>{r.sub}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F1F3D" }}>
                {role === "abogado" ? "Correo institucional" : "Número de pasaporte o correo electrónico"}
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AAAC2" }} />
                <input type="text" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={role === "abogado" ? "abogado@despacho.pa" : "AB123456 o correo@email.com"}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border outline-none transition-all"
                  style={{ border: "1.5px solid #D0D9EA", background: "#F7F9FC", color: "#0F1F3D", fontFamily: "inherit" }}
                  onFocus={e => { e.target.style.borderColor = "#1A3A6C"; e.target.style.boxShadow = "0 0 0 3px rgba(26,58,108,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "#D0D9EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="block text-sm font-semibold" style={{ color: "#0F1F3D" }}>Contraseña</label>
                <button type="button" className="text-xs font-semibold" style={{ color: "#1A3A6C" }}>¿Olvidaste tu contraseña?</button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AAAC2" }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border outline-none transition-all"
                  style={{ border: "1.5px solid #D0D9EA", background: "#F7F9FC", color: "#0F1F3D", fontFamily: "inherit" }}
                  onFocus={e => { e.target.style.borderColor = "#1A3A6C"; e.target.style.boxShadow = "0 0 0 3px rgba(26,58,108,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "#D0D9EA"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="recordar" className="w-4 h-4 rounded" style={{ accentColor: "#1A3A6C" }} />
              <label htmlFor="recordar" className="text-sm" style={{ color: "#5A6E8C" }}>Mantener sesión iniciada</label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all mt-1"
              style={{ background: loading ? "#9AAAC2" : "#1A3A6C", color: "white" }}>
              {loading ? <><RefreshCw size={15} className="animate-spin" />Verificando...</> : <>Ingresar al sistema <ArrowRight size={15} /></>}
            </button>

            {role === "solicitante" && (
              <p className="text-center text-xs" style={{ color: "#9AAAC2" }}>
                ¿Primera vez? <span className="font-semibold cursor-pointer" style={{ color: "#1A3A6C" }} onClick={() => setModo("registro")}>Crear cuenta como solicitante</span>
              </p>
            )}
          </form>

          <div className="mt-6 p-3 rounded-lg flex items-start gap-2.5" style={{ background: "#F0F3F8", border: "1px solid #D0D9EA" }}>
            <Shield size={14} style={{ color: "#1A3A6C", flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: "#5A6E8C" }}>Todas las sesiones son auditadas. Acceso regulado por el Servicio Nacional de Migración de la República de Panamá.</p>
          </div>
          <p className="text-center text-xs mt-5" style={{ color: "#C0CAD8" }}>© 2026 SIGDIM · v1.0 · <span className="cursor-pointer" style={{ color: "#1A3A6C" }}>Soporte</span></p>
        </div>
        )}
      </div>
    </div>
  );
}

// ─── SIDEBAR (Abogado) ─────────────────────────────────────────────────────

const NAV_ABOGADO = [
  { id: "dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { id: "expedientes",   icon: FileText,        label: "Expedientes" },
  { id: "clientes",      icon: Users,           label: "Clientes" },
  { id: "configuracion", icon: Settings,        label: "Configuración" },
];

function SidebarAbogado({ view, setView, onLogout }: { view: AbogadoView; setView: (v: AbogadoView) => void; onLogout: () => void }) {
  return (
    <div className="h-full flex flex-col" style={{ background: "#0F2550" }}>
      <div className="p-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <SystemLogo size="sm" light />
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-bold uppercase tracking-widest px-3 py-2" style={{ color: "#3F6090" }}>Principal</p>
        {NAV_ABOGADO.map(item => {
          const active = view === item.id;
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setView(item.id as AbogadoView)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
              style={{ background: active ? "rgba(255,255,255,0.1)" : "transparent", color: active ? "white" : "#7A9CC5", borderLeft: active ? "3px solid #2980B9" : "3px solid transparent" }}>
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          );
        })}
      </nav>
      <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ background: "#1A3A6C", color: "white" }}>LS</div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">Lcda. Laura Soto</div>
            <div className="text-xs truncate" style={{ color: "#3F6090" }}>Abogada Senior</div>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all" style={{ color: "#7A9CC5" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#C0392B")} onMouseLeave={e => (e.currentTarget.style.color = "#7A9CC5")}>
          <LogOut size={16} />Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ─── ABOGADO VIEWS ─────────────────────────────────────────────────────────

function Dashboard() {
  const metrics = [
    { label: "Expedientes Activos", value: "124", change: "+8 este mes",        icon: FileText,      color: "#1A3A6C", bg: "#E4EAF4" },
    { label: "Aprobados este Mes",  value: "47",  change: "+12% vs anterior",   icon: CheckCircle,   color: "#2E7D32", bg: "#E8F5E9" },
    { label: "Pendientes",          value: "38",  change: "5 por vencer pronto",icon: Clock,         color: "#B7791F", bg: "#FEF3C7" },
    { label: "Clientes Activos",    value: "89",  change: "+3 nuevos esta semana",icon: Users,        color: "#6D28D9", bg: "#EDE9FE" },
  ];
  const actividad = [
    { accion: "Documento aprobado",   exp: "EXP-2024-0288", usuario: "SNM",         tiempo: "Hace 12 min",    tipo: "success" },
    { accion: "Nuevo expediente",     exp: "EXP-2024-0451", usuario: "Lcda. Soto",  tiempo: "Hace 38 min",    tipo: "info" },
    { accion: "Solicitud devuelta",   exp: "EXP-2024-0271", usuario: "SNM",         tiempo: "Hace 1h 20min",  tipo: "warning" },
    { accion: "Revisión completada",  exp: "EXP-2024-0312", usuario: "Lcdo. Ramos", tiempo: "Hace 2h 05min",  tipo: "info" },
    { accion: "Documento rechazado",  exp: "EXP-2024-0271", usuario: "SNM",         tiempo: "Hace 3h 41min",  tipo: "error" },
  ];
  const tipoBg: Record<string,string> = { success: "#E8F5E9", info: "#E4EAF4", warning: "#FEF3C7", error: "#FDECEA" };
  const tipoColor: Record<string,string> = { success: "#2E7D32", info: "#1A3A6C", warning: "#B7791F", error: "#C0392B" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl" style={{ color: "#0F1F3D" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#5A6E8C" }}>Bienvenida, Lcda. Soto · Viernes, 19 de enero 2024</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#1A3A6C" }}>
          <Plus size={15} />Nuevo Expediente
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl p-4 bg-card border" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: m.bg }}><Icon size={18} style={{ color: m.color }} /></div>
                <TrendingUp size={14} style={{ color: "#2E7D32" }} />
              </div>
              <div className="font-extrabold text-2xl" style={{ color: "#0F1F3D" }}>{m.value}</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: "#5A6E8C" }}>{m.label}</div>
              <div className="text-xs mt-1 font-semibold" style={{ color: m.color }}>{m.change}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl p-5 bg-card border" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm" style={{ color: "#0F1F3D" }}>Trámites por Mes</h3>
              <p className="text-xs" style={{ color: "#5A6E8C" }}>Agosto 2023 – Enero 2024</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5" style={{ color: "#5A6E8C" }}><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#1A3A6C" }} />Total</span>
              <span className="flex items-center gap-1.5" style={{ color: "#5A6E8C" }}><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#2E7D32" }} />Aprobados</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={METRICAS_MENSUALES} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9AAAC2", fontFamily: "inherit" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9AAAC2", fontFamily: "inherit" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, fontFamily: "inherit", borderRadius: 8, border: "1px solid #D0D9EA" }} />
              <Bar dataKey="tramites" fill="#1A3A6C" radius={[4,4,0,0]} />
              <Bar dataKey="aprobados" fill="#2E7D32" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl p-5 bg-card border" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
          <h3 className="font-bold text-sm mb-0.5" style={{ color: "#0F1F3D" }}>Tipos de Trámite</h3>
          <p className="text-xs mb-3" style={{ color: "#5A6E8C" }}>Distribución actual</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={TIPOS_DATA} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                {TIPOS_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, fontFamily: "inherit", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {TIPOS_DATA.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5" style={{ color: "#5A6E8C" }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0 inline-block" style={{ background: d.color }} />{d.name}
                </span>
                <span className="font-semibold" style={{ color: "#0F1F3D" }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5 bg-card border" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: "#0F1F3D" }}>Actividad Reciente</h3>
          <div className="space-y-3">
            {actividad.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: tipoBg[a.tipo] }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: tipoColor[a.tipo] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold" style={{ color: "#0F1F3D" }}>{a.accion}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#5A6E8C" }}>{a.exp} · {a.usuario}</div>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: "#9AAAC2" }}>{a.tiempo}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-5 bg-card border" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: "#0F1F3D" }}>Próximos Vencimientos</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#FDECEA", color: "#C0392B" }}>3 urgentes</span>
          </div>
          <div className="space-y-2.5">
            {EXPEDIENTES.filter(e => e.estado !== "aprobado" && e.estado !== "rechazado").slice(0,5).map(e => (
              <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "#F7F9FC" }}>
                <Calendar size={14} style={{ color: "#5A6E8C", flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: "#0F1F3D" }}>{e.cliente}</div>
                  <div className="text-xs" style={{ color: "#5A6E8C" }}>{e.tipo}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-semibold" style={{ color: e.prioridad === "alta" ? "#C0392B" : "#0F1F3D" }}>{e.vencimiento}</div>
                  <PrioridadDot prioridad={e.prioridad} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpedienteModal({ exp, onClose }: { exp: Expediente; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"info" | "docs" | "notas">("info");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,31,61,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl bg-white" onClick={e => e.stopPropagation()}>
        <div className="p-6 pb-0" style={{ borderBottom: "1px solid rgba(26,58,108,0.1)" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#9AAAC2", fontFamily: "JetBrains Mono, monospace" }}>{exp.numero}</span>
                <StatusBadge estado={exp.estado} />
              </div>
              <h2 className="font-extrabold text-lg" style={{ color: "#0F1F3D" }}>{exp.cliente}</h2>
              <p className="text-sm mt-0.5" style={{ color: "#5A6E8C" }}>{exp.tipo}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "#9AAAC2" }}><X size={20} /></button>
          </div>
          <div className="flex gap-0">
            {(["info","docs","notas"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all capitalize"
                style={{ borderColor: activeTab === t ? "#1A3A6C" : "transparent", color: activeTab === t ? "#1A3A6C" : "#9AAAC2" }}>
                {t === "info" ? "Información" : t === "docs" ? "Documentos" : "Notas"}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 max-h-[450px] overflow-y-auto">
          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Pasaporte", value: exp.pasaporte },
                  { label: "Responsable", value: exp.responsable },
                  { label: "Fecha de Apertura", value: exp.fecha },
                  { label: "Fecha de Vencimiento", value: exp.vencimiento },
                  { label: "Prioridad", value: exp.prioridad },
                  { label: "Tipo de Trámite", value: exp.tipo },
                ].map(f => (
                  <div key={f.label} className="p-3 rounded-xl" style={{ background: "#F7F9FC" }}>
                    <div className="text-xs font-semibold mb-0.5" style={{ color: "#9AAAC2" }}>{f.label}</div>
                    <div className="text-sm font-semibold capitalize" style={{ color: "#0F1F3D" }}>{f.value}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl" style={{ background: "#F0F7FF", border: "1px solid #D0E4F7" }}>
                <div className="flex items-start gap-2">
                  <AlertCircle size={15} style={{ color: "#1A3A6C", flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs" style={{ color: "#1A3A6C" }}>Este expediente requiere documentación adicional antes del <strong>{exp.vencimiento}</strong>.</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === "docs" && (
            <div className="space-y-2">
              {[
                { nombre: "Cédula de identidad", estado: "Verificado", fecha: "12 Ene 2024" },
                { nombre: "Pasaporte vigente", estado: "Verificado", fecha: "12 Ene 2024" },
                { nombre: "Antecedentes penales", estado: "Pendiente", fecha: "—" },
                { nombre: "Carta de trabajo o ingresos", estado: "Verificado", fecha: "15 Ene 2024" },
                { nombre: "Fotos tamaño carnet", estado: "Pendiente", fecha: "—" },
              ].map(d => (
                <div key={d.nombre} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F7F9FC" }}>
                  <div className="flex items-center gap-3"><Paperclip size={14} style={{ color: "#5A6E8C" }} /><span className="text-sm font-medium" style={{ color: "#0F1F3D" }}>{d.nombre}</span></div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: "#9AAAC2" }}>{d.fecha}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: d.estado === "Verificado" ? "#2E7D32" : "#B7791F", background: d.estado === "Verificado" ? "#E8F5E9" : "#FEF3C7" }}>{d.estado}</span>
                  </div>
                </div>
              ))}
              <button className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-2 border-2 border-dashed" style={{ color: "#1A3A6C", borderColor: "#D0D9EA" }}>
                <Upload size={15} />Subir documento
              </button>
            </div>
          )}
          {activeTab === "notas" && (
            <div className="space-y-3">
              {[
                { autor: "Lcda. Soto", fecha: "18 Ene 2024, 09:34", texto: "Cliente confirmó que los antecedentes penales se están tramitando. Tiempo estimado: 10 días hábiles." },
                { autor: "Sistema SNM", fecha: "15 Ene 2024, 14:21", texto: "Expediente recibido en ventanilla. Radicado interno: RAD-2024-14892." },
              ].map((n, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: "#F7F9FC" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: "#1A3A6C", color: "white" }}>{n.autor.charAt(0)}</div>
                    <span className="text-xs font-semibold" style={{ color: "#0F1F3D" }}>{n.autor}</span>
                    <span className="text-xs" style={{ color: "#9AAAC2" }}>· {n.fecha}</span>
                  </div>
                  <p className="text-sm" style={{ color: "#5A6E8C" }}>{n.texto}</p>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <textarea className="flex-1 p-3 rounded-xl text-sm border outline-none resize-none" placeholder="Agregar una nota..." rows={2} style={{ border: "1.5px solid #D0D9EA", fontFamily: "inherit", color: "#0F1F3D" }} />
                <button className="px-4 py-2 rounded-xl font-semibold text-sm" style={{ background: "#1A3A6C", color: "white" }}><MessageSquare size={15} /></button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between p-5 pt-3" style={{ borderTop: "1px solid rgba(26,58,108,0.08)" }}>
          <button onClick={() => descargarExpedientePdf(exp)} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#C0392B" }}><Download size={14} />Descargar expediente</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#F0F3F8", color: "#5A6E8C" }}>Cerrar</button>
            <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#1A3A6C" }}>Actualizar estado</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpedientesView({ onSelect }: { onSelect: (e: Expediente) => void }) {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const filtered = EXPEDIENTES.filter(e => {
    const ms = e.cliente.toLowerCase().includes(search.toLowerCase()) || e.numero.toLowerCase().includes(search.toLowerCase());
    const me = filtroEstado === "todos" || e.estado === filtroEstado;
    return ms && me;
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl" style={{ color: "#0F1F3D" }}>Expedientes</h1>
          <p className="text-sm mt-0.5" style={{ color: "#5A6E8C" }}>{filtered.length} expedientes encontrados</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border" style={{ color: "#5A6E8C", borderColor: "#D0D9EA", background: "white" }}><Download size={14} />Exportar</button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#1A3A6C" }}><Plus size={15} />Nuevo expediente</button>
        </div>
      </div>
      <div className="rounded-xl p-4 bg-card border flex flex-wrap gap-3 items-center" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AAAC2" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o número..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border outline-none" style={{ border: "1.5px solid #D0D9EA", fontFamily: "inherit", color: "#0F1F3D" }} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} style={{ color: "#9AAAC2" }} />
          {["todos","activo","pendiente","revision","doc_faltantes","aprobado","rechazado"].map(est => (
            <button key={est} onClick={() => setFiltroEstado(est)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ background: filtroEstado === est ? "#1A3A6C" : "#F0F3F8", color: filtroEstado === est ? "white" : "#5A6E8C" }}>
              {est === "todos" ? "Todos" : estadoConfig[est as EstadoKey]?.label ?? est}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-card border overflow-hidden" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(26,58,108,0.08)", background: "#F7F9FC" }}>
                {["Expediente","Cliente","Tipo","Responsable","Vencimiento","Prioridad","Estado",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#9AAAC2" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id} className="transition-all cursor-pointer"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(26,58,108,0.06)" : "none" }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = "#F7F9FC")}
                  onMouseLeave={ev => (ev.currentTarget.style.background = "transparent")}
                  onClick={() => onSelect(e)}>
                  <td className="px-4 py-3.5"><span className="text-xs font-bold" style={{ color: "#1A3A6C", fontFamily: "JetBrains Mono, monospace" }}>{e.numero}</span></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "#E4EAF4", color: "#1A3A6C" }}>
                        {e.cliente.split(" ").map(w => w[0]).slice(0,2).join("")}
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "#0F1F3D" }}>{e.cliente}</div>
                        <div className="text-xs" style={{ color: "#9AAAC2" }}>{e.pasaporte}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm" style={{ color: "#5A6E8C" }}>{e.tipo}</td>
                  <td className="px-4 py-3.5 text-sm" style={{ color: "#5A6E8C" }}>{e.responsable}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: "#0F1F3D" }}>{e.vencimiento}</td>
                  <td className="px-4 py-3.5"><PrioridadDot prioridad={e.prioridad} /></td>
                  <td className="px-4 py-3.5"><StatusBadge estado={e.estado} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={ev => { ev.stopPropagation(); onSelect(e); }} className="p-1.5 rounded-lg" style={{ color: "#9AAAC2" }} onMouseEnter={ev => (ev.currentTarget.style.background="#E4EAF4")} onMouseLeave={ev => (ev.currentTarget.style.background="transparent")}><Eye size={14} /></button>
                      <button className="p-1.5 rounded-lg" style={{ color: "#9AAAC2" }} onClick={ev => ev.stopPropagation()} onMouseEnter={ev => (ev.currentTarget.style.background="#E4EAF4")} onMouseLeave={ev => (ev.currentTarget.style.background="transparent")}><MoreHorizontal size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(26,58,108,0.06)", background: "#F7F9FC" }}>
          <span className="text-xs" style={{ color: "#9AAAC2" }}>Mostrando {filtered.length} de {EXPEDIENTES.length} expedientes</span>
          <div className="flex gap-1">
            {[1,2,3].map(p => <button key={p} className="w-7 h-7 rounded-lg text-xs font-semibold" style={{ background: p===1?"#1A3A6C":"transparent", color: p===1?"white":"#9AAAC2" }}>{p}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientesView() {
  const clientes = [
    { nombre: "María González Herrera", pasaporte: "PA1847293", pais: "Panamá", email: "mgonzalez@email.com", expedientes: 2, estado: "activo" },
    { nombre: "Carlos Martínez Lima", pasaporte: "PE0934821", pais: "Perú", email: "cmartinez@email.com", expedientes: 1, estado: "activo" },
    { nombre: "Ana Rodríguez Pinto", pasaporte: "PA2841937", pais: "Panamá", email: "arodriguez@email.com", expedientes: 3, estado: "activo" },
    { nombre: "Roberto Chen Wei", pasaporte: "CN5723841", pais: "China", email: "rchen@email.com", expedientes: 1, estado: "inactivo" },
    { nombre: "Lucía Fernández Castro", pasaporte: "PA3928471", pais: "Panamá", email: "lfernandez@email.com", expedientes: 1, estado: "activo" },
    { nombre: "James William Scott", pasaporte: "US7481923", pais: "EEUU", email: "jwscott@email.com", expedientes: 2, estado: "activo" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl" style={{ color: "#0F1F3D" }}>Clientes</h1>
          <p className="text-sm mt-0.5" style={{ color: "#5A6E8C" }}>{clientes.length} clientes registrados</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#1A3A6C" }}><Plus size={15} />Nuevo cliente</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clientes.map(c => (
          <div key={c.pasaporte} className="rounded-xl p-5 bg-card border cursor-pointer transition-all" style={{ borderColor: "rgba(26,58,108,0.08)" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor="#1A3A6C")} onMouseLeave={e => (e.currentTarget.style.borderColor="rgba(26,58,108,0.08)")}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "#E4EAF4", color: "#1A3A6C" }}>
                  {c.nombre.split(" ").map(w => w[0]).slice(0,2).join("")}
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: "#0F1F3D" }}>{c.nombre}</div>
                  <div className="text-xs" style={{ color: "#9AAAC2" }}>{c.pasaporte}</div>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: c.estado==="activo"?"#E8F5E9":"#F0F3F8", color: c.estado==="activo"?"#2E7D32":"#9AAAC2" }}>
                {c.estado==="activo"?"Activo":"Inactivo"}
              </span>
            </div>
            <div className="space-y-1.5 text-xs" style={{ color: "#5A6E8C" }}>
              <div className="flex items-center gap-2"><Globe size={12}/>{c.pais}</div>
              <div className="flex items-center gap-2"><Mail size={12}/>{c.email}</div>
              <div className="flex items-center gap-2"><FileText size={12}/>{c.expedientes} expediente{c.expedientes!==1?"s":""}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfiguracionView() {
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="font-extrabold text-xl" style={{ color: "#0F1F3D" }}>Configuración</h1>
      <div className="rounded-xl bg-card border p-5 space-y-4" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
        <h3 className="font-bold text-sm" style={{ color: "#0F1F3D" }}>Perfil del despacho</h3>
        {[
          { label: "Nombre del despacho", value: "Soto & Asociados Abogados" },
          { label: "Registro en el COLPA", value: "COL-2019-04821" },
          { label: "Teléfono de contacto", value: "+507 6123-4567" },
          { label: "Correo oficial", value: "info@sotoasociados.pa" },
        ].map(f => (
          <div key={f.label}>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#5A6E8C" }}>{f.label}</label>
            <input defaultValue={f.value} className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none" style={{ border: "1.5px solid #D0D9EA", fontFamily: "inherit", color: "#0F1F3D", background: "#F7F9FC" }} />
          </div>
        ))}
        <button className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#1A3A6C" }}>Guardar cambios</button>
      </div>
    </div>
  );
}

// ─── ABOGADO LAYOUT ────────────────────────────────────────────────────────

function AbogadoLayout({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<AbogadoView>("dashboard");
  const [modal, setModal] = useState<Expediente | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F3F8" }}>
      <div className="hidden lg:block w-56 flex-shrink-0 h-full">
        <SidebarAbogado view={view} setView={setView} onLogout={onLogout} />
      </div>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(15,31,61,0.5)" }} />
          <div className="absolute left-0 top-0 h-full w-56 z-50">
            <SidebarAbogado view={view} setView={v => { setView(v); setSidebarOpen(false); }} onLogout={onLogout} />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-white flex-shrink-0" style={{ borderBottom: "1px solid rgba(26,58,108,0.08)" }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded-lg" style={{ color: "#5A6E8C" }} onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AAAC2" }} />
              <input placeholder="Buscar expediente, cliente..." className="pl-9 pr-4 py-2 rounded-lg text-sm border outline-none w-64" style={{ border: "1.5px solid #D0D9EA", background: "#F7F9FC", fontFamily: "inherit", color: "#0F1F3D" }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg" style={{ color: "#5A6E8C" }}>
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#C0392B" }} />
            </button>
            <div className="flex items-center gap-2 pl-3" style={{ borderLeft: "1px solid #E0E6F0" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: "#1A3A6C", color: "white" }}>LS</div>
              <div className="hidden sm:block text-sm font-semibold" style={{ color: "#0F1F3D" }}>Lcda. Soto</div>
              <ChevronDown size={14} style={{ color: "#9AAAC2" }} />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {view === "dashboard"     && <Dashboard />}
          {view === "expedientes"   && <ExpedientesView onSelect={setModal} />}
          {view === "clientes"      && <ClientesView />}
          {view === "configuracion" && <ConfiguracionView />}
        </div>
      </div>
      {modal && <ExpedienteModal exp={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  PORTAL DEL SOLICITANTE
// ═══════════════════════════════════════════════════════════════════════════

const MIS_TRAMITES = [
  {
    numero: "EXP-2024-0451", tipo: "Residencia Permanente", estado: "activo" as EstadoKey,
    fecha: "15 Ene 2024", abogado: "Lcda. Laura Soto", progreso: 60,
    docs: { total: 5, entregados: 3 },
    historial: [
      { fecha: "19 Ene 2024", accion: "Expediente en revisión por el SNM", tipo: "info" },
      { fecha: "15 Ene 2024", accion: "Documentación parcialmente recibida", tipo: "warning" },
      { fecha: "15 Ene 2024", accion: "Expediente creado y abierto", tipo: "success" },
    ],
  },
  {
    numero: "EXP-2024-0288", tipo: "Visa de Inversionista", estado: "aprobado" as EstadoKey,
    fecha: "05 Oct 2023", abogado: "Lcdo. Carlos Pérez", progreso: 100,
    docs: { total: 6, entregados: 6 },
    historial: [
      { fecha: "20 Dic 2023", accion: "Visa aprobada por el SNM", tipo: "success" },
      { fecha: "10 Nov 2023", accion: "Expediente en validación final", tipo: "info" },
      { fecha: "05 Oct 2023", accion: "Expediente creado", tipo: "success" },
    ],
  },
];

const ABOGADOS_DIRECTORIO = [
  { licencia: "LIC-4521", nombre: "Lcda. Ana Ábrego", email: "abogado@sigdim.gov.pa", despacho: "Ábrego & Asociados" },
  { licencia: "LIC-7788", nombre: "Lcdo. Carlos Ruiz", email: "cruiz@sigdim.gov.pa", despacho: "Ruiz Legal" },
];

const PERMISOS_DISPONIBLES: { id: PermisoRepresentacion; label: string; desc: string }[] = [
  { id: "VER_EXPEDIENTE", label: "Ver mi expediente", desc: "Podrá consultar el estado y los documentos de tu trámite." },
  { id: "SUBIR_DOCUMENTOS", label: "Subir documentos", desc: "Podrá adjuntar documentos en tu nombre." },
  { id: "GESTIONAR_TRAMITE", label: "Gestionar el trámite", desc: "Podrá modificar datos y avanzar el estado del trámite." },
  { id: "RECIBIR_NOTIFICACIONES", label: "Recibir notificaciones", desc: "Recibirá alertas sobre cambios de estado del expediente." },
];

const OFICINAS = [
  {
    nombre: "Oficina Central – Ciudad de Panamá",
    direccion: "Ave. Samuel Lewis, Torre BICSA, Piso 14, Marbella",
    horario: "Lun–Vie: 8:00 am – 5:00 pm",
    telefono: "+507 507-1000",
    email: "snm.central@migracion.gob.pa",
    tipo: "Central",
    color: "#1A3A6C",
    servicios: ["Residencias","Naturalizaciones","Pasaportes","Permisos de Trabajo"],
  },
  {
    nombre: "Oficina Regional – Colón",
    direccion: "Calle 11, Ave. del Frente, Edif. MITRADEL, Colón",
    horario: "Lun–Vie: 8:00 am – 4:00 pm",
    telefono: "+507 475-2200",
    email: "snm.colon@migracion.gob.pa",
    tipo: "Regional",
    color: "#2980B9",
    servicios: ["Residencias","Permisos de Trabajo","Consultas generales"],
  },
  {
    nombre: "Oficina Regional – Chiriquí",
    direccion: "Ave. Central, Edificio Gobernación, David, Chiriquí",
    horario: "Lun–Vie: 8:00 am – 4:00 pm",
    telefono: "+507 774-5500",
    email: "snm.chiriqui@migracion.gob.pa",
    tipo: "Regional",
    color: "#2980B9",
    servicios: ["Residencias","Pasaportes","Permisos de Trabajo"],
  },
  {
    nombre: "Aeropuerto Internacional de Tocumen",
    direccion: "Terminal 1, Nivel Llegadas – Tocumen, Panamá",
    horario: "24 horas – 7 días a la semana",
    telefono: "+507 238-4600",
    email: "snm.tocumen@migracion.gob.pa",
    tipo: "Aeropuerto",
    color: "#2E7D32",
    servicios: ["Control migratorio","Entrada y salida del país","Visas de urgencia"],
  },
  {
    nombre: "Frontera Paso Canoas",
    direccion: "Carretera Panamericana, Paso Canoas, Chiriquí",
    horario: "6:00 am – 10:00 pm diario",
    telefono: "+507 727-7740",
    email: "snm.pasoanoas@migracion.gob.pa",
    tipo: "Frontera",
    color: "#B7791F",
    servicios: ["Control migratorio","Entrada y salida terrestre"],
  },
  {
    nombre: "Frontera Guabito – Almirante",
    direccion: "Bocas del Toro, límite con Costa Rica",
    horario: "7:00 am – 9:00 pm diario",
    telefono: "+507 759-8100",
    email: "snm.guabito@migracion.gob.pa",
    tipo: "Frontera",
    color: "#B7791F",
    servicios: ["Control migratorio","Entrada y salida terrestre"],
  },
];

const TRAMITES_CATALOGO = [
  {
    tipo: "Residencia Permanente",
    icon: Home,
    tiempo: "4–8 meses",
    tasaSNM: "B/. 600–900",
    costoEstimado: "B/. 2,500–4,500",
    docs: 10,
    descripcion: "Autoriza al extranjero a residir y trabajar indefinidamente en la República de Panamá.",
    base_legal: "Decreto Ley 3 de 2008, Ley 6 de 2021",
    requisitos: [
      "Pasaporte vigente (original + copia de todas las páginas)",
      "2 fotografías tamaño carnet (fondo blanco, recientes)",
      "Certificado de antecedentes penales del país de origen, apostillado y traducido al español",
      "Certificado de salud emitido por médico idóneo en Panamá (con sello del MINSA)",
      "Estado de cuenta bancario de los últimos 6 meses (solvencia mínima requerida)",
      "Comprobante de domicilio en Panamá (contrato de arrendamiento o factura de servicios)",
      "Declaración jurada de ingresos o fuente de sustento económico",
      "Poder especial notariado otorgado al abogado representante",
      "Pago de tasa de residencia al SNM (B/. 250–900 según categoría)",
      "Formulario de solicitud de residencia (SNM-001) debidamente completado",
    ],
  },
  {
    tipo: "Residencia Provisional",
    icon: Clock,
    tiempo: "2–4 meses",
    tasaSNM: "B/. 250–400",
    costoEstimado: "B/. 1,500–2,800",
    docs: 8,
    descripcion: "Permiso de estadía temporal de hasta 2 años, renovable. Aplica para distintas categorías migratorias.",
    base_legal: "Decreto Ley 3 de 2008, Art. 26",
    requisitos: [
      "Pasaporte vigente (original + copia de todas las páginas)",
      "2 fotografías tamaño carnet (fondo blanco)",
      "Certificado de antecedentes penales del país de origen, apostillado",
      "Certificado de salud emitido por médico idóneo en Panamá",
      "Comprobante de actividad lícita o fuente de ingresos en Panamá",
      "Comprobante de domicilio en Panamá",
      "Poder especial notariado al abogado representante",
      "Pago de tasa al SNM según categoría de residencia provisional",
    ],
  },
  {
    tipo: "Permiso de Trabajo",
    icon: Briefcase,
    tiempo: "2–4 meses",
    tasaSNM: "B/. 400–600",
    costoEstimado: "B/. 2,000–3,500",
    docs: 9,
    descripcion: "Autoriza al extranjero a ejercer actividad laboral remunerada en Panamá bajo relación de dependencia.",
    base_legal: "Código de Trabajo, Ley 6 de 2021, Decreto 26 de 2022",
    requisitos: [
      "Pasaporte vigente (original + copia de todas las páginas)",
      "2 fotografías tamaño carnet (fondo blanco)",
      "Carta de la empresa empleadora en papel membretado (firmada por Representante Legal y notariada)",
      "Contrato de trabajo autenticado por la Dirección General de Trabajo del MITRADEL",
      "Paz y salvo de la Caja del Seguro Social (CSS) a nombre del empleador",
      "Aviso de operación de la empresa empleadora vigente",
      "Certificado de antecedentes penales del país de origen, apostillado",
      "Comprobante de domicilio en Panamá",
      "Poder especial notariado al abogado representante",
    ],
  },
  {
    tipo: "Visa de Inversionista",
    icon: TrendingUp,
    tiempo: "4–8 meses",
    tasaSNM: "B/. 1,000–2,000",
    costoEstimado: "B/. 5,000–10,000",
    docs: 12,
    descripcion: "Para extranjeros que realicen inversión calificada en Panamá. Inversión mínima de B/. 300,000 en bienes raíces o empresa activa.",
    base_legal: "Ley 20 de 2017, Decreto Ejecutivo 722 de 2020",
    requisitos: [
      "Pasaporte vigente (original + copia de todas las páginas)",
      "2 fotografías tamaño carnet (fondo blanco)",
      "Escritura pública de compraventa de bien inmueble o constitución de empresa (autenticada)",
      "Certificado de registro de la propiedad o empresa emitido por el Registro Público de Panamá",
      "Declaración jurada de la inversión ante notario público",
      "Estado de cuenta bancario de los últimos 12 meses",
      "Comprobante de transferencia o depósito de la inversión",
      "Certificado de antecedentes penales del país de origen, apostillado y traducido",
      "Certificado de salud emitido en Panamá",
      "Declaración de renta o equivalente del país de origen (apostillada)",
      "Poder especial notariado al abogado representante",
      "Pago de tasa de residencia de inversionista al SNM",
    ],
  },
  {
    tipo: "Naturalización",
    icon: Star,
    tiempo: "18–36 meses",
    tasaSNM: "B/. 800–1,200",
    costoEstimado: "B/. 3,500–7,000",
    docs: 14,
    descripcion: "Proceso para obtener la ciudadanía panameña. Requiere residencia permanente de al menos 5 años continuos (3 si casado con panameño/a).",
    base_legal: "Constitución de Panamá Art. 10–11, Ley 46 de 2018",
    requisitos: [
      "Pasaporte vigente (original + copia de todas las páginas)",
      "Carné de residencia permanente vigente",
      "Certificado de nacimiento apostillado y traducido al español",
      "Certificado de antecedentes penales del país de origen, apostillado",
      "Certificado de antecedentes penales panameño (Policía Nacional)",
      "Prueba de residencia continua en Panamá (declaraciones juradas + comprobantes)",
      "Constancia de declaración de renta (últimos 3 años)",
      "Acta de matrimonio apostillada (si aplica para la vía conyugal)",
      "Declaración jurada de renuncia a la nacionalidad anterior (ante notario)",
      "Certificado de dominio del idioma español (si el solicitante no es hispanohablante nativo)",
      "Comprobante de participación cívica o arraigo en Panamá",
      "2 fotografías tamaño carnet recientes",
      "Poder especial notariado al abogado representante",
      "Pago de tasa de naturalización al SNM",
    ],
  },
  {
    tipo: "Reunificación Familiar",
    icon: Users,
    tiempo: "3–6 meses",
    tasaSNM: "B/. 400–700",
    costoEstimado: "B/. 2,000–4,000",
    docs: 10,
    descripcion: "Permite a familiares directos (cónyuge e hijos menores) reunirse con el extranjero que ya posee residencia o ciudadanía en Panamá.",
    base_legal: "Decreto Ley 3 de 2008, Art. 49–52",
    requisitos: [
      "Pasaporte vigente del solicitante (original + copia de todas las páginas)",
      "Pasaporte vigente del familiar residente o ciudadano en Panamá",
      "Acta de nacimiento apostillada y traducida (para hijos menores)",
      "Acta de matrimonio apostillada y traducida (para cónyuge)",
      "Certificado de residencia o ciudadanía del familiar en Panamá (emitido por el SNM)",
      "Declaración jurada de dependencia económica (notariada)",
      "Certificado de antecedentes penales del país de origen, apostillado",
      "Certificado de salud emitido en Panamá",
      "Comprobante de domicilio compartido en Panamá",
      "Poder especial notariado al abogado representante",
    ],
  },
];

const tipoOficinaColor: Record<string,string> = { Central:"#1A3A6C", Regional:"#2980B9", Aeropuerto:"#2E7D32", Frontera:"#B7791F" };
const tipoOficinaBg: Record<string,string> = { Central:"#E4EAF4", Regional:"#EBF4FB", Aeropuerto:"#E8F5E9", Frontera:"#FEF3C7" };

function SolicitanteNav({ view, setView, onLogout }: { view: SolicitanteView; setView: (v: SolicitanteView) => void; onLogout: () => void }) {
  const items = [
    { id: "inicio" as const, icon: Home, label: "Inicio" },
    { id: "mistramites" as const, icon: FileText, label: "Mis Trámites" },
    { id: "solicitar" as const, icon: Plus, label: "Nuevo Trámite" },
    { id: "oficinas" as const, icon: MapPin, label: "Oficinas" },
    { id: "ayuda" as const, icon: HelpCircle, label: "Ayuda" },
  ];
  return (
    <div className="h-full flex flex-col" style={{ background: "#0F2550" }}>
      <div className="p-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <SystemLogo size="sm" light />
        <div className="mt-3 px-0">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(41,128,185,0.3)", color: "#7EC8F0" }}>Portal del Solicitante</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-bold uppercase tracking-widest px-3 py-2" style={{ color: "#3F6090" }}>Menú</p>
        {items.map(item => {
          const active = view === item.id;
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setView(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
              style={{ background: active ? "rgba(255,255,255,0.1)" : "transparent", color: active ? "white" : "#7A9CC5", borderLeft: active ? "3px solid #2980B9" : "3px solid transparent" }}>
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          );
        })}
      </nav>
      <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ background: "#2980B9", color: "white" }}>MG</div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">María González</div>
            <div className="text-xs truncate" style={{ color: "#3F6090" }}>Solicitante · 8-742-1923</div>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm" style={{ color: "#7A9CC5" }}
          onMouseEnter={e => (e.currentTarget.style.color="#C0392B")} onMouseLeave={e => (e.currentTarget.style.color="#7A9CC5")}>
          <LogOut size={16} />Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function SolicitanteInicio({ setView, representacion }: { setView: (v: SolicitanteView) => void; representacion: Representacion | null }) {
  const tramite = MIS_TRAMITES[0];
  const cfg = estadoConfig[tramite.estado];
  const steps = ["Recibido","Documentación","En Revisión","Decisión","Resolución"];
  const currentStep = 2;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-extrabold text-xl" style={{ color: "#0F1F3D" }}>Bienvenida, María</h1>
        <p className="text-sm mt-0.5" style={{ color: "#5A6E8C" }}>Aquí puedes ver el estado de tus trámites migratorios</p>
      </div>

      {/* Status card principal */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(26,58,108,0.1)" }}>
        <div className="p-5" style={{ background: "linear-gradient(135deg, #0F2550 0%, #1A3A6C 100%)" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>TRÁMITE ACTIVO</p>
              <h2 className="text-white font-extrabold text-lg">{tramite.tipo}</h2>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{tramite.numero}</span> · {tramite.abogado}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
          </div>
          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              <span>Progreso general</span><span>{tramite.progreso}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${tramite.progreso}%`, background: "linear-gradient(90deg, #2980B9, #7EC8F0)" }} />
            </div>
          </div>
        </div>
        {/* Steps */}
        <div className="bg-white px-5 py-4">
          <div className="flex items-center">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                    style={{ background: i < currentStep ? "#1A3A6C" : i === currentStep ? "#2980B9" : "#E8EDF6", color: i <= currentStep ? "white" : "#9AAAC2" }}>
                    {i < currentStep ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className="text-[10px] font-semibold text-center leading-tight whitespace-nowrap" style={{ color: i <= currentStep ? "#1A3A6C" : "#9AAAC2" }}>{step}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 mb-4 rounded-full" style={{ background: i < currentStep ? "#1A3A6C" : "#E8EDF6" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Mis Trámites", icon: FileText, view: "mistramites" as SolicitanteView, color: "#1A3A6C", bg: "#E4EAF4" },
          { label: "Nuevo Trámite", icon: Plus, view: "solicitar" as SolicitanteView, color: "#2E7D32", bg: "#E8F5E9" },
          representacion
            ? { label: "Mi Abogado", icon: UserCheck, view: "miabogado" as SolicitanteView, color: "#2980B9", bg: "#E3F2FD" }
            : { label: "Asignar Abogado", icon: UserCheck, view: "asignarabogado" as SolicitanteView, color: "#2980B9", bg: "#E3F2FD" },
          { label: "Oficinas SNM", icon: MapPin, view: "oficinas" as SolicitanteView, color: "#B7791F", bg: "#FEF3C7" },
          { label: "Centro de Ayuda", icon: HelpCircle, view: "ayuda" as SolicitanteView, color: "#6D28D9", bg: "#EDE9FE" },
        ].map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => setView(a.view)}
              className="rounded-xl p-4 bg-card border flex flex-col items-start gap-3 transition-all text-left"
              style={{ borderColor: "rgba(26,58,108,0.08)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=a.color; e.currentTarget.style.background=a.bg; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(26,58,108,0.08)"; e.currentTarget.style.background="white"; }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: a.bg }}>
                <Icon size={18} style={{ color: a.color }} />
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: "#0F1F3D" }}>{a.label}</div>
                <ArrowUpRight size={12} style={{ color: "#9AAAC2" }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Docs pendientes */}
      <div className="rounded-xl p-5 bg-card border" style={{ borderColor: "rgba(192,57,43,0.2)", background: "#FFFAF9" }}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#FDECEA" }}>
            <AlertCircle size={18} style={{ color: "#C0392B" }} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-0.5" style={{ color: "#C0392B" }}>Documentos pendientes de entrega</h3>
            <p className="text-sm" style={{ color: "#5A6E8C" }}>Tu trámite <strong>EXP-2024-0451</strong> requiere 2 documentos adicionales para continuar el proceso.</p>
            <div className="flex gap-2 mt-3">
              {["Antecedentes penales","Fotos tamaño carnet"].map(d => (
                <span key={d} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#FDECEA", color: "#C0392B" }}>{d}</span>
              ))}
            </div>
          </div>
          <button className="text-xs font-bold px-3 py-2 rounded-lg flex-shrink-0" style={{ background: "#C0392B", color: "white" }}>Subir ahora</button>
        </div>
      </div>
    </div>
  );
}

function SolicitanteMisTramites() {
  const [selected, setSelected] = useState<typeof MIS_TRAMITES[0] | null>(null);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-extrabold text-xl" style={{ color: "#0F1F3D" }}>Mis Trámites</h1>
        <p className="text-sm mt-0.5" style={{ color: "#5A6E8C" }}>Seguimiento detallado de todos tus expedientes</p>
      </div>

      <div className="space-y-3">
        {MIS_TRAMITES.map(t => {
          const cfg = estadoConfig[t.estado];
          const Icon = cfg.icon;
          const isOpen = selected?.numero === t.numero;
          return (
            <div key={t.numero} className="rounded-xl bg-card border overflow-hidden transition-all" style={{ borderColor: isOpen ? "#1A3A6C" : "rgba(26,58,108,0.08)" }}>
              <button className="w-full text-left p-5" onClick={() => setSelected(isOpen ? null : t)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                      <Icon size={20} style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: "#0F1F3D" }}>{t.tipo}</span>
                        <StatusBadge estado={t.estado} />
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "#9AAAC2", fontFamily: "JetBrains Mono, monospace" }}>{t.numero} · Iniciado {t.fecha}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-semibold" style={{ color: "#0F1F3D" }}>{t.docs.entregados}/{t.docs.total} docs</div>
                      <div className="text-xs" style={{ color: "#9AAAC2" }}>entregados</div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#F0F3F8" }}>
                      {isOpen ? <ChevronDown size={16} style={{ color: "#1A3A6C" }} /> : <ChevronRight size={16} style={{ color: "#9AAAC2" }} />}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: "#E8EDF6" }}>
                    <div className="h-full rounded-full" style={{ width: `${t.progreso}%`, background: t.progreso===100?"#2E7D32":"#1A3A6C" }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: t.progreso===100?"#2E7D32":"#1A3A6C" }}>{t.progreso}%</span>
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid rgba(26,58,108,0.08)" }}>
                  <div className="grid grid-cols-3 gap-3 pt-4">
                    <div className="p-3 rounded-xl" style={{ background: "#F7F9FC" }}>
                      <div className="text-xs font-semibold" style={{ color: "#9AAAC2" }}>Abogado asignado</div>
                      <div className="text-sm font-bold mt-0.5" style={{ color: "#0F1F3D" }}>{t.abogado}</div>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: "#F7F9FC" }}>
                      <div className="text-xs font-semibold" style={{ color: "#9AAAC2" }}>Documentos</div>
                      <div className="text-sm font-bold mt-0.5" style={{ color: "#0F1F3D" }}>{t.docs.entregados} de {t.docs.total}</div>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: "#F7F9FC" }}>
                      <div className="text-xs font-semibold" style={{ color: "#9AAAC2" }}>Fecha de inicio</div>
                      <div className="text-sm font-bold mt-0.5" style={{ color: "#0F1F3D" }}>{t.fecha}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#9AAAC2" }}>Historial del expediente</h4>
                    <div className="relative pl-4 space-y-3">
                      <div className="absolute left-1.5 top-2 bottom-2 w-0.5 rounded-full" style={{ background: "#E8EDF6" }} />
                      {t.historial.map((h, i) => {
                        const hColors: Record<string,string> = { success:"#2E7D32", info:"#1A3A6C", warning:"#B7791F" };
                        return (
                          <div key={i} className="relative flex items-start gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5 -ml-1.5 border-2 border-white" style={{ background: hColors[h.tipo] }} />
                            <div className="flex-1">
                              <div className="text-sm font-medium" style={{ color: "#0F1F3D" }}>{h.accion}</div>
                              <div className="text-xs" style={{ color: "#9AAAC2" }}>{h.fecha}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border" style={{ color: "#1A3A6C", borderColor: "#D0D9EA" }}><Upload size={14} />Subir documentos</button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border" style={{ color: "#5A6E8C", borderColor: "#D0D9EA" }}><MessageSquare size={14} />Contactar abogado</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SolicitanteSolicitar() {
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-extrabold text-xl" style={{ color: "#0F1F3D" }}>Solicitar Nuevo Trámite</h1>
        <p className="text-sm mt-0.5" style={{ color: "#5A6E8C" }}>Elige el tipo de trámite que deseas iniciar</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-2">
        {[1,2,3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: step>=s?"#1A3A6C":"#E8EDF6", color: step>=s?"white":"#9AAAC2" }}>{step>s?<CheckCircle size={14}/>:s}</div>
              <span className="text-xs font-semibold" style={{ color: step>=s?"#1A3A6C":"#9AAAC2" }}>{s===1?"Tipo de trámite":s===2?"Datos personales":"Confirmación"}</span>
            </div>
            {s<3&&<div className="w-8 h-0.5 rounded" style={{ background: step>s?"#1A3A6C":"#E8EDF6" }}/>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRAMITES_CATALOGO.map(tr => {
              const Icon = tr.icon;
              const isSelected = selected === tr.tipo;
              return (
                <button key={tr.tipo} onClick={() => setSelected(tr.tipo)}
                  className="rounded-xl p-5 text-left border transition-all"
                  style={{ background: isSelected ? "#E4EAF4" : "white", borderColor: isSelected ? "#1A3A6C" : "rgba(26,58,108,0.08)", borderWidth: isSelected ? 2 : 1 }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isSelected?"#1A3A6C":"#F0F3F8" }}>
                      <Icon size={20} style={{ color: isSelected?"white":"#5A6E8C" }} />
                    </div>
                    {isSelected && <CheckCircle size={18} style={{ color: "#1A3A6C" }} />}
                  </div>
                  <div className="font-bold text-sm mb-1" style={{ color: "#0F1F3D" }}>{tr.tipo}</div>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: "#5A6E8C" }}>{tr.descripcion}</p>

                  {/* Cost & time */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded-lg p-2 text-center" style={{ background: isSelected?"rgba(26,58,108,0.08)":"#F7F9FC" }}>
                      <div className="text-xs font-bold" style={{ color: "#0F1F3D" }}>{tr.tiempo}</div>
                      <div className="text-[10px]" style={{ color: "#9AAAC2" }}>Duración</div>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{ background: isSelected?"rgba(26,58,108,0.08)":"#F7F9FC" }}>
                      <div className="text-xs font-bold" style={{ color: "#0F1F3D" }}>{tr.tasaSNM}</div>
                      <div className="text-[10px]" style={{ color: "#9AAAC2" }}>Tasa SNM</div>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{ background: isSelected?"rgba(26,58,108,0.08)":"#F7F9FC" }}>
                      <div className="text-xs font-bold" style={{ color: "#0F1F3D" }}>{tr.docs} docs</div>
                      <div className="text-[10px]" style={{ color: "#9AAAC2" }}>Requeridos</div>
                    </div>
                  </div>

                  {/* Costo estimado total */}
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(26,58,108,0.08)" }}>
                    <span className="text-xs" style={{ color: "#9AAAC2" }}>Costo estimado total</span>
                    <span className="text-xs font-bold" style={{ color: isSelected?"#1A3A6C":"#0F1F3D" }}>{tr.costoEstimado}</span>
                  </div>

                  {/* Requirements preview on selection */}
                  {isSelected && (
                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(26,58,108,0.12)" }}>
                      <p className="text-xs font-bold mb-2" style={{ color: "#1A3A6C" }}>Documentos requeridos:</p>
                      <ul className="space-y-1">
                        {tr.requisitos.slice(0, 5).map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "#5A6E8C" }}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#1A3A6C" }} />
                            {r}
                          </li>
                        ))}
                        {tr.requisitos.length > 5 && (
                          <li className="text-xs font-semibold" style={{ color: "#1A3A6C" }}>+ {tr.requisitos.length - 5} documentos más…</li>
                        )}
                      </ul>
                      <p className="text-[10px] mt-2" style={{ color: "#9AAAC2" }}>Base legal: {tr.base_legal}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end">
            <button onClick={() => { if(selected) setStep(2); }}
              disabled={!selected}
              className="px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2"
              style={{ background: selected?"#1A3A6C":"#D0D9EA", color: "white" }}>
              Continuar <ArrowRight size={15} />
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Form */}
          <div className="space-y-4">
            <div className="rounded-xl p-4 border flex items-center gap-3" style={{ background: "#F0F7FF", borderColor: "#D0E4F7" }}>
              <Info size={16} style={{ color: "#1A3A6C", flexShrink: 0 }} />
              <p className="text-sm" style={{ color: "#1A3A6C" }}>Trámite: <strong>{selected}</strong></p>
              <button onClick={() => setStep(1)} className="ml-auto text-xs font-semibold" style={{ color: "#1A3A6C" }}>Cambiar</button>
            </div>
            {[
              { label: "Nombre completo (como aparece en el pasaporte)", ph: "Ej. James William Scott", type: "text" },
              { label: "Número de pasaporte", ph: "Ej. AB1234567", type: "text", note: "El número debe coincidir exactamente con su documento de viaje." },
              { label: "País de emisión del pasaporte", ph: "Ej. Estados Unidos", type: "text" },
              { label: "Fecha de vencimiento del pasaporte", ph: "DD/MM/AAAA", type: "text" },
              { label: "Nacionalidad", ph: "Ej. Estadounidense", type: "text" },
              { label: "Correo electrónico de contacto", ph: "correo@ejemplo.com", type: "email" },
              { label: "Teléfono (con código de país)", ph: "+507 6000-0000", type: "tel" },
              { label: "Dirección de residencia en Panamá", ph: "Calle, Urbanización, Corregimiento", type: "text" },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F1F3D" }}>{f.label}</label>
                <input type={f.type} placeholder={f.ph} className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none" style={{ border: "1.5px solid #D0D9EA", fontFamily: "inherit", color: "#0F1F3D", background: "#F7F9FC" }} />
                {f.note && <p className="text-xs mt-1" style={{ color: "#9AAAC2" }}>{f.note}</p>}
              </div>
            ))}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F1F3D" }}>Comentarios adicionales (opcional)</label>
              <textarea rows={3} placeholder="Describe brevemente tu situación migratoria actual o cualquier detalle relevante para tu solicitud…" className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none resize-none" style={{ border: "1.5px solid #D0D9EA", fontFamily: "inherit", color: "#0F1F3D", background: "#F7F9FC" }} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5" style={{ background: "#F0F3F8", color: "#5A6E8C" }}><ChevronLeft size={15}/>Atrás</button>
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2" style={{ background: "#1A3A6C", color: "white" }}>Revisar solicitud <ArrowRight size={15}/></button>
            </div>
          </div>

          {/* Requirements sidebar */}
          {(() => {
            const tr = TRAMITES_CATALOGO.find(t => t.tipo === selected);
            if (!tr) return null;
            return (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(26,58,108,0.1)" }}>
                <div className="px-4 py-3" style={{ background: "#1A3A6C" }}>
                  <p className="text-xs font-bold text-white uppercase tracking-wide">Documentos requeridos</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{tr.tipo} · {tr.docs} documentos</p>
                </div>
                <div className="p-4 space-y-2" style={{ background: "#F7F9FC" }}>
                  {tr.requisitos.map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#E4EAF4" }}>
                        <span className="text-[10px] font-bold" style={{ color: "#1A3A6C" }}>{i + 1}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "#5A6E8C" }}>{r}</p>
                    </div>
                  ))}
                  <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: "1px solid rgba(26,58,108,0.08)" }}>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "#9AAAC2" }}>Tasa oficial SNM</span>
                      <span className="font-bold" style={{ color: "#0F1F3D" }}>{tr.tasaSNM}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "#9AAAC2" }}>Costo estimado total</span>
                      <span className="font-bold" style={{ color: "#1A3A6C" }}>{tr.costoEstimado}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "#9AAAC2" }}>Tiempo estimado</span>
                      <span className="font-bold" style={{ color: "#0F1F3D" }}>{tr.tiempo}</span>
                    </div>
                    <p className="text-[10px] pt-1" style={{ color: "#9AAAC2" }}>Base legal: {tr.base_legal}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {step === 3 && (
        <div className="max-w-lg space-y-4">
          <div className="rounded-xl p-5 bg-card border space-y-3" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
            <h3 className="font-bold text-sm" style={{ color: "#0F1F3D" }}>Resumen de tu solicitud</h3>
            {[
              { label: "Tipo de trámite", value: selected },
              { label: "Nombre completo", value: "James William Scott" },
              { label: "Número de pasaporte", value: "AB1234567" },
              { label: "País de emisión", value: "Estados Unidos" },
              { label: "Nacionalidad", value: "Estadounidense" },
              { label: "Correo electrónico", value: "jwscott@email.com" },
              { label: "Teléfono", value: "+1 (305) 800-0000" },
            ].map(f => (
              <div key={f.label} className="flex justify-between text-sm py-2" style={{ borderBottom: "1px solid rgba(26,58,108,0.06)" }}>
                <span style={{ color: "#5A6E8C" }}>{f.label}</span>
                <span className="font-semibold" style={{ color: "#0F1F3D" }}>{f.value}</span>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "#E8F5E9", border: "1px solid #C8E6C9" }}>
            <CheckCircle size={16} style={{ color: "#2E7D32", flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: "#2E7D32" }}>Una vez enviada tu solicitud, un abogado del despacho se pondrá en contacto contigo en un plazo de <strong>1–2 días hábiles</strong>.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5" style={{ background: "#F0F3F8", color: "#5A6E8C" }}><ChevronLeft size={15}/>Atrás</button>
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 text-white" style={{ background: "#2E7D32" }}><Send size={15}/>Enviar solicitud</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SolicitanteOficinas() {
  const [filtroTipo, setFiltroTipo] = useState("Todas");
  const tipos = ["Todas","Central","Regional","Aeropuerto","Frontera"];
  const filtered = filtroTipo === "Todas" ? OFICINAS : OFICINAS.filter(o => o.tipo === filtroTipo);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-extrabold text-xl" style={{ color: "#0F1F3D" }}>Oficinas del SNM</h1>
        <p className="text-sm mt-0.5" style={{ color: "#5A6E8C" }}>Ubicaciones y horarios de atención del Servicio Nacional de Migración</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {tipos.map(t => (
          <button key={t} onClick={() => setFiltroTipo(t)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{ background: filtroTipo===t?"#1A3A6C":"white", color: filtroTipo===t?"white":"#5A6E8C", border: filtroTipo===t?"none":"1px solid #D0D9EA" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Map placeholder */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(26,58,108,0.1)", height: 200, background: "linear-gradient(135deg, #E4EAF4 0%, #EBF4FB 100%)", position:"relative" }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Navigation size={32} style={{ color: "#1A3A6C" }} />
          <p className="text-sm font-semibold" style={{ color: "#1A3A6C" }}>Mapa interactivo de oficinas</p>
          <p className="text-xs" style={{ color: "#5A6E8C" }}>República de Panamá — {OFICINAS.length} ubicaciones</p>
          <div className="flex gap-2 mt-1">
            {OFICINAS.slice(0,4).map(o => (
              <div key={o.nombre} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: tipoOficinaColor[o.tipo] }} />
              </div>
            ))}
          </div>
        </div>
        {/* Decorative pin dots */}
        {[{x:"20%",y:"45%",tipo:"Central"},{x:"30%",y:"28%",tipo:"Regional"},{x:"12%",y:"62%",tipo:"Regional"},{x:"48%",y:"60%",tipo:"Aeropuerto"},{x:"11%",y:"76%",tipo:"Frontera"},{x:"35%",y:"18%",tipo:"Frontera"}].map((p,i)=>(
          <div key={i} className="absolute" style={{ left:p.x, top:p.y }}>
            <div className="w-4 h-4 rounded-full border-2 border-white shadow-md" style={{ background: tipoOficinaColor[p.tipo] }} />
          </div>
        ))}
      </div>

      {/* Office cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(o => (
          <div key={o.nombre} className="rounded-xl p-5 bg-card border" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tipoOficinaBg[o.tipo] }}>
                <Building2 size={20} style={{ color: tipoOficinaColor[o.tipo] }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm leading-tight" style={{ color: "#0F1F3D" }}>{o.nombre}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ background: tipoOficinaBg[o.tipo], color: tipoOficinaColor[o.tipo] }}>{o.tipo}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs" style={{ color: "#5A6E8C" }}>
              <div className="flex items-start gap-2"><MapPin size={13} style={{ flexShrink:0, marginTop:1, color:"#9AAAC2" }} /><span>{o.direccion}</span></div>
              <div className="flex items-center gap-2"><Clock size={13} style={{ flexShrink:0, color:"#9AAAC2" }} /><span>{o.horario}</span></div>
              <div className="flex items-center gap-2"><Phone size={13} style={{ flexShrink:0, color:"#9AAAC2" }} /><span>{o.telefono}</span></div>
              <div className="flex items-center gap-2"><Mail size={13} style={{ flexShrink:0, color:"#9AAAC2" }} /><span>{o.email}</span></div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {o.servicios.map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#F0F3F8", color: "#5A6E8C" }}>{s}</span>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: tipoOficinaBg[o.tipo], color: tipoOficinaColor[o.tipo] }}>
                <Navigation size={12}/>Ver en mapa
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#F0F3F8", color: "#5A6E8C" }}>
                <Phone size={12}/>Llamar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info footer */}
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#F0F7FF", border: "1px solid #D0E4F7" }}>
        <Info size={16} style={{ color: "#1A3A6C", flexShrink: 0, marginTop: 1 }} />
        <div className="text-sm" style={{ color: "#1A3A6C" }}>
          <strong>Nota:</strong> Para trámites de residencia y naturalización es recomendable agendar cita previa llamando al número de cada oficina o a través del portal web del SNM en <span className="font-semibold underline cursor-pointer">migracion.gob.pa</span>.
        </div>
      </div>
    </div>
  );
}

function SolicitanteAyuda() {
  const faqs = [
    { q: "¿Cuánto tiempo toma el proceso de residencia permanente?", a: "El proceso generalmente toma entre 3 y 6 meses, dependiendo de la completitud de los documentos y la carga de trabajo del SNM." },
    { q: "¿Qué documentos necesito para iniciar mi trámite?", a: "Depende del tipo de trámite. Al seleccionar el tipo en el formulario de solicitud, se mostrará la lista completa de documentos requeridos." },
    { q: "¿Puedo hacer mi trámite sin un abogado?", a: "Para algunos trámites sencillos es posible. Sin embargo, se recomienda contar con representación legal para asegurar que el proceso sea exitoso." },
    { q: "¿Cómo sé el estado de mi expediente?", a: "Puedes verlo en la sección 'Mis Trámites' de este portal. También recibirás notificaciones por correo electrónico cuando haya cambios." },
    { q: "¿Cuánto cuesta el proceso de naturalización?", a: "La tasa oficial es de B/. 350.00 más los honorarios del abogado. Los costos pueden variar según la complejidad del caso." },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="font-extrabold text-xl" style={{ color: "#0F1F3D" }}>Centro de Ayuda</h1>
        <p className="text-sm mt-0.5" style={{ color: "#5A6E8C" }}>Respuestas a las preguntas más frecuentes sobre trámites migratorios</p>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Phone, label: "Llámanos", detail: "+507 507-1000", color: "#1A3A6C", bg: "#E4EAF4" },
          { icon: Mail, label: "Escríbenos", detail: "soporte@siddim.pa", color: "#2E7D32", bg: "#E8F5E9" },
          { icon: MessageSquare, label: "Chat en vivo", detail: "Lun–Vie 8am–5pm", color: "#6D28D9", bg: "#EDE9FE" },
        ].map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl p-4 bg-card border flex items-center gap-3" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}>
                <Icon size={18} style={{ color: c.color }} />
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: "#0F1F3D" }}>{c.label}</div>
                <div className="text-xs" style={{ color: "#5A6E8C" }}>{c.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQs */}
      <div className="space-y-2">
        <h3 className="font-bold text-sm mb-3" style={{ color: "#0F1F3D" }}>Preguntas frecuentes</h3>
        {faqs.map((f, i) => (
          <FaqItem key={i} q={f.q} a={f.a} />
        ))}
      </div>

      {/* Links */}
      <div className="rounded-xl p-5 bg-card border" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
        <h3 className="font-bold text-sm mb-3" style={{ color: "#0F1F3D" }}>Recursos útiles</h3>
        <div className="space-y-2">
          {[
            "Portal oficial del SNM — migracion.gob.pa",
            "Requisitos por tipo de visa — SNM",
            "Aranceles y tasas migratorias 2024",
            "Consulta de cédula — Tribunal Electoral",
          ].map(l => (
            <button key={l} className="w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium text-left transition-all" style={{ color: "#1A3A6C" }}
              onMouseEnter={e => (e.currentTarget.style.background="#F0F3F8")} onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
              {l}<ExternalLink size={13} style={{ flexShrink:0, color:"#9AAAC2" }}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-card border overflow-hidden" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
      <button className="w-full text-left p-4 flex items-start justify-between gap-3" onClick={() => setOpen(!open)}>
        <span className="text-sm font-semibold" style={{ color: "#0F1F3D" }}>{q}</span>
        <div className="flex-shrink-0 mt-0.5 transition-transform" style={{ transform: open?"rotate(180deg)":"rotate(0deg)" }}>
          <ChevronDown size={16} style={{ color: "#9AAAC2" }} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm" style={{ color: "#5A6E8C" }}>{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── ASIGNAR ABOGADO (Pantalla 1) ─────────────────────────────────────────

function SolicitanteAsignarAbogado({ setView, onAsignar }: { setView: (v: SolicitanteView) => void; onAsignar: (r: Representacion) => void }) {
  const [licencia, setLicencia] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [resultado, setResultado] = useState<typeof ABOGADOS_DIRECTORIO[0] | null>(null);
  const [permisos, setPermisos] = useState<PermisoRepresentacion[]>([]);
  const [asignando, setAsignando] = useState(false);

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    setBuscando(true);
    setTimeout(() => {
      const encontrado = ABOGADOS_DIRECTORIO.find(a => a.licencia.toLowerCase() === licencia.trim().toLowerCase());
      setResultado(encontrado ?? null);
      setPermisos([]);
      setBuscando(false);
      setBuscado(true);
    }, 600);
  };

  const togglePermiso = (id: PermisoRepresentacion) => {
    setPermisos(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const asignar = () => {
    if (!resultado || permisos.length === 0) return;
    setAsignando(true);
    setTimeout(() => {
      onAsignar({
        abogado: resultado,
        permisos,
        fecha: new Date().toLocaleDateString("es-PA", { day: "2-digit", month: "short", year: "numeric" }),
      });
      setAsignando(false);
      setView("miabogado");
    }, 800);
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="font-extrabold text-xl" style={{ color: "#0F1F3D" }}>Asignar Abogado</h1>
        <p className="text-sm mt-0.5" style={{ color: "#5A6E8C" }}>Busca a tu abogado por su número de licencia y define qué podrá hacer en tu nombre.</p>
      </div>

      <form onSubmit={buscar} className="rounded-xl p-5 bg-card border space-y-3" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
        <label className="block text-sm font-semibold" style={{ color: "#0F1F3D" }}>Número de licencia</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AAAC2" }} />
            <input type="text" value={licencia} onChange={e => { setLicencia(e.target.value); setBuscado(false); }}
              placeholder="Ej. LIC-4521"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border outline-none"
              style={{ border: "1.5px solid #D0D9EA", background: "#F7F9FC", color: "#0F1F3D" }} />
          </div>
          <button type="submit" disabled={!licencia.trim() || buscando}
            className="px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 flex-shrink-0"
            style={{ background: !licencia.trim() || buscando ? "#9AAAC2" : "#1A3A6C", color: "white" }}>
            {buscando ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            Buscar
          </button>
        </div>
      </form>

      {buscado && !resultado && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#FDECEA", border: "1px solid rgba(192,57,43,0.2)" }}>
          <AlertCircle size={18} style={{ color: "#C0392B" }} />
          <p className="text-sm" style={{ color: "#C0392B" }}>No se encontró ningún abogado con la licencia <strong>{licencia}</strong>.</p>
        </div>
      )}

      {resultado && (
        <div className="rounded-xl bg-card border p-5 space-y-4" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: "#E4EAF4", color: "#1A3A6C" }}>
              {resultado.nombre.split(" ").slice(-2).map(p => p[0]).join("")}
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: "#0F1F3D" }}>{resultado.nombre}</div>
              <div className="text-xs" style={{ color: "#9AAAC2" }}>{resultado.despacho} · {resultado.licencia}</div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#9AAAC2" }}>Permisos a otorgar</h4>
            <div className="space-y-2">
              {PERMISOS_DISPONIBLES.map(p => (
                <label key={p.id} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                  style={{ borderColor: permisos.includes(p.id) ? "#1A3A6C" : "#E0E6F0", background: permisos.includes(p.id) ? "#F0F3F8" : "white" }}>
                  <input type="checkbox" checked={permisos.includes(p.id)} onChange={() => togglePermiso(p.id)}
                    className="w-4 h-4 rounded mt-0.5" style={{ accentColor: "#1A3A6C" }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#0F1F3D" }}>{p.label}</div>
                    <div className="text-xs" style={{ color: "#5A6E8C" }}>{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button onClick={asignar} disabled={permisos.length === 0 || asignando}
            className="w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: permisos.length === 0 || asignando ? "#9AAAC2" : "#1A3A6C", color: "white" }}>
            {asignando ? <><RefreshCw size={14} className="animate-spin" />Asignando...</> : <>Asignar como mi representante <ArrowRight size={14} /></>}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MI ABOGADO + REVOCAR (Pantalla 2) ────────────────────────────────────

function SolicitanteMiAbogado({ representacion, setView, onRevocar }: { representacion: Representacion | null; setView: (v: SolicitanteView) => void; onRevocar: () => void }) {
  const [confirmando, setConfirmando] = useState(false);
  const [revocando, setRevocando] = useState(false);

  if (!representacion) {
    return (
      <div className="space-y-4 max-w-xl">
        <h1 className="font-extrabold text-xl" style={{ color: "#0F1F3D" }}>Mi Abogado</h1>
        <div className="rounded-xl p-6 bg-card border text-center" style={{ borderColor: "rgba(26,58,108,0.08)" }}>
          <p className="text-sm mb-4" style={{ color: "#5A6E8C" }}>Todavía no has asignado un abogado representante.</p>
          <button onClick={() => setView("asignarabogado")} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: "#1A3A6C", color: "white" }}>Asignar abogado</button>
        </div>
      </div>
    );
  }

  const revocar = () => {
    setRevocando(true);
    setTimeout(() => {
      onRevocar();
      setRevocando(false);
      setConfirmando(false);
    }, 700);
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="font-extrabold text-xl" style={{ color: "#0F1F3D" }}>Mi Abogado</h1>
        <p className="text-sm mt-0.5" style={{ color: "#5A6E8C" }}>Expediente de representación vigente y los permisos que le otorgaste.</p>
      </div>

      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(26,58,108,0.1)" }}>
        <div className="p-5 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0F2550 0%, #1A3A6C 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
              {representacion.abogado.nombre.split(" ").slice(-2).map(p => p[0]).join("")}
            </div>
            <div>
              <div className="text-white font-bold text-sm">{representacion.abogado.nombre}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{representacion.abogado.despacho} · {representacion.abogado.licencia}</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "#E8F5E9", color: "#2E7D32" }}>Activa</span>
        </div>
        <div className="bg-white p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ background: "#F7F9FC" }}>
              <div className="text-xs font-semibold" style={{ color: "#9AAAC2" }}>Correo</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: "#0F1F3D" }}>{representacion.abogado.email}</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "#F7F9FC" }}>
              <div className="text-xs font-semibold" style={{ color: "#9AAAC2" }}>Asignado desde</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: "#0F1F3D" }}>{representacion.fecha}</div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#9AAAC2" }}>Permisos otorgados</h4>
            <div className="space-y-2">
              {PERMISOS_DISPONIBLES.map(p => {
                const otorgado = representacion.permisos.includes(p.id);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: otorgado ? "#F0F3F8" : "transparent", opacity: otorgado ? 1 : 0.5 }}>
                    {otorgado ? <CheckCircle size={16} style={{ color: "#2E7D32" }} /> : <XCircle size={16} style={{ color: "#9AAAC2" }} />}
                    <span className="text-sm font-medium" style={{ color: "#0F1F3D" }}>{p.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {!confirmando ? (
        <button onClick={() => setConfirmando(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border"
          style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.3)" }}>
          <XCircle size={15} />Revocar representación
        </button>
      ) : (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#FFFAF9", border: "1px solid rgba(192,57,43,0.2)" }}>
          <p className="text-sm" style={{ color: "#C0392B" }}>¿Seguro que deseas revocar la representación de <strong>{representacion.abogado.nombre}</strong>? Perderá acceso inmediato a tu expediente.</p>
          <div className="flex gap-2">
            <button onClick={revocar} disabled={revocando}
              className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2" style={{ background: "#C0392B", color: "white" }}>
              {revocando ? <><RefreshCw size={14} className="animate-spin" />Revocando...</> : "Sí, revocar"}
            </button>
            <button onClick={() => setConfirmando(false)} className="px-4 py-2 rounded-lg text-sm font-bold border" style={{ color: "#5A6E8C", borderColor: "#D0D9EA" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SOLICITANTE LAYOUT ────────────────────────────────────────────────────

function SolicitanteLayout({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<SolicitanteView>("inicio");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [representacion, setRepresentacion] = useState<Representacion | null>(null);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F3F8" }}>
      <div className="hidden lg:block w-56 flex-shrink-0 h-full">
        <SolicitanteNav view={view} setView={setView} onLogout={onLogout} />
      </div>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(15,31,61,0.5)" }} />
          <div className="absolute left-0 top-0 h-full w-56 z-50">
            <SolicitanteNav view={view} setView={v => { setView(v); setSidebarOpen(false); }} onLogout={onLogout} />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center justify-between px-5 py-3 bg-white flex-shrink-0" style={{ borderBottom: "1px solid rgba(26,58,108,0.08)" }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded-lg" style={{ color: "#5A6E8C" }} onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="flex items-center gap-2">
              <div className="h-8 rounded-lg bg-white px-1.5 py-1 shadow-sm">
                <img src="/logoSIGDIM.png" alt="SIGDIM" className="h-full w-auto object-contain" />
              </div>
              <span className="text-xs font-bold hidden sm:block" style={{ color: "#5A6E8C" }}>SIGDIM — Portal del Solicitante</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg" style={{ color: "#5A6E8C" }}>
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#C0392B" }} />
            </button>
            <div className="flex items-center gap-2 pl-3" style={{ borderLeft: "1px solid #E0E6F0" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: "#2980B9", color: "white" }}>MG</div>
              <div className="hidden sm:block text-sm font-semibold" style={{ color: "#0F1F3D" }}>María González</div>
              <ChevronDown size={14} style={{ color: "#9AAAC2" }} />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {view === "inicio"         && <SolicitanteInicio setView={setView} representacion={representacion} />}
          {view === "mistramites"    && <SolicitanteMisTramites />}
          {view === "solicitar"      && <SolicitanteSolicitar />}
          {view === "oficinas"       && <SolicitanteOficinas />}
          {view === "ayuda"          && <SolicitanteAyuda />}
          {view === "asignarabogado" && <SolicitanteAsignarAbogado setView={setView} onAsignar={setRepresentacion} />}
          {view === "miabogado"      && <SolicitanteMiAbogado representacion={representacion} setView={setView} onRevocar={() => setRepresentacion(null)} />}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────

export default function App() {
  const [role, setRole] = useState<AppRole>(null);
  if (!role) return <LoginScreen onLogin={r => setRole(r)} />;
  if (role === "abogado") return <AbogadoLayout onLogout={() => setRole(null)} />;
  return <SolicitanteLayout onLogout={() => setRole(null)} />;
}
