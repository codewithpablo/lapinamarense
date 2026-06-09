'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileAPI } from '@/lib/api';
import Sidebar from '@/components/admin/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User, Mail, Phone, Lock, CheckCircle, Loader2,
  AlertCircle, ShieldCheck, AtSign, Eye, EyeOff, Camera,
  Briefcase, Crown, KeyRound, BadgeCheck,
} from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin', admin: 'Administrador', empleado: 'Empleado', cliente: 'Cliente',
};

function Field({ label, icon: Icon, value, onChange, type = 'text', placeholder = '' }: any) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <Input type={type} value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
          className="pl-8 h-9 text-sm border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
      </div>
    </div>
  );
}

function PwField({ label, value, onChange, show, onToggle, placeholder = '••••••••' }:
  { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-8 pr-10 h-9 text-sm border-gray-200 bg-gray-50 focus:bg-white transition-colors"
        />
        <button type="button" onClick={onToggle} tabIndex={-1}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={show ? 'Ocultar' : 'Mostrar'}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-green-700 hover:bg-green-50 transition-colors">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function Alert({ m }: { m: { type: 'ok' | 'err'; text: string } }) {
  return (
    <div className={`flex items-center gap-2 mt-3 text-xs rounded-xl px-3 py-2 ${m.type === 'ok' ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
      {m.type === 'ok' ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
      {m.text}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, color = 'text-green-700', bg = 'bg-green-50' }: any) {
  return (
    <div className={`${bg} rounded-xl p-3 flex items-start gap-3`}>
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-gray-900 leading-tight truncate">{value}</p>
        <p className="text-[10px] text-gray-500 font-medium">{label}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminPerfilPage() {
  const { user, isLoading, refreshUser } = useAuth() as any;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm]     = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [showPw, setShowPw] = useState({ old: false, new: false, confirm: false });
  const [saving, setSaving]     = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [msg, setMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm({ first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '', phone: user.phone || '' });
    if (user.avatar) setAvatarPreview(user.avatar);
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      await profileAPI.uploadAvatar(file);
      if (refreshUser) await refreshUser();
    } catch { setMsg({ type: 'err', text: 'No se pudo subir la foto.' }); }
    finally { setUploadingAvatar(false); }
  };

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      await profileAPI.update(form);
      if (refreshUser) await refreshUser();
      setMsg({ type: 'ok', text: 'Datos actualizados.' });
    } catch { setMsg({ type: 'err', text: 'No se pudo guardar.' }); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    setPwMsg(null);
    if (pwForm.new_password !== pwForm.confirm) { setPwMsg({ type: 'err', text: 'Las contraseñas no coinciden.' }); return; }
    if (pwForm.new_password.length < 6) { setPwMsg({ type: 'err', text: 'Mínimo 6 caracteres.' }); return; }
    setSavingPw(true);
    try {
      await profileAPI.changePassword(pwForm.old_password, pwForm.new_password);
      setPwMsg({ type: 'ok', text: 'Contraseña cambiada.' });
      setPwForm({ old_password: '', new_password: '', confirm: '' });
    } catch { setPwMsg({ type: 'err', text: 'Contraseña actual incorrecta.' }); }
    finally { setSavingPw(false); }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen bg-gray-50 flex"><Sidebar /></div>;
  }

  const initials = user.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : user.username[0].toUpperCase();

  return (
    <div className="min-h-screen lg:h-screen bg-gray-50 flex lg:overflow-hidden">
      <Sidebar />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 lg:overflow-hidden">
        <div className="max-w-4xl mx-auto lg:h-full grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-4">

          {/* ── Columna izquierda: avatar + actividad del staff ── */}
          <div className="flex flex-col gap-4 lg:min-h-0">

            {/* Avatar + identidad */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center shrink-0">
              <div className="relative mb-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="group relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-green-100 hover:ring-green-300 transition-all"
                >
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-green-50 flex items-center justify-center">
                        <span className="text-xl font-bold text-green-700">{initials}</span>
                      </div>
                  }
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingAvatar
                      ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                      : <Camera className="h-5 w-5 text-white" />}
                  </div>
                </button>
              </div>
              <p className="font-bold text-gray-900 text-sm leading-tight">
                {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate w-full">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400">
                <AtSign className="h-3 w-3" />{user.username}
              </div>
              <p className="text-[10px] text-gray-300 mt-1.5">Clic en la foto para cambiarla</p>
            </div>

            {/* Actividad del staff */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:flex-1 lg:min-h-0 lg:overflow-y-auto no-scrollbar">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Cuenta de staff</p>
              <div className="space-y-2.5">
                <Stat icon={ShieldCheck} label="Rol" value={ROLE_LABEL[user.role] ?? user.role}
                  color={user.role === 'superadmin' ? 'text-purple-700' : user.role === 'admin' ? 'text-green-700' : 'text-blue-700'}
                  bg={user.role === 'superadmin' ? 'bg-purple-50' : user.role === 'admin' ? 'bg-green-50' : 'bg-blue-50'} />
                <Stat icon={user.is_store_owner ? Crown : Briefcase}
                  label="Tipo de cuenta" value={user.is_store_owner ? 'Dueño / Gestión' : 'Empleado'}
                  sub={user.is_store_owner ? 'Acceso total al panel' : 'Acceso operativo'}
                  color="text-amber-700" bg="bg-amber-50" />
                <Stat icon={BadgeCheck} label="Estado" value="Activa" sub="Cuenta habilitada"
                  color="text-teal-700" bg="bg-teal-50" />
                <Stat icon={KeyRound} label="Usuario" value={user.username}
                  color="text-slate-600" bg="bg-slate-50" />
              </div>
            </div>
          </div>

          {/* ── Columna derecha: datos + contraseña ── */}
          <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto no-scrollbar">

            {/* Datos personales */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-700 mb-4 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-green-600" /> Datos personales
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Nombre"   icon={User}  value={form.first_name} onChange={(v: string) => setForm(f => ({ ...f, first_name: v }))} placeholder="Tu nombre" />
                  <Field label="Apellido" icon={User}  value={form.last_name}  onChange={(v: string) => setForm(f => ({ ...f, last_name: v }))}  placeholder="Tu apellido" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Email"    icon={Mail}  value={form.email} onChange={(v: string) => setForm(f => ({ ...f, email: v }))} placeholder="tu@email.com" type="email" />
                  <Field label="Teléfono" icon={Phone} value={form.phone} onChange={(v: string) => setForm(f => ({ ...f, phone: v }))} placeholder="2254 123456" />
                </div>
              </div>
              {msg && <Alert m={msg} />}
              <div className="flex justify-end mt-4">
                <Button onClick={handleSave} disabled={saving} className="bg-green-800 hover:bg-green-700 text-white h-9 px-5 text-sm">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  Guardar cambios
                </Button>
              </div>
            </div>

            {/* Contraseña */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-green-600" /> Contraseña
              </h2>
              <p className="text-[10px] text-gray-400 mb-3">
                Por seguridad tu contraseña se guarda cifrada y no puede mostrarse. Escribí la actual y tu nueva contraseña; usá el ojito para ver lo que tipeás.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <PwField label="Contraseña actual" value={pwForm.old_password} onChange={v => setPwForm(f => ({ ...f, old_password: v }))} show={showPw.old}     onToggle={() => setShowPw(s => ({ ...s, old: !s.old }))}         placeholder="Tu contraseña actual" />
                <PwField label="Nueva contraseña"  value={pwForm.new_password} onChange={v => setPwForm(f => ({ ...f, new_password: v }))} show={showPw.new}     onToggle={() => setShowPw(s => ({ ...s, new: !s.new }))}         placeholder="Mínimo 6 caracteres" />
                <PwField label="Confirmar"         value={pwForm.confirm}      onChange={v => setPwForm(f => ({ ...f, confirm: v }))}      show={showPw.confirm} onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))} placeholder="Repetí la nueva" />
              </div>
              {pwMsg && <Alert m={pwMsg} />}
              <div className="flex justify-end mt-3">
                <Button onClick={handlePasswordChange}
                  disabled={savingPw || !pwForm.old_password || !pwForm.new_password || !pwForm.confirm}
                  className="bg-green-800 hover:bg-green-700 text-white h-9 px-5 text-sm">
                  {savingPw && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  Cambiar
                </Button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
