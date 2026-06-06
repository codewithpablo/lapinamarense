# Backend - Django REST Framework

Backend API para La Pinamarense e-commerce.

## Instalación

1. Crear entorno virtual:
```bash
python -m venv venv
```

2. Activar entorno virtual:
```bash
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

4. Ejecutar migraciones:
```bash
python manage.py migrate
```

5. Crear superusuario:
```bash
python manage.py createsuperuser
```

6. Iniciar servidor:
```bash
python manage.py runserver
```

## Modelos

- **User**: Usuario extendido con phone, address, is_store_owner
- **Category**: Categorías de productos
- **Product**: Productos con precio, stock, categoría
- **Cart**: Carrito de compras por usuario
- **CartItem**: Items en el carrito
- **Order**: Pedidos con estados
- **OrderItem**: Items de un pedido

## Panel de Administración

Acceder a `http://localhost:8000/admin/` con el superusuario creado.

Desde el panel puedes:
- Gestionar usuarios
- Crear categorías y productos
- Ver y gestionar pedidos
- Asignar permisos de dueño de tienda

## API Endpoints

### Autenticación
- `POST /api/auth/register/` - Registro
- `POST /api/auth/login/` - Login
- `POST /api/auth/refresh/` - Refresh token

### Productos
- `GET /api/products/` - Listar productos
- `POST /api/products/` - Crear producto (admin)
- `PUT /api/products/{id}/` - Actualizar producto (admin)
- `DELETE /api/products/{id}/` - Eliminar producto (admin)
- `GET /api/categories/` - Listar categorías

### Carrito
- `GET /api/cart/` - Obtener carrito
- `POST /api/cart/add_item/` - Agregar item
- `PUT /api/cart/update_item/` - Actualizar item
- `DELETE /api/cart/remove_item/` - Eliminar item
- `DELETE /api/cart/clear/` - Vaciar carrito

### Pedidos
- `GET /api/orders/` - Listar pedidos
- `POST /api/orders/` - Crear pedido
- `PATCH /api/orders/{id}/update_status/` - Actualizar estado (dueños)

## Estados de Pedido

- `pending` - Pendiente
- `confirmed` - Confirmado
- `preparing` - En preparación
- `delivered` - Entregado
- `cancelled` - Cancelado
