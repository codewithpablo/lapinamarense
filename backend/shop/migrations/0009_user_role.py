from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0008_user_avatar'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('superadmin', 'Super Admin'),
                    ('admin',      'Administrador'),
                    ('empleado',   'Empleado'),
                    ('cliente',    'Cliente'),
                ],
                default='cliente',
                max_length=20,
            ),
        ),
    ]
