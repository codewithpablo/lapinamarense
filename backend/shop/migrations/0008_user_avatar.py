from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0007_category_parent'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='avatar',
            field=models.ImageField(blank=True, null=True, upload_to='avatars/'),
        ),
    ]
