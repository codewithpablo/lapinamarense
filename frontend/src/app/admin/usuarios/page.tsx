'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { rolesAPI, branchesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/admin/Sidebar';
import { ShieldCheck, Loader2, Briefcase, Users } from 'lucide-react';
import Loader from '@/components/ui/loader';

type UserRole = 'superadmin' | 'admin' | 'empleado' | 'cliente';

interface UserRow {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  branch: number | null;
  branch__name: string | null;
}

interface Branch {
  id: number;
  name: string;
  slug: string;
  address: string;
}

const ROLES: UserRole[] = ['superadmin', 'admin', 'empleado', 'cliente'];

const ROLE_LABEL: Record<UserRole, string> = {
  superadmin: 'Super Admin',
  admin:      'Admin',
  empleado:   'Empleado',
  cliente:    'Cliente',
};

const ROLE_COLOR: Record<UserRole, string> = {
  superadmin: 'bg-purple-100 text-purple-700 border-purple-200',
  admin:      'bg-green-100 text-green-700 border-green-200',
  empleado:   'bg-blue-100 text-blue-700 border-blue-200',
  cliente:    'bg-gray-100 text-gray-500 border-gray-200',
};

export default function UsuariosPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers]       = useState<UserRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<number | null>(null);
  const [savingBranch, setSavingBranch] = useState<number | null>(null);
  const [tab, setTab]           = useState<'empleados' | 'clientes'>('empleados');

  // Gestión de usuarios/roles: SOLO superadmin.
  const isSuperadmin = user?.role === 'superadmin';

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/auth'); return; }
    if (!isSuperadmin) { router.replace('/admin'); return; }
    Promise.all([
      rolesAPI.getUsers(),
      branchesAPI.getAll().catch(() => ({ data: [] })),
    ]).then(([usersRes, branchesRes]) => {
      setUsers(usersRes.data as UserRow[]);
      setBranches(branchesRes.data as Branch[]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isLoading, user, isSuperadmin, router]);

  if (isLoading || !user || !isSuperadmin) return null;

  // Empleados = staff (superadmin/admin/empleado). Clientes = cliente.
  const empleados = users.filter(u => u.role !== 'cliente');
  const clientes  = users.filter(u => u.role === 'cliente');
  const shownUsers = tab === 'empleados' ? empleados : clientes;

  const handleRoleChange = async (id: number, role: UserRole) => {
    setSaving(id);
    try {
      await rolesAPI.updateRole(id, role);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } catch {}
    finally { setSaving(null); }
  };

  const handleBranchChange = async (id: number, branchId: number | null) => {
    setSavingBranch(id);
    try {
      await rolesAPI.updateBranch(id, branchId);
      const name = branchId ? (branches.find(b => b.id === branchId)?.name ?? null) : null;
      setUsers(prev => prev.map(u => u.id === id ? { ...u, branch: branchId, branch__name: name } : u));
    } catch {}
    finally { setSavingBranch(null); }
  };

  const columns: DataTableColumn<UserRow>[] = [
    {
      key: 'id',
      header: '#',
      className: 'w-12',
      cell: (u) => <span className="text-gray-400 font-mono text-sm">{u.id}</span>,
    },
    {
      key: 'usuario',
      header: 'Usuario',
      cell: (u) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-semibold shrink-0">
            {(u.first_name || u.username)[0].toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-sm">
              {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}
            </span>
            <p className="text-xs text-gray-400">@{u.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      hideOnMobile: true,
      cell: (u) => <span className="text-sm text-gray-500">{u.email}</span>,
    },
    {
      key: 'rol',
      header: 'Rol actual',
      cell: (u) => (
        <Badge className={`text-xs border ${ROLE_COLOR[u.role]}`}>
          {ROLE_LABEL[u.role]}
        </Badge>
      ),
    },
    {
      key: 'sucursal',
      header: 'Sucursal',
      hideOnMobile: true,
      stopClick: true,
      cell: (u) => {
        // Los clientes no trabajan en una sucursal.
        if (u.role === 'cliente') return <span className="text-xs text-gray-300">—</span>;
        if (savingBranch === u.id) return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
        return (
          <Select
            value={u.branch ? String(u.branch) : 'none'}
            onValueChange={v => handleBranchChange(u.id, v === 'none' ? null : Number(v))}
          >
            <SelectTrigger className="h-auto min-h-9 text-xs w-52 py-1.5">
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin asignar</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={String(b.id)}>
                  <div className="flex flex-col text-left">
                    <span className="font-medium">{b.name}</span>
                    {b.address && <span className="text-[10px] text-gray-400 leading-tight">{b.address}</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      key: 'cambiar',
      header: 'Cambiar rol',
      align: 'right',
      stopClick: true,
      cell: (u) => (
        saving === u.id ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400 ml-auto" />
        ) : (
          <Select value={u.role} onValueChange={v => handleRoleChange(u.id, v as UserRole)}>
            <SelectTrigger className="h-8 text-xs w-40 ml-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(r => (
                <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-5xl mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Usuarios</h1>
              <p className="text-gray-500 mt-1 text-sm">Todos los usuarios registrados y su rol</p>
            </div>
          </div>

          {/* Tabs Empleados / Clientes */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-fit">
            {([
              { id: 'empleados', label: 'Empleados', icon: Briefcase, count: empleados.length },
              { id: 'clientes',  label: 'Clientes',  icon: Users,     count: clientes.length  },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-green-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {loading ? '–' : t.count}
                </span>
              </button>
            ))}
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                {tab === 'empleados' ? 'Empleados y staff' : 'Clientes'}
              </CardTitle>
              <CardDescription>{shownUsers.length} {tab === 'empleados' ? 'en el equipo' : 'registrados'}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <Loader />
              ) : (
                <DataTable
                  data={shownUsers}
                  getRowKey={(u) => u.id}
                  columns={columns}
                  emptyMessage={tab === 'empleados' ? 'No hay empleados registrados.' : 'No hay clientes registrados.'}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
