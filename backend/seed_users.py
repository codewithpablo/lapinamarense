import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lapinamarense.settings')
django.setup()

from shop.models import User

PASSWORD = 'Pinamar2026!'

# (username, nombre, apellido, email, phone, role, address, django_superuser)
USERS = [
    # ── Superadmins (los dueños) ──
    ('waldemar.alarcon', 'Waldemar', 'Alarcón', 'waldemar@lapinamarense.com', '3624000001', 'superadmin', '', True),
    ('mariana.alarcon',  'Mariana',  'Alarcón', 'mariana@lapinamarense.com',  '3624000002', 'superadmin', '', True),

    # ── Admins ──
    ('enzo.alarcon',   'Enzo',   'Alarcón', 'enzo@lapinamarense.com',   '3624000003', 'admin', '', False),
    ('camila.alarcon', 'Camila', 'Alarcón', 'camila@lapinamarense.com', '3624000004', 'admin', '', False),

    # ── Empleados (resto del staff, inventados) ──
    ('lucas.gomez',       'Lucas',   'Gómez',     'lucas@lapinamarense.com',   '3624000005', 'empleado', '', False),
    ('sofia.romero',      'Sofía',   'Romero',    'sofia@lapinamarense.com',   '3624000006', 'empleado', '', False),
    ('martin.diaz',       'Martín',  'Díaz',      'martin@lapinamarense.com',  '3624000007', 'empleado', '', False),
    ('julieta.fernandez', 'Julieta', 'Fernández', 'julieta@lapinamarense.com', '3624000008', 'empleado', '', False),

    # ── Cliente (uno solo) ──
    ('bruno.pereyra', 'Bruno', 'Pereyra', 'bruno.pereyra@gmail.com', '3624111222', 'cliente',
     'Av. Alvear 1234, Resistencia', False),
]

print('Borrando TODOS los usuarios existentes (y por cascada sus carritos/pedidos/tarjetas)...')
deleted, _ = User.objects.all().delete()
print(f'  -> {deleted} registros eliminados.\n')

print('Creando usuarios nuevos:')
for username, first, last, email, phone, role, address, is_super in USERS:
    u = User.objects.create_user(username=username, email=email, password=PASSWORD)
    u.first_name = first
    u.last_name = last
    u.phone = phone
    u.address = address
    u.role = role
    if is_super:
        u.is_staff = True       # acceso al Django admin (opcional, solo dueños)
        u.is_superuser = True
    u.save()                    # save() deriva is_store_owner del role
    print(f'  [{role:10}] {username:20} {first} {last}')

print('\nResumen por rol:')
for role in ('superadmin', 'admin', 'empleado', 'cliente'):
    print(f'  {role:10}: {User.objects.filter(role=role).count()}')
print(f'\nContraseña para todos: {PASSWORD}')
print('Listo.')
