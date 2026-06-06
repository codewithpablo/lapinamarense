'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { profileAPI, ordersAPI } from '@/lib/api';
import CustomerSidebar from '@/components/customer/CustomerSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User, Mail, Phone, MapPin, Lock, CheckCircle, Loader2,
  AlertCircle, ShieldCheck, AtSign, ShoppingBag, Wallet,
  Receipt, Star, TrendingUp, Clock, Eye, EyeOff, Camera,
} from 'lucide-react';

interface Order { id:number; status:string; total_amount:number; created_at:string; items:{product:{name:string};quantity:number;price:number;subtotal:number}[]; }

const STATUS_LABEL: Record<string,string> = {
  pending:'Pendiente', confirmed:'Confirmado', preparing:'En preparación', delivered:'Entregado', cancelled:'Cancelado',
};

function Field({label,icon:Icon,value,onChange,type='text',placeholder=''}:any) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none"/>
        <Input type={type} value={value} onChange={(e:any)=>onChange(e.target.value)} placeholder={placeholder}
          className="pl-8 h-9 text-sm border-gray-200 bg-gray-50 focus:bg-white transition-colors"/>
      </div>
    </div>
  );
}

function PwField({label,field,value,onChange,show,onToggle}:{label:string;field:string;value:string;onChange:(v:string)=>void;show:boolean;onToggle:()=>void}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none"/>
        <Input
          type={show?'text':'password'}
          value={value}
          onChange={(e:any)=>onChange(e.target.value)}
          placeholder="••••••••"
          className="pl-8 pr-9 h-9 text-sm border-gray-200 bg-gray-50 focus:bg-white transition-colors"
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          {show ? <EyeOff className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}
        </button>
      </div>
    </div>
  );
}

function Alert({m}:{m:{type:'ok'|'err';text:string}}) {
  return (
    <div className={`flex items-center gap-2 mt-3 text-xs rounded-xl px-3 py-2 ${m.type==='ok'?'text-green-700 bg-green-50':'text-red-600 bg-red-50'}`}>
      {m.type==='ok'?<CheckCircle className="h-3.5 w-3.5 shrink-0"/>:<AlertCircle className="h-3.5 w-3.5 shrink-0"/>}
      {m.text}
    </div>
  );
}

function Stat({icon:Icon,label,value,sub,color='text-green-700',bg='bg-green-50'}:any) {
  return (
    <div className={`${bg} rounded-xl p-3 flex items-start gap-3`}>
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
        <Icon className={`h-4 w-4 ${color}`}/>
      </div>
      <div className="min-w-0">
        <p className="text-base font-extrabold text-gray-900 leading-tight truncate">{value}</p>
        <p className="text-[10px] text-gray-500 font-medium">{label}</p>
        {sub&&<p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const { user, isLoading, refreshUser } = useAuth() as any;
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm]     = useState({ first_name:'', last_name:'', email:'', phone:'', address:'' });
  const [pwForm, setPwForm] = useState({ old_password:'', new_password:'', confirm:'' });
  const [showPw, setShowPw] = useState({ old:false, new:false, confirm:false });
  const [saving, setSaving]     = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string|null>(null);
  const [msg, setMsg]     = useState<{type:'ok'|'err'; text:string}|null>(null);
  const [pwMsg, setPwMsg] = useState<{type:'ok'|'err'; text:string}|null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => { if (!isLoading && !user) router.push('/auth'); }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    setForm({ first_name:user.first_name||'', last_name:user.last_name||'', email:user.email||'', phone:user.phone||'', address:user.address||'' });
    if (user.avatar) setAvatarPreview(user.avatar);
    ordersAPI.getAll().then(r => setOrders(r.data as Order[])).catch(()=>{});
  }, [user]);

  if (isLoading || !user) return null;

  const totalSpent  = orders.reduce((s,o)=>s+Number(o.total_amount),0);
  const avgTicket   = orders.length ? totalSpent/orders.length : 0;
  const delivered   = orders.filter(o=>['delivered','entregado','completed','completado'].includes(o.status));
  const successRate = orders.length ? Math.round((delivered.length/orders.length)*100) : 0;
  const lastOrder   = [...orders].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime())[0];
  const productQty: Record<string,number> = {};
  orders.forEach(o=>o.items.forEach(it=>{ productQty[it.product.name]=(productQty[it.product.name]||0)+it.quantity; }));
  const topProduct  = Object.entries(productQty).sort((a,b)=>b[1]-a[1])[0];
  const thisMonth   = orders.filter(o=>{ const d=new Date(o.created_at); const n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      await profileAPI.uploadAvatar(file);
      if (refreshUser) await refreshUser();
    } catch { setMsg({type:'err', text:'No se pudo subir la foto.'}); }
    finally { setUploadingAvatar(false); }
  };

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      await profileAPI.update(form);
      if (refreshUser) await refreshUser();
      setMsg({type:'ok', text:'Datos actualizados.'});
    } catch { setMsg({type:'err', text:'No se pudo guardar.'}); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    setPwMsg(null);
    if (pwForm.new_password!==pwForm.confirm){setPwMsg({type:'err',text:'Las contraseñas no coinciden.'});return;}
    if (pwForm.new_password.length<6){setPwMsg({type:'err',text:'Mínimo 6 caracteres.'});return;}
    setSavingPw(true);
    try {
      await profileAPI.changePassword(pwForm.old_password, pwForm.new_password);
      setPwMsg({type:'ok',text:'Contraseña cambiada.'});
      setPwForm({old_password:'',new_password:'',confirm:''});
    } catch {setPwMsg({type:'err',text:'Contraseña actual incorrecta.'});}
    finally {setSavingPw(false);}
  };

  const initials = user.first_name
    ? `${user.first_name[0]}${user.last_name?.[0]??''}`.toUpperCase()
    : user.username[0].toUpperCase();

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <CustomerSidebar/>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>

      <main className="flex-1 p-5 overflow-hidden">
        <div className="h-full grid grid-cols-[270px_1fr] gap-4">

          {/* ── Columna izquierda ── */}
          <div className="flex flex-col gap-4 min-h-0">

            {/* Avatar + nombre */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center shrink-0">
              {/* Avatar con botón de cambio */}
              <div className="relative mb-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="group relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-green-100 hover:ring-green-300 transition-all"
                >
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover"/>
                    : <div className="w-full h-full bg-green-50 flex items-center justify-center">
                        <span className="text-xl font-bold text-green-700">{initials}</span>
                      </div>
                  }
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingAvatar
                      ? <Loader2 className="h-5 w-5 text-white animate-spin"/>
                      : <Camera className="h-5 w-5 text-white"/>
                    }
                  </div>
                </button>
              </div>
              <p className="font-bold text-gray-900 text-sm leading-tight">
                {user.first_name?`${user.first_name} ${user.last_name}`:user.username}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate w-full">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400">
                <AtSign className="h-3 w-3"/>{user.username}
                <span className="mx-1">·</span>
                <ShieldCheck className="h-3 w-3"/>{user.is_store_owner?'Admin':'Cliente'}
              </div>
              <p className="text-[10px] text-gray-300 mt-1.5">Clic en la foto para cambiarla</p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1 min-h-0 overflow-y-auto no-scrollbar">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Actividad</p>
              <div className="space-y-2.5">
                <Stat icon={Wallet}     label="Total gastado"    value={`$${totalSpent.toLocaleString('es-AR')}`}             color="text-green-700"  bg="bg-green-50"/>
                <Stat icon={ShoppingBag} label="Pedidos totales" value={orders.length}  sub={`${thisMonth.length} este mes`}  color="text-blue-700"   bg="bg-blue-50"/>
                <Stat icon={Receipt}    label="Ticket promedio"  value={`$${Math.round(avgTicket).toLocaleString('es-AR')}`}  color="text-orange-700" bg="bg-orange-50"/>
                <Stat icon={Star}       label="Tasa de éxito"    value={`${successRate}%`} sub={`${delivered.length} entregados`} color="text-yellow-700" bg="bg-yellow-50"/>
                {topProduct&&<Stat icon={TrendingUp} label="Producto favorito" value={topProduct[0].split(' ').slice(0,2).join(' ')} sub={`${topProduct[1]} u. compradas`} color="text-purple-700" bg="bg-purple-50"/>}
                {lastOrder&&<Stat icon={Clock} label="Último pedido" value={`#${lastOrder.id}`}
                  sub={`${new Date(lastOrder.created_at).toLocaleDateString('es-AR',{day:'2-digit',month:'short'})} · ${STATUS_LABEL[lastOrder.status]||lastOrder.status}`}
                  color="text-slate-600" bg="bg-slate-50"/>}
              </div>
            </div>
          </div>

          {/* ── Columna derecha ── */}
          <div className="flex flex-col gap-4 min-h-0">

            {/* Datos personales */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1 min-h-0 flex flex-col">
              <h2 className="text-xs font-bold text-gray-700 mb-4 flex items-center gap-1.5 shrink-0">
                <User className="h-3.5 w-3.5 text-green-600"/> Datos personales
              </h2>
              <div className="flex-1 min-h-0 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nombre"   icon={User}  value={form.first_name} onChange={(v:string)=>setForm(f=>({...f,first_name:v}))} placeholder="Tu nombre"/>
                    <Field label="Apellido" icon={User}  value={form.last_name}  onChange={(v:string)=>setForm(f=>({...f,last_name:v}))}  placeholder="Tu apellido"/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email"    icon={Mail}  value={form.email} onChange={(v:string)=>setForm(f=>({...f,email:v}))}  placeholder="tu@email.com" type="email"/>
                    <Field label="Teléfono" icon={Phone} value={form.phone} onChange={(v:string)=>setForm(f=>({...f,phone:v}))}  placeholder="2254 123456"/>
                  </div>
                  <Field label="Dirección" icon={MapPin} value={form.address} onChange={(v:string)=>setForm(f=>({...f,address:v}))} placeholder="Tu dirección de entrega"/>
                </div>
                <div>
                  {msg&&<Alert m={msg}/>}
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleSave} disabled={saving} className="bg-green-800 hover:bg-green-700 text-white h-9 px-5 text-sm">
                      {saving&&<Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5"/>}
                      Guardar cambios
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cambiar contraseña */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 shrink-0">
              <h2 className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-green-600"/> Contraseña
              </h2>
              <p className="text-[10px] text-gray-400 mb-3">
                Tu contraseña está guardada de forma segura. Ingresá la actual para poder cambiarla.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <PwField label="Contraseña actual" field="old"     value={pwForm.old_password} onChange={v=>setPwForm(f=>({...f,old_password:v}))}     show={showPw.old}     onToggle={()=>setShowPw(s=>({...s,old:!s.old}))}/>
                <PwField label="Nueva contraseña"  field="new"     value={pwForm.new_password} onChange={v=>setPwForm(f=>({...f,new_password:v}))}     show={showPw.new}     onToggle={()=>setShowPw(s=>({...s,new:!s.new}))}/>
                <PwField label="Confirmar"         field="confirm" value={pwForm.confirm}       onChange={v=>setPwForm(f=>({...f,confirm:v}))}           show={showPw.confirm} onToggle={()=>setShowPw(s=>({...s,confirm:!s.confirm}))}/>
              </div>
              {pwMsg&&<Alert m={pwMsg}/>}
              <div className="flex justify-end mt-3">
                <Button onClick={handlePasswordChange}
                  disabled={savingPw||!pwForm.old_password||!pwForm.new_password||!pwForm.confirm}
                  className="bg-green-800 hover:bg-green-700 text-white h-9 px-5 text-sm">
                  {savingPw&&<Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5"/>}
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
