'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/admin/Sidebar';
import SalesChart from '@/components/admin/SalesChart';

export default function ReportsPage() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-2">Genera y descarga reportes del minimercado</p>
        </div>

        <div className="grid gap-6">
          <Card className="border-0 shadow-sm p-6">
            <CardHeader>
              <CardTitle>Reporte de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesChart />
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Reporte de Inventario</CardTitle>
                <CardDescription>Estado actual del stock</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generar</Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Reporte de Clientes</CardTitle>
                <CardDescription>Base de clientes activos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generar</Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Reporte de Proveedores</CardTitle>
                <CardDescription>Compras y proveedores</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generar</Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Reporte Financiero</CardTitle>
                <CardDescription>Ingresos y gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generar</Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Reporte Personalizado</CardTitle>
                <CardDescription>Crea tu propio reporte</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Crear</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
