import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lapinamarense.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Crear superusuario si no existe
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@lapinamarense.com',
        password='admin123',
        first_name='Admin',
        last_name='User',
        is_store_owner=True
    )
    print('Superusuario creado exitosamente!')
    print('Username: admin')
    print('Password: admin123')
else:
    print('El superusuario ya existe.')
