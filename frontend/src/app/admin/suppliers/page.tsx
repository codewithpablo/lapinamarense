'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { RowActions, RowAction, RowDangerAction } from '@/components/ui/table-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/admin/Sidebar';
import { suppliersAPI } from '@/lib/api';
import { Plus, Loader2 } from 'lucide-react';

interface Supplier { id: number; name: string; contact: string; phone: string; email: string; categories: string; active: boolean }
const EMPTY_FORM = { name: '', contact: '', phone: '', email: '', categories: '', active: 'true' };

export default function SuppliersPage() {
  const [suppliers, setSuppliers]   = useState<Supplier[]>([]);
  const [modalOpen, setModalOpen]   = useState(false);
  const [deleteId, setDeleteId]     = useState<number | null>(null);
  const [editing, setEditing]       = useState<Supplier | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const load = () => {
    suppliersAPI.getAll().then(r => setSuppliers(r.data || [])).catch(() => setSuppliers([]));
  };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email, categories: s.categories, active: String(s.active) });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { name: form.name, contact: form.contact, phone: form.phone, email: form.email, categories: form.categories, active: form.active === 'true' };
    try {
      if (editing) await suppliersAPI.update(editing.id, payload);
      else         await suppliersAPI.create(payload);
      load();
      setModalOpen(false);
    } catch { console.error('Error al guardar el proveedor'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await suppliersAPI.delete(deleteId); load(); }
    catch { console.error('Error al eliminar el proveedor'); }
    finally { setDeleteId(null); }
  };

  const columns: DataTableColumn<Supplier>[] = [
    { key: 'id', header: '#', className: 'w-12', cell: (s) => <span className="text-gray-400 font-mono text-sm">{s.id}</span> },
    { key: 'name', header: 'Empresa', cell: (s) => <span className="font-medium text-sm">{s.name}</span> },
    { key: 'contact', header: 'Contacto', cell: (s) => <span className="text-sm text-gray-600">{s.contact}</span> },
    { key: 'phone', header: 'Teléfono', hideOnMobile: true, cell: (s) => <span className="text-sm text-gray-500">{s.phone}</span> },
    { key: 'email', header: 'Email', hideOnMobile: true, cell: (s) => <span className="text-sm text-gray-500">{s.email}</span> },
    { key: 'categories', header: 'Rubros', hideOnMobile: true, cell: (s) => <span className="text-sm text-gray-500 max-w-[140px] truncate block">{s.categories}</span> },
    {
      key: 'active', header: 'Estado', cell: (s) => (
        s.active
          ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs border">Activo</Badge>
          : <Badge className="bg-gray-100  text-gray-500  border-gray-200  text-xs border">Inactivo</Badge>
      ),
    },
    {
      key: 'actions', header: 'Acciones', align: 'right', stopClick: true, cell: (s) => (
        <RowActions>
          <RowAction onClick={() => openEdit(s)}>Editar</RowAction>
          <RowDangerAction onClick={() => setDeleteId(s.id)}>Eliminar</RowDangerAction>
        </RowActions>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
              <p className="text-gray-500 mt-1">Gestiona los proveedores del minimercado</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" /> Agregar proveedor
            </Button>
          </div>

          <div className="space-y-2">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Lista de proveedores</h2>
              <p className="text-sm text-gray-500">{suppliers.length} proveedores registrados</p>
            </div>
            <DataTable
              data={suppliers}
              getRowKey={(s) => s.id}
              emptyMessage="No hay proveedores registrados"
              columns={columns}
            />
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Empresa *</Label>
              <Input placeholder="Nombre de la empresa" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Contacto</Label>
              <Input placeholder="Nombre del contacto" value={form.contact} onChange={e => set('contact', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input placeholder="2254-XXXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input placeholder="email@empresa.com" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Rubros</Label>
              <Input placeholder="Ej: Almacén, Lácteos" value={form.categories} onChange={e => set('categories', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
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
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? 'Guardar cambios' : 'Agregar proveedor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar proveedor</DialogTitle>
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

