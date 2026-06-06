"""
Genera pedidos de ejemplo distribuidos en los últimos 6 meses
para que los gráficos del dashboard tengan datos reales.
"""
import os
import django
import random
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lapinamarense.settings')
django.setup()

from django.utils import timezone
from shop.models import User, Product, Order, OrderItem

# ── Config ──────────────────────────────────────────────────────────────────
TOTAL_ORDERS   = 60        # cantidad de pedidos a generar
MONTHS_BACK    = 6         # distribución en los últimos N meses
USER_USERNAME  = 'cliente'  # usuario al que se asignan los pedidos (se crea si no existe)

# Probabilidades de hora (simula que hay más actividad al mediodía y tarde)
HOUR_WEIGHTS = [
    0,0,0,0,0,0,       # 0-5h  → casi nada
    1,2,3,             # 6-8h  → poco
    5,8,9,8,           # 9-12h → bastante
    4,3,4,             # 13-15h → moderado
    7,9,8,6,           # 16-19h → pico tarde
    4,2,1,0,           # 20-23h → bajando
]

# Pesos por día de semana (0=Dom … 6=Sáb)
DAY_WEIGHTS = [3, 5, 6, 7, 8, 9, 7]  # más actividad vie-sáb

STATUS_POOL = (
    ['delivered'] * 50 +
    ['confirmed'] * 15 +
    ['pending']   * 10 +
    ['preparing'] * 10 +
    ['cancelled'] * 5
)

# ── Setup ────────────────────────────────────────────────────────────────────
user, created = User.objects.get_or_create(
    username=USER_USERNAME,
    defaults={
        'email': f'{USER_USERNAME}@example.com',
        'first_name': 'Pablo',
        'last_name':  'Demo',
        'phone':      '1122334455',
        'address':    'Pinamar, Buenos Aires',
    }
)
if created:
    user.set_password('demo1234')
    user.save()
    print(f"Usuario '{USER_USERNAME}' creado.")
else:
    print(f"Usando usuario '{USER_USERNAME}' existente.")

products = list(Product.objects.filter(is_active=True))
if not products:
    print("No hay productos en la base de datos. Ejecutá create_products.py primero.")
    exit(1)

now = timezone.now()
start = now - timedelta(days=MONTHS_BACK * 30)

# Borrar pedidos demo anteriores para este usuario
deleted, _ = Order.objects.filter(user=user, notes__startswith='[demo]').delete()
if deleted:
    print(f"Se borraron {deleted} pedidos demo anteriores.")

print(f"\nGenerando {TOTAL_ORDERS} pedidos para '{USER_USERNAME}'...\n")

created_orders = []

for i in range(TOTAL_ORDERS):
    # Fecha aleatoria en el rango, ponderada por día de semana y hora
    days_offset = random.uniform(0, MONTHS_BACK * 30)
    base_date   = start + timedelta(days=days_offset)

    # Ajustar hacia días de semana con más peso
    for _ in range(3):
        candidate = start + timedelta(days=random.uniform(0, MONTHS_BACK * 30))
        if random.random() < DAY_WEIGHTS[candidate.weekday() % 7] / max(DAY_WEIGHTS):
            base_date = candidate
            break

    # Hora ponderada
    hour   = random.choices(range(24), weights=HOUR_WEIGHTS)[0]
    minute = random.randint(0, 59)
    second = random.randint(0, 59)

    order_date = base_date.replace(hour=hour, minute=minute, second=second, microsecond=0)

    # Productos del pedido (1-4 ítems)
    n_items       = random.choices([1,2,3,4], weights=[30,40,20,10])[0]
    chosen_prods  = random.sample(products, min(n_items, len(products)))
    total         = 0
    line_items    = []
    for prod in chosen_prods:
        qty    = random.randint(1, 3)
        price  = float(prod.price)
        total += price * qty
        line_items.append((prod, qty, price))

    status = random.choice(STATUS_POOL)

    order = Order.objects.create(
        user             = user,
        status           = status,
        source           = random.choice(['online', 'presencial']),
        total_amount     = total,
        delivery_address = 'Bvd. Mediterráneo 123, Pinamar',
        phone            = '2254123456',
        notes            = '[demo] pedido de ejemplo',
    )

    # Sobreescribir created_at (auto_now_add no permite asignar directamente)
    Order.objects.filter(pk=order.pk).update(created_at=order_date, updated_at=order_date)

    for prod, qty, price in line_items:
        OrderItem.objects.create(order=order, product=prod, quantity=qty, price=price)

    created_orders.append(order)

    status_icon = '+' if status == 'delivered' else '-'
    print(f"  {status_icon} #{order.id:>4}  {order_date.strftime('%d/%m/%Y %H:%M')}  {status:<10}  ${total:>10,.0f}  ({len(line_items)} items)")

print(f"\n{'='*60}")
print(f"  {TOTAL_ORDERS} pedidos generados para el usuario '{USER_USERNAME}'")
print(f"  Rango: {start.strftime('%d/%m/%Y')} → {now.strftime('%d/%m/%Y')}")
print(f"{'='*60}")
