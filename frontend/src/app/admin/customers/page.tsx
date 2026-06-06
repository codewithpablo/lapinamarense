'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Sidebar from '@/components/admin/Sidebar';
import { Plus } from 'lucide-react';
import Loader from '@/components/ui/loader';

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
      // Simulated data - replace with actual API call
      setCustomers([
        { id: 1, username: 'juanperez', email: 'juan@example.com', first_name: 'Juan', last_name: 'Pérez', phone: '11-1234-5678', address: 'Av. Corrientes 1234' },
        { id: 2, username: 'mariagarcia', email: 'maria@example.com', first_name: 'María', last_name: 'García', phone: '11-9876-5432', address: 'Calle Florida 567' },
      ]);
    } catch (error) {
      console.error('Error fetching customers:', error);
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

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Lista de clientes</CardTitle>
              <CardDescription>{customers.length} clientes registrados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {customers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay clientes registrados</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                      <TableHead className="pl-6 w-12">#</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="pr-6 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-gray-50/50">
                        <TableCell className="pl-6 text-gray-400 font-mono text-sm">{customer.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0">
                              {customer.first_name[0]}
                            </div>
                            <span className="font-medium text-sm">{customer.first_name} {customer.last_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">@{customer.username}</TableCell>
                        <TableCell className="text-sm text-gray-500">{customer.email}</TableCell>
                        <TableCell className="text-sm text-gray-500">{customer.phone || '—'}</TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-[160px] truncate">{customer.address || '—'}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs border">Activo</Badge>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewOrders(customer.id)}>
                              Ver pedidos
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditCustomer(customer.id)}>
                              Editar
                            </Button>
                          </div>
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
  );
}
