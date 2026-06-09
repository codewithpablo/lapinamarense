'use client';

import { useEffect, useState } from 'react';
import { categoriesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { RowActions, RowAction, RowDangerAction } from '@/components/ui/table-actions';
import Sidebar from '@/components/admin/Sidebar';
import { Loader2, Tag, Plus } from 'lucide-react';
import Loader from '@/components/ui/loader';

interface Category { id: number; name: string; description: string; image_url?: string }
const EMPTY_FORM = { name: '', description: '' };

export default function CategoriesPage() {
  const [categories, setCategories]   = useState<Category[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [deleteId, setDeleteId]       = useState<number | null>(null);
  const [editing, setEditing]         = useState<Category | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    categoriesAPI.getAll()
      .then(res => setCategories(res.data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, description: c.description }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) await categoriesAPI.update(editing.id, form);
      else         await categoriesAPI.create(form);
      load();
      setModalOpen(false);
    } catch { console.error('Error al guardar la categoría'); }
    finally  { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await categoriesAPI.delete(deleteId);
      load();
      setDeleteId(null);
    } catch { console.error('Error al eliminar la categoría'); }
    finally  { setDeleting(false); }
  };

  const columns: DataTableColumn<Category>[] = [
    {
      key: 'id',
      header: '#',
      className: 'w-12',
      cell: (c) => <span className="text-gray-400 font-mono text-sm">{c.id}</span>,
    },
    {
      key: 'name',
      header: 'Nombre',
      cell: (c) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center shrink-0">
            <Tag className="h-3.5 w-3.5 text-green-600" />
          </div>
          <span className="font-medium text-sm">{c.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Descripción',
      hideOnMobile: true,
      className: 'max-w-xs',
      cell: (c) => <span className="text-sm text-gray-500 truncate block">{c.description}</span>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      stopClick: true,
      cell: (c) => (
        <RowActions>
          <RowAction onClick={() => openEdit(c)}>Editar</RowAction>
          <RowDangerAction onClick={() => setDeleteId(c.id)}>Eliminar</RowDangerAction>
        </RowActions>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-5xl mx-auto space-y-6">

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Categorias</CardTitle>
                <CardDescription>{categories.length} registradas</CardDescription>
              </div>
              <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" /> Agregar
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <Loader />
              ) : (
                <DataTable
                  data={categories}
                  getRowKey={(c) => c.id}
                  columns={columns}
                  emptyMessage="No hay categorías"
                  className="shadow-none rounded-none rounded-b-xl bg-transparent"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input placeholder="Ej: Almacén" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input placeholder="Descripción breve" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer. ¿Seguro que querés eliminarla?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

