'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { RowActions, RowAction, RowDangerAction } from '@/components/ui/table-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/admin/Sidebar';
import { employeesAPI } from '@/lib/api';
import { Plus, Loader2 } from 'lucide-react';

interface Employee { id: number; name: string; role: string; phone: string; shift: string; active: boolean }
const EMPTY_FORM = { name: '', role: '', phone: '', shift: 'Mañana', active: 'true' };
const ROLES  = ['Cajera', 'Cajero', 'Repositor', 'Repositora', 'Encargado', 'Encargada', 'Administrativo'];
const SHIFTS = ['Mañana', 'Tarde', 'Noche'];

const ROLE_COLORS: Record<string, string> = {
  'Cajera':       'bg-blue-100   text-blue-700   border-blue-200',
  'Cajero':       'bg-blue-100   text-blue-700   border-blue-200',
  'Repositor':    'bg-purple-100 text-purple-700 border-purple-200',
  'Repositora':   'bg-purple-100 text-purple-700 border-purple-200',
  'Encargado':    'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Encargada':    'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Administrativo':'bg-orange-100 text-orange-700 border-orange-200',
};

export default function EmployeesPage() {
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [modalOpen, setModalOpen]   = useState(false);
  const [deleteId, setDeleteId]     = useState<number | null>(null);
  const [editing, setEditing]       = useState<Employee | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const load = () => {
    employeesAPI.getAll().then(r => setEmployees(r.data || [])).catch(() => setEmployees([]));
  };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({ name: e.name, role: e.role, phone: e.phone, shift: e.shift, active: String(e.active) });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.role) return;
    setSaving(true);
    const payload = { name: form.name, role: form.role, phone: form.phone, shift: form.shift, active: form.active === 'true' };
    try {
      if (editing) await employeesAPI.update(editing.id, payload);
      else         await employeesAPI.create(payload);
      load();
      setModalOpen(false);
    } catch { console.error('Error al guardar el empleado'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: number) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    try { await employeesAPI.update(id, { active: !emp.active }); load(); }
    catch { console.error('Error al cambiar el estado'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await employeesAPI.delete(deleteId); load(); }
    catch { console.error('Error al eliminar el empleado'); }
    finally { setDeleteId(null); }
  };

  const active = employees.filter(e => e.active).length;

  const columns: DataTableColumn<Employee>[] = [
    { key: 'id', header: '#', className: 'w-12', cell: (e) => <span className="text-gray-400 font-mono text-sm">{e.id}</span> },
    {
      key: 'name', header: 'Nombre',
      cell: (e) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0">
            {e.name[0]}
          </div>
          <span className="font-medium text-sm">{e.name}</span>
        </div>
      ),
    },
    {
      key: 'role', header: 'Rol',
      cell: (e) => (
        <Badge className={`text-xs border ${ROLE_COLORS[e.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{e.role}</Badge>
      ),
    },
    { key: 'phone', header: 'Teléfono', hideOnMobile: true, cell: (e) => <span className="text-sm text-gray-500">{e.phone}</span> },
    { key: 'shift', header: 'Turno', hideOnMobile: true, cell: (e) => <span className="text-sm text-gray-500">{e.shift}</span> },
    {
      key: 'active', header: 'Estado', stopClick: true,
      cell: (e) => (
        <button onClick={() => toggleActive(e.id)} className="cursor-pointer">
          {e.active
            ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs border hover:bg-green-200">Activo</Badge>
            : <Badge className="bg-gray-100  text-gray-500  border-gray-200  text-xs border hover:bg-gray-200">Inactivo</Badge>}
        </button>
      ),
    },
    {
      key: 'actions', header: 'Acciones', align: 'right', stopClick: true,
      cell: (e) => (
        <RowActions>
          <RowAction onClick={() => openEdit(e)}>Editar</RowAction>
          <RowDangerAction onClick={() => setDeleteId(e.id)}>Eliminar</RowDangerAction>
        </RowActions>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
              <p className="text-gray-500 mt-1">Gestiona el personal del minimercado</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" /> Agregar empleado
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm"><CardContent className="pt-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total empleados</p>
              <p className="text-2xl font-bold mt-1">{employees.length}</p>
            </CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="pt-5">
              <p className="text-xs text-green-600 uppercase tracking-wide">Activos</p>
              <p className="text-2xl font-bold mt-1">{active}</p>
            </CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="pt-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Turnos hoy</p>
              <p className="text-2xl font-bold mt-1">{employees.filter(e => e.active && e.shift === 'Mañana').length}</p>
            </CardContent></Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Lista de empleados</CardTitle>
              <CardDescription>{employees.length} empleados registrados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={employees}
                getRowKey={(e) => e.id}
                emptyMessage="No hay empleados registrados"
                className="!bg-transparent !shadow-none !rounded-none"
                columns={columns}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre completo *</Label>
              <Input placeholder="Ej: María González" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Rol *</Label>
              <Select value={form.role} onValueChange={v => set('role', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input placeholder="2254-XXXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Turno</Label>
              <Select value={form.shift} onValueChange={v => set('shift', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.active} onValueChange={v => set('active', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={saving || !form.name.trim() || !form.role}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? 'Guardar cambios' : 'Agregar empleado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar empleado</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

