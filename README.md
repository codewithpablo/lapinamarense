# La Pinamarense - E-commerce MVP

Proyecto de e-commerce para minimercado con frontend (Next.js) y backend (Django REST Framework) separados.

## Características

- **Frontend**: Next.js 14 con TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Django 5 con Django REST Framework
- **Autenticación**: JWT tokens
- **Funcionalidades**:
  - Catálogo de productos con categorías
  - Carrito de compras
  - Checkout y pedidos
  - Panel de administración para dueños
  - Registro y login de usuarios

## Estructura del Proyecto

```
LaPinamarense/
├── backend/          # Django REST Framework
└── frontend/         # Next.js 14
```

## Configuración

### Backend (Django)

1. Navegar al directorio del backend:
```bash
cd backend
```

2. Crear entorno virtual:
```bash
python -m venv venv
```

3. Activar entorno virtual:
```bash
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

4. Instalar dependencias:
```bash
pip install -r requirements.txt
```

5. Crear superusuario para el panel de admin:
```bash
python manage.py createsuperuser
```

6. Ejecutar migraciones:
```bash
python manage.py migrate
```

7. Iniciar servidor:
```bash
python manage.py runserver
```

El backend estará disponible en `http://localhost:8000`

- **API**: `http://localhost:8000/api/`
- **Admin Panel**: `http://localhost:8000/admin/`

### Frontend (Next.js)

1. Navegar al directorio del frontend:
```bash
cd frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar servidor de desarrollo:
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## Primeros Pasos

1. Iniciar el backend Django
2. Acceder al panel de admin en `http://localhost:8000/admin/`
3. Crear categorías y productos
4. Crear un usuario con `is_store_owner=True` para el panel de administración del frontend
5. Iniciar el frontend Next.js
6. Registrar usuarios y realizar pedidos

## API Endpoints

### Autenticación
- `POST /api/auth/register/` - Registro de usuario
- `POST /api/auth/login/` - Login (retorna JWT token)
- `POST /api/auth/refresh/` - Refrescar token

### Productos
- `GET /api/products/` - Listar productos
- `GET /api/products/{id}/` - Detalle de producto
- `GET /api/categories/` - Listar categorías

### Carrito
- `GET /api/cart/` - Obtener carrito
- `POST /api/cart/add_item/` - Agregar item
- `PUT /api/cart/update_item/` - Actualizar cantidad
- `DELETE /api/cart/remove_item/` - Eliminar item
- `DELETE /api/cart/clear/` - Vaciar carrito

### Pedidos
- `GET /api/orders/` - Listar pedidos
- `POST /api/orders/` - Crear pedido
- `PATCH /api/orders/{id}/update_status/` - Actualizar estado (solo dueños)

## Tecnologías

### Backend
- Django 5.0.6
- Django REST Framework 3.15.1
- djangorestframework-simplejwt 5.3.1
- django-cors-headers 4.3.1
- Pillow 10.3.0

### Frontend
- Next.js 14.2.3
- React 18.3.1
- TypeScript 5
- Tailwind CSS 3.4.3
- Axios 1.7.2
- Lucide React 0.379.0
