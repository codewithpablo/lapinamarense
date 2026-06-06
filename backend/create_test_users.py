import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lapinamarense.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

users = [
    dict(username='superadmin', password='super123', email='superadmin@pinamarense.com',
         first_name='Pablo',   last_name='Alonso',   role='superadmin', is_staff=True, is_superuser=True),
    dict(username='admin',      password='admin123',  email='admin@pinamarense.com',
         first_name='Lucía',   last_name='García',   role='admin'),
    dict(username='empleado',   password='emp123',    email='empleado@pinamarense.com',
         first_name='Martín',  last_name='López',    role='empleado'),
    dict(username='cliente',    password='cli123',    email='cliente@pinamarense.com',
         first_name='Ana',     last_name='Martínez', role='cliente'),
]

for u in users:
    role     = u.pop('role')
    password = u.pop('password')
    is_staff      = u.pop('is_staff', False)
    is_superuser  = u.pop('is_superuser', False)

    obj, created = User.objects.get_or_create(username=u['username'], defaults=u)
    if created:
        obj.set_password(password)
    obj.role        = role
    obj.is_staff    = is_staff
    obj.is_superuser = is_superuser
    for k, v in u.items():
        setattr(obj, k, v)
    obj.save()
    print(f"{'Creado' if created else 'Actualizado'}: {obj.username} | rol={obj.role} | is_store_owner={obj.is_store_owner}")

print('\nCredenciales listas.')
