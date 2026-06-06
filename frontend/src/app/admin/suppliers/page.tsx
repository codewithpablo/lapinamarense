'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/admin/Sidebar';
import { Plus, Loader2 } from 'lucide-react';

interface Supplier { id: number; name: string; contact: string; phone: string; email: string; categories: string; active: boolean }
const EMPTY_FORM = { name: '', contact: '', phone: '', email: '', categories: '', active: 'true' };

const INITIAL: Supplier[] = [
  { id: 1, name: 'Distribuidora Norte',   contact: 'Juan Pérez',       phone: '2254-410001', email: 'juan@dnorte.com',          categories: 'Almacén, Pastas',  active: true  },
  { id: 2, name: 'Lácteos del Sur S.A.',  contact: 'María González',   phone: '2254-420002', email: 'mgonzalez@ldelsur.com',    categories: 'Lácteos',          active: true  },
  { id: 3, name: 'Yerba & Café S.R.L.',   contact: 'Carlos Rodríguez', phone: '2254-430003', email: 'info@yerbacafe.com',       categories: 'Infusiones',       active: true  },
  { id: 4, name: 'Limpieza Total',        contact: 'Ana Torres',       phone: '2254-440004', email: 'atorres@limpiezatotal.com',categories: 'Limpieza',         active: false },
  { id: 5, name: 'Bebidas Pinamar',       contact: 'Luis Martínez',    phone: '2254-450005', email: 'luism@bebidaspm.com',      categories: 'Bebidas',          active: true  },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers]   = useState<Supplier[]>(INITIAL);
  const [modalOpen, setModalOpen]   = useState(false);
  const [deleteId, setDeleteId]     = useState<number | null>(null);
  const [editing, setEditing]       = useState<Supplier | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email, categories: s.categories, active: String(s.active) });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    if (editing) {
      setSuppliers(prev => prev.map(s => s.id === editing.id ? { ...s, ...form, active: form.active === 'true' } : s));
    } else {
      const newId = Math.max(0, ...suppliers.map(s => s.id)) + 1;
      setSuppliers(prev => [...prev, { id: newId, ...form, active: form.active === 'true' }]);
    }
    setModalOpen(false);
    setSaving(false);
  };

  const handleDelete = () => {
    setSuppliers(prev => prev.filter(s => s.id !== deleteId));
    setDeleteId(null);
  };

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

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Lista de proveedores</CardTitle>
              <CardDescription>{suppliers.length} proveedores registrados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                    <TableHead className="pl-6 w-12">#</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rubros</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-6 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map(s => (
                    <TableRow key={s.id} className="hover:bg-gray-50/50">
                      <TableCell className="pl-6 text-gray-400 font-mono text-sm">{s.id}</TableCell>
                      <TableCell className="font-medium text-sm">{s.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{s.contact}</TableCell>
                      <TableCell className="text-sm text-gray-500">{s.phone}</TableCell>
                      <TableCell className="text-sm text-gray-500">{s.email}</TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[140px] truncate">{s.categories}</TableCell>
                      <TableCell>
                        {s.active
                          ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs border">Activo</Badge>
                          : <Badge className="bg-gray-100  text-gray-500  border-gray-200  text-xs border">Inactivo</Badge>}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:border-red-200" onClick={() => setDeleteId(s.id)}>Eliminar</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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

