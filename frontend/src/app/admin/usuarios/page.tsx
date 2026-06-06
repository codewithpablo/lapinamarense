'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { rolesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/admin/Sidebar';
import AdminGuard from '@/components/admin/AdminGuard';
import { ShieldCheck, Loader2 } from 'lucide-react';
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
  const { user } = useAuth();
  const [users, setUsers]       = useState<UserRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<number | null>(null);

  useEffect(() => {
    rolesAPI.getUsers()
      .then(r => setUsers(r.data as UserRow[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (id: number, role: UserRole) => {
    setSaving(id);
    try {
      await rolesAPI.updateRole(id, role);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } catch {}
    finally { setSaving(null); }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto space-y-6">

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
                <p className="text-gray-500 mt-1">Gestión de roles y permisos</p>
              </div>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  Lista de usuarios
                </CardTitle>
                <CardDescription>{users.length} usuarios registrados</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <Loader />
                ) : users.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-10">No hay otros usuarios registrados.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                        <TableHead className="pl-6 w-12">#</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol actual</TableHead>
                        <TableHead className="pr-6 text-right">Cambiar rol</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(u => (
                        <TableRow key={u.id} className="hover:bg-gray-50/50">
                          <TableCell className="pl-6 text-gray-400 font-mono text-sm">{u.id}</TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{u.email}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs border ${ROLE_COLOR[u.role]}`}>
                              {ROLE_LABEL[u.role]}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            {saving === u.id ? (
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
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
