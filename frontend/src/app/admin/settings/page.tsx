'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/admin/Sidebar';

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('La Pinamarense');
  const [address, setAddress] = useState('Av. Principal 123');
  const [phone, setPhone] = useState('11-1234-5678');

  const handleSaveSettings = () => {
    // TODO: implementar guardado
  };

  const handleChangePassword = () => {
    // TODO: implementar cambio de contraseña
  };

  const handleLogoutAll = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    window.location.href = '/auth';
  };
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-500 mt-1">Ajustes generales del sistema</p>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Información del Negocio</CardTitle>
              <CardDescription>Configura los datos básicos del minimercado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900">Nombre del Negocio</label>
                <input
                  type="text"
                  defaultValue="La Pinamarense"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900">Dirección</label>
                <input
                  type="text"
                  defaultValue="Av. Principal 123"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900">Teléfono</label>
                <input
                  type="text"
                  defaultValue="11-1234-5678"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveSettings}>Guardar Cambios</Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Configura las alertas y notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de Stock Bajo</p>
                  <p className="text-sm text-gray-600">Notificar cuando el stock sea menor a 10 unidades</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nuevos Pedidos</p>
                  <p className="text-sm text-gray-600">Notificar cuando lleguen nuevos pedidos</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reportes Diarios</p>
                  <p className="text-sm text-gray-600">Enviar resumen diario de ventas</p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>Opciones de seguridad y acceso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={handleChangePassword}>Cambiar Contraseña</Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleLogoutAll}>
                Cerrar Sesión en Todos los Dispositivos
              </Button>
            </CardContent>
          </Card>
        </div>
        </div>
      </main>
    </div>
  );
}
