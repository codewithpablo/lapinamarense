'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { RowActions, RowAction } from '@/components/ui/table-actions';
import Sidebar from '@/components/admin/Sidebar';
import { Plus } from 'lucide-react';
import Loader from '@/components/ui/loader';
import api from '@/lib/api';

interface Customer {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/auth/users/');
      setCustomers(res.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    // TODO: implementar
  };

  const handleViewOrders = (customerId: number) => {
    // TODO: implementar
  };

  const handleEditCustomer = (customerId: number) => {
    // TODO: implementar
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1"><Loader /></main>
      </div>
    );
  }

  const columns: DataTableColumn<Customer>[] = [
    {
      key: 'id',
      header: '#',
      className: 'w-12',
      cell: (customer) => <span className="text-gray-400 font-mono text-sm">{customer.id}</span>,
    },
    {
      key: 'name',
      header: 'Nombre',
      cell: (customer) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0">
            {customer.first_name[0]}
          </div>
          <span className="font-medium text-sm">{customer.first_name} {customer.last_name}</span>
        </div>
      ),
    },
    {
      key: 'username',
      header: 'Usuario',
      hideOnMobile: true,
      cell: (customer) => <span className="text-sm text-gray-500">@{customer.username}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      hideOnMobile: true,
      cell: (customer) => <span className="text-sm text-gray-500">{customer.email}</span>,
    },
    {
      key: 'phone',
      header: 'Teléfono',
      hideOnMobile: true,
      cell: (customer) => <span className="text-sm text-gray-500">{customer.phone || '—'}</span>,
    },
    {
      key: 'address',
      header: 'Dirección',
      hideOnMobile: true,
      cell: (customer) => <span className="text-sm text-gray-500 max-w-[160px] truncate block">{customer.address || '—'}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: () => (
        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs border">Activo</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      stopClick: true,
      cell: (customer) => (
        <RowActions>
          <RowAction onClick={() => handleViewOrders(customer.id)}>
            Ver pedidos
          </RowAction>
          <RowAction onClick={() => handleEditCustomer(customer.id)}>
            Editar
          </RowAction>
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
              <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
              <p className="text-gray-500 mt-1">Gestiona los clientes del minimercado</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddCustomer}>
              <Plus className="h-4 w-4 mr-2" /> Agregar cliente
            </Button>
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0">
              <CardTitle className="text-base">Lista de clientes</CardTitle>
              <CardDescription>{customers.length} clientes registrados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={customers}
                getRowKey={(customer) => customer.id}
                columns={columns}
                emptyMessage="No hay clientes registrados"
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
