# Crea las dos sucursales iniciales: Fontana (default) y Resistencia.
from django.db import migrations


def crear_sucursales(apps, schema_editor):
    Branch = apps.get_model('shop', 'Branch')
    Branch.objects.get_or_create(
        slug='fontana',
        defaults={'name': 'Fontana', 'address': 'Av. Alvear 3500, Fontana', 'is_default': True, 'is_active': True},
    )
    Branch.objects.get_or_create(
        slug='resistencia',
        defaults={'name': 'Resistencia', 'address': 'B° España, Mz 79, Local 8, Resistencia', 'is_active': True},
    )


def borrar_sucursales(apps, schema_editor):
    Branch = apps.get_model('shop', 'Branch')
    Branch.objects.filter(slug__in=['fontana', 'resistencia']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0012_branch_alter_supplier_options_user_branch'),
    ]

    operations = [
        migrations.RunPython(crear_sucursales, borrar_sucursales),
    ]
