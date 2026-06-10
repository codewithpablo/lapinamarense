from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator


class User(AbstractUser):
    ROLE_CHOICES = [
        ('superadmin', 'Super Admin'),
        ('admin',      'Administrador'),
        ('empleado',   'Empleado'),
        ('cliente',    'Cliente'),
    ]

    phone          = models.CharField(max_length=20, blank=True)
    address        = models.TextField(blank=True)
    role           = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cliente')
    is_store_owner = models.BooleanField(default=False)
    avatar         = models.ImageField(upload_to='avatars/', blank=True, null=True)
    email          = models.EmailField(unique=True)
    google_sub     = models.CharField(max_length=255, unique=True, null=True, blank=True)
    # Sucursal donde trabaja (solo para staff; los clientes no tienen sucursal).
    branch         = models.ForeignKey('Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='staff')

    class Meta:
        swappable = 'AUTH_USER_MODEL'

    def save(self, *args, **kwargs):
        self.is_store_owner = self.role in ('superadmin', 'admin', 'empleado')
        super().save(*args, **kwargs)


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True, null=True)
    parent = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='children'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Product(models.Model):
    OFFER_TAG_CHOICES = [
        ('', 'Sin etiqueta'),
        ('OFERTA',  'Oferta'),
        ('PROMO',   'Promo'),
        ('2x1',     '2x1'),
        ('3x2',     '3x2'),
        ('NUEVO',   'Nuevo'),
        ('POPULAR', 'Popular'),
    ]

    name          = models.CharField(max_length=200)
    net_content   = models.TextField(blank=True)
    price         = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    offer_tag     = models.CharField(max_length=20, choices=OFFER_TAG_CHOICES, blank=True, default='')
    category      = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    image         = models.ImageField(upload_to='products/', blank=True, null=True)
    stock         = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])
    is_active     = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def effective_price(self):
        return self.discount_price if self.discount_price is not None else self.price


class Combo(models.Model):
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price       = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    image       = models.ImageField(upload_to='combos/', blank=True, null=True)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ComboItem(models.Model):
    combo    = models.ForeignKey(Combo, on_delete=models.CASCADE, related_name='items')
    product  = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ['combo', 'product']

    def __str__(self):
        return f"{self.quantity}x {self.product.name} in {self.combo.name}"


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.user.username}"

    def total_price(self):
        return sum(item.subtotal() for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['cart', 'product']

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

    def subtotal(self):
        return self.product.price * self.quantity


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmado'),
        ('preparing', 'En preparación'),
        ('delivered', 'Entregado'),
        ('cancelled', 'Cancelado'),
    ]

    SOURCE_CHOICES = [
        ('online', 'Online'),
        ('presencial', 'Presencial'),
    ]

    PAYMENT_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
    ]

    DELIVERY_CHOICES = [
        ('envio', 'Envío a domicilio'),
        ('retiro', 'Retiro en el local'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='online')
    payment_method  = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='efectivo')
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='envio')
    # Nombre del contacto cuando el pedido es de un invitado (sin cuenta).
    guest_name = models.CharField(max_length=120, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_address = models.TextField()
    phone = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

    def subtotal(self):
        return self.price * self.quantity


class PaymentCard(models.Model):
    BRAND_CHOICES = [
        ('visa',       'Visa'),
        ('mastercard', 'Mastercard'),
        ('amex',       'American Express'),
        ('naranja',    'Naranja'),
        ('cabal',      'Cabal'),
        ('otra',       'Otra'),
    ]
    TYPE_CHOICES = [
        ('debit',  'Débito'),
        ('credit', 'Crédito'),
    ]

    user              = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_cards')
    cardholder_name   = models.CharField(max_length=100)
    last_four         = models.CharField(max_length=4)
    brand             = models.CharField(max_length=20, choices=BRAND_CHOICES, default='visa')
    card_type         = models.CharField(max_length=10, choices=TYPE_CHOICES, default='debit')
    available_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_default        = models.BooleanField(default=False)
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.get_brand_display()} *{self.last_four} ({self.user.username})"

    def save(self, *args, **kwargs):
        if self.is_default:
            PaymentCard.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class Employee(models.Model):
    name       = models.CharField(max_length=120)
    role       = models.CharField(max_length=50)
    phone      = models.CharField(max_length=30, blank=True)
    shift      = models.CharField(max_length=20, default='Mañana')
    active     = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.name


class Supplier(models.Model):
    name       = models.CharField(max_length=150)
    contact    = models.CharField(max_length=120, blank=True)
    phone      = models.CharField(max_length=30, blank=True)
    email      = models.EmailField(blank=True)
    categories = models.CharField(max_length=200, blank=True)
    active     = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Branch(models.Model):
    """Sucursal del negocio (Fontana, Resistencia, …). Cada una es una fila."""
    name       = models.CharField(max_length=100, unique=True)
    slug       = models.SlugField(max_length=100, unique=True)
    address    = models.CharField(max_length=200, blank=True)
    phone      = models.CharField(max_length=30, blank=True)
    is_active  = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Branches'

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.name
