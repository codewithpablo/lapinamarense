from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0002_remove_product_image_url_product_image'),
    ]

    operations = [
        migrations.RenameField(
            model_name='product',
            old_name='description',
            new_name='net_content',
        ),
    ]
