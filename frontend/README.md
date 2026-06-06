# Frontend - Next.js 14

Frontend para La Pinamarense e-commerce.

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar servidor de desarrollo:
```bash
npm run dev
```

3. Abrir en navegador: `http://localhost:3000`

## Páginas

- `/` - Home con productos destacados
- `/products` - Catálogo completo de productos
- `/cart` - Carrito de compras
- `/checkout` - Finalizar compra
- `/orders` - Historial de pedidos
- `/login` - Iniciar sesión
- `/register` - Registrarse
- `/admin` - Panel de administración (dueños)

## Componentes

### UI Components (shadcn/ui style)
- Button
- Card
- Input
- Label
- Badge

### Custom Components
- Header - Navegación principal
- AuthContext - Contexto de autenticación

## Configuración

La API URL está configurada en `src/lib/api.ts`:
```typescript
const API_URL = 'http://localhost:8000/api';
```

## Funcionalidades

### Usuario
- Registro con nombre, email, teléfono, dirección
- Login con JWT tokens
- Autorefresh de tokens

### Carrito
- Agregar productos
- Modificar cantidades
- Eliminar items
- Vaciar carrito

### Pedidos
- Crear pedido desde carrito
- Ver historial de pedidos
- Seguimiento de estado

### Administración (dueños)
- Dashboard con estadísticas
- Gestión de estados de pedidos
- Vista de todos los pedidos

## Build para Producción

```bash
npm run build
npm start
```
