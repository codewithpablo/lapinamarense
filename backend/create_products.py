import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lapinamarense.settings')
django.setup()

from shop.models import Category, Product, Combo, ComboItem

# Limpiar base de datos
print("Limpiando base de datos...")
ComboItem.objects.all().delete()
Combo.objects.all().delete()
Product.objects.all().delete()
Category.objects.all().delete()
print("Base de datos limpiada.\n")

# ─── Jerarquía de categorías ───────────────────────────────────────────────
# Padres (menú principal) y sus hijos (submenú desplegable)
#
# Pizzas
#   ├── Pizzas de Campo
#   ├── Pizzas Congeladas
#   └── Pizzetones Congelados
#
# Hamburguesas Congeladas          ← hoja (sin submenu)
#
# Congelados
#   ├── Congelados Panatta
#   └── Congelados Varios
#
# Tartas Congeladas                ← hoja
# Empanadas Congeladas             ← hoja
#
# Tapas
#   ├── Tapas Pascualina
#   ├── Tapas Empanada
#   └── Tapas Pastelitos
#
# Pastas                           ← hoja
#
# Combos
#   ├── Combos 200g
#   ├── Combos Principales
#   ├── Combos V-Power
#   ├── Combos Especiales
#   ├── Combo Loco
#   ├── Combos Grande
#   └── Megafiesta

def mkcat(name, description='', parent=None):
    return Category.objects.create(name=name, description=description, parent=parent)

print("Creando categorías...")

# Padres
p_pizzas   = mkcat('Pizzas',                   'Pizzas de campo y congeladas')
p_cong     = mkcat('Congelados',               'Productos congelados variados')
p_tapas    = mkcat('Tapas',                    'Tapas de pascualina, empanada y pastelitos')
p_combos   = mkcat('Combos',                   'Combos y promociones')

# Hojas sin padre
c_pastas   = mkcat('Pastas',                   'Fideos frescos, ñoquis y ravioles')
c_bebidas  = mkcat('Bebidas',                  'Aguas, gaseosas, jugos y más')
c_lacteos  = mkcat('Lácteos y Fiambres',       'Quesos, fiambres, lácteos')
c_panderia = mkcat('Panadería',                'Pan, facturas y productos de panadería')
c_golosi   = mkcat('Golosinas',                'Chocolates, caramelos y golosinas')
c_limpie   = mkcat('Limpieza',                 'Productos de limpieza del hogar')
c_alcohol  = mkcat('Bebidas Alcohólicas',      'Vinos, cervezas y licores')
c_cigarri  = mkcat('Cigarrillos',              'Cigarrillos y tabaco')

# Hijos de Pizzas
c_campo    = mkcat('Pizzas de Campo',          'Pizzas pre-horno, listas para terminar en tu horno',     parent=p_pizzas)
c_pizzasc  = mkcat('Pizzas Congeladas',        'Pizzas congeladas individuales y en pack',                parent=p_pizzas)
c_pizzeton = mkcat('Pizzetones Congelados',    'Pizzetones congelados individuales y en pack',            parent=p_pizzas)

# Hijos de Congelados
c_hambur   = mkcat('Hamburguesas Congeladas',  'Hamburguesas congeladas de las mejores marcas',           parent=p_cong)
c_panatta  = mkcat('Congelados Panatta',       'Chipacitos, bizcochitos y medialunas congeladas Panatta', parent=p_cong)
c_varios   = mkcat('Congelados Varios',        'Bastones de muzza, bocaditos y milanesas congeladas',     parent=p_cong)
c_tartas   = mkcat('Tartas Congeladas',        'Tartas congeladas individuales y en pack de 2',           parent=p_cong)
c_empan    = mkcat('Empanadas Congeladas',     'Empanadas congeladas por media docena o dos docenas',     parent=p_cong)

# Hijos de Tapas
c_tpascua  = mkcat('Tapas Pascualina',         'Tapas de pascualina de las mejores marcas',               parent=p_tapas)
c_tempan   = mkcat('Tapas Empanada',           'Tapas de empanada de las mejores marcas',                 parent=p_tapas)
c_tpastel  = mkcat('Tapas Pastelitos',         'Tapas de pastelitos de las mejores marcas',               parent=p_tapas)

# Hijos de Combos
c_c200     = mkcat('Combos 200g',              'Combos de 200g de fiambre y queso',                       parent=p_combos)
c_cprin    = mkcat('Combos Principales',       'Combos para reuniones y eventos',                         parent=p_combos)
c_cvpow    = mkcat('Combos V-Power',           'Combos premium con productos de calidad superior',        parent=p_combos)
c_cesp     = mkcat('Combos Especiales',        'Combos especiales para celebraciones',                    parent=p_combos)
c_cloco    = mkcat('Combo Loco',               'Combos económicos con 100g de cada producto',             parent=p_combos)
c_cgrande  = mkcat('Combos Grande',            'Combos en formato grande para grandes reuniones',         parent=p_combos)
c_mega     = mkcat('Megafiesta',               'Paquetes completos para fiestas y eventos',               parent=p_combos)

total_cats = Category.objects.count()
print(f"  {total_cats} categorías creadas ({Category.objects.filter(parent=None).count()} padres)\n")

# ─── Productos ─────────────────────────────────────────────────────────────
# Formato: (name, net_content, price, offer_tag)

products_data = [

    # ── PIZZAS DE CAMPO ──
    (c_campo, [
        ('Pizza de Campo Muzzarella',    '',   6000, ''),
        ('Pizza de Campo Muzza y Milán', '',   7000, ''),
        ('Pizza de Campo Muzza y Napo',  '',   7000, ''),
        ('Pizza de Campo Milán y Napo',  '',   8000, ''),
    ]),

    # ── PIZZAS CONGELADAS ──
    (c_pizzasc, [
        ('Pizza Muzzarella',              'x1',   5000, ''),
        ('Pizza Muzzarella',              'x3',  13000, ''),
        ('Pizza Muzzarella',              'x10', 40000, ''),
        ('Pizza Milán',                   'x1',   6000, ''),
        ('Pizza Milán',                   'x3',  16000, ''),
        ('Pizza Milán',                   'x10', 50000, ''),
        ('Pizza Napolitana',              'x1',   7000, ''),
        ('Pizza Napolitana',              'x3',  19000, ''),
        ('Pizza Napolitana',              'x10', 60000, ''),
        ('Super Promo Pizza Muzzarella',  'x3',  13000, 'PROMO'),
        ('Super Promo Pizza Mixto',       'x3',  16000, 'PROMO'),
        ('Pizza Premium Jamón y Morrones','',    14000, ''),
    ]),

    # ── PIZZETONES CONGELADOS ──
    (c_pizzeton, [
        ('Pizzetón Muzzarella',    'x1',  2200, ''),
        ('Pizzetón Muzzarella',    'x3',  6000, ''),
        ('Pizzetón Milán',         'x1',  2800, ''),
        ('Pizzetón Milán (mixto)', 'x3',  7000, ''),
        ('Pizzetón Napolitana',    'x1',  3000, ''),
    ]),

    # ── HAMBURGUESAS CONGELADAS ──
    (c_hambur, [
        ('Friar Fiesta',        '',    3000, ''),
        ('Friar Finitas',       '',    1300, ''),
        ('Friar Clásicas',      '',    3400, ''),
        ('Friar Grandes',       '',    4600, ''),
        ('Paty Finitas',        '',    3000, ''),
        ('Paty Clásicas',       '',    4800, ''),
        ('Paty Grandes',        '',    7000, ''),
        ('Paty Clásicas',       'x4',  9500, ''),
        ('Paty Express',        'x4',  6800, ''),
        ('Paty Roticera',       '',    3200, ''),
        ('Paladini Original',   '',    3200, ''),
        ('Paladini Cheddar',    '',    3200, ''),
        ('Paladini Bacon',      '',    3200, ''),
        ('Paladini Clásica',    '',    3600, ''),
        ('Paladini + Finita',   '',    2700, ''),
        ('Paladini Queso Azul', '',    3200, ''),
        ('Paladini Criolla',    '',    3200, ''),
        ('Swift',               '',    3100, ''),
        ('La Defensa',          '',     800, ''),
    ]),

    # ── CONGELADOS PANATTA ──
    (c_panatta, [
        ('Chipacitos Panatta',            'x400g', 4200, ''),
        ('Bizcochitos con Queso Panatta', 'x400g', 4200, ''),
        ('Medialunas Dulces Panatta',     'x6u',   2500, ''),
        ('Medialunas Saladas Panatta',    'x6u',   2500, ''),
    ]),

    # ── CONGELADOS VARIOS ──
    (c_varios, [
        ('Bastones de Muzza pre-horno',   '1 bandeja',   8000, ''),
        ('Bastones de Muzza pre-horno',   '2 bandejas', 15000, ''),
        ('Bocaditos de Esp. y Provolone', '1 bandeja',   6000, ''),
        ('Bocaditos de Esp. y Provolone', '2 bandejas', 10000, ''),
        ('Milanesas de Arroz o Vegetales','',            4500, ''),
    ]),

    # ── TARTAS CONGELADAS ──
    (c_tartas, [
        ('Tarta Jamón y Queso', 'x1', 4000, ''),
        ('Tarta Jamón y Queso', 'x2', 7000, ''),
        ('Tarta Acelga',        'x1', 4000, ''),
        ('Tarta Acelga',        'x2', 7000, ''),
        ('Tarta Pollo',         'x1', 5000, ''),
        ('Tarta Pollo',         'x2', 9000, ''),
        ('Tarta Choclo',        'x1', 5000, ''),
        ('Tarta Choclo',        'x2', 9000, ''),
        ('Tarta Zapallito',     'x1', 3000, ''),
        ('Tarta Zapallito',     'x2', 5000, ''),
    ]),

    # ── EMPANADAS CONGELADAS ──
    (c_empan, [
        ('Empanadas Verduras',      '½ docena',  4000, ''),
        ('Empanadas Carne',         '½ docena',  5000, ''),
        ('Empanadas Pollo',         '½ docena',  4000, ''),
        ('Empanadas Jamón y Queso', '½ docena',  3000, ''),
        ('Empanadas Verduras',      '2 docenas', 15000, ''),
        ('Empanadas Carne',         '2 docenas', 18000, ''),
        ('Empanadas Pollo',         '2 docenas', 18000, ''),
        ('Empanadas Jamón y Queso', '2 docenas', 15000, ''),
    ]),

    # ── TAPAS PASCUALINA ──
    (c_tpascua, [
        ('Tapas Pascualina Nono',        '',   1600, ''),
        ('Tapas Pascualina Nono',        'x2', 2600, ''),
        ('Tapas Pascualina Pamp',        '',   1700, ''),
        ('Tapas Pascualina Adolfina',    '',   2000, ''),
        ('Tapas Pascualina Pastilandia', '',   1600, ''),
        ('Tapas Pascualina Pastilandia', 'x2', 2500, ''),
    ]),

    # ── TAPAS EMPANADA ──
    (c_tempan, [
        ('Tapas Empanada Nono',        '',    1000, ''),
        ('Tapas Empanada Adolfina',    '',    1200, ''),
        ('Tapas Empanada Pamp',        '',    1100, ''),
        ('Tapas Empanada Pamp',        'x3',  3000, ''),
        ('Tapas Empanada Pilarense',   '',    1000, ''),
        ('Tapas Empanada Pilarense',   'x3',  2800, ''),
        ('Tapas Empanada Pastilandia', '',    1000, ''),
        ('Tapas Empanada Pastilandia', 'x3',  2500, ''),
        ('Tapas Empanada Nono Horno',  '',    1100, ''),
        ('Tapas Empanada Paq. 6 doc.', '',    6800, ''),
        ('Tapas Empanada Paq. 6 doc.', 'x3', 18000, ''),
    ]),

    # ── TAPAS PASTELITOS ──
    (c_tpastel, [
        ('Tapas Pastelitos Nono',        '',   1100, ''),
        ('Tapas Pastelitos Pamp',        '',   1200, ''),
        ('Tapas Pastelitos Pastilandia', '',   1100, ''),
        ('Tapas Pastelitos Pastilandia', 'x2', 2000, ''),
        ('Combo Pastelitos 24u + dulce', '',   2000, 'PROMO'),
    ]),

    # ── PASTAS ──
    (c_pastas, [
        ('Fideos frescos Pastilandia', 'x1',  1600, ''),
        ('Fideos frescos Pastilandia', 'x2',  2800, ''),
        ('Ñoquis Pastilandia',         'x1',  1600, ''),
        ('Ñoquis Pastilandia',         'x2',  2800, ''),
        ('Fideos Pamp',                '',    1800, ''),
        ('Ñoquis Pamp',                '',    1800, ''),
        ('Fideos frescos Adolfina',    '',    1800, ''),
        ('Ravioles Adolfina',          '',    3000, ''),
        ('Ravioles Pamp',              '',    2800, ''),
        ('Ravioles Nono',              '',    2400, ''),
        ('Ravioles La Italiana',       '½kg', 3400, ''),
        ('Ravioles La Italiana',       '1kg', 6500, ''),
    ]),

    # ── COMBOS 200g ──
    (c_c200, [
        ('Combo 200g 1', '200g Paleta Cocida + 200g Q. Barra',   4000, ''),
        ('Combo 200g 2', '200g Jamón Cocido + 200g Q. Barra',    4500, ''),
        ('Combo 200g 3', '200g Salame Milán + 200g Q. Barra',    4500, ''),
        ('Combo 200g 4', '200g Paleta Cocida + 200g Q. Cremoso', 3300, ''),
        ('Combo 200g 5', '200g Morta Lario + 200g Q. Barra',     3600, ''),
        ('Combo 200g 6', '200g Paleta Cocida + 200g Muzzarella', 3400, ''),
    ]),

    # ── COMBOS PRINCIPALES ──
    (c_cprin, [
        ('Combo 1',       '1 Pan de Miga + 10 fetas Q. Barra + 10 fetas Paleta',                              5000, ''),
        ('Combo 1 VIP',   '1 Pan de Miga + 10 fetas Q. Barra + 10 fetas Paleta Cocida',                       5500, ''),
        ('Combo 1 VIP 1', '1 Pan de Miga + 10 fetas Q. Barra + 10 fetas Salame Milán',                        6000, ''),
        ('Combo 1 VIP 2', '1 Pan de Miga + 10 fetas Q. Barra + 5 fetas Paleta Cocida + 8 fetas Salame Milán', 6000, ''),
        ('Combo 2',       '2 Pre-pizza + 150g Paleta + 300g Q. Cremoso',                                       4500, ''),
        ('Combo 2 VIP',   '2 Pre-pizza + 150g Paleta Cocida + 300g Muzzarella',                                5200, ''),
        ('Combo 2 VIP 1', '2 Pre-pizza + 150g Paleta Cocida + 300g Q. Cremoso',                                4700, ''),
        ('Combo 3',       '400g Q. Barra + 400g Paleta',                                                       6300, ''),
        ('Combo 3 VIP',   '400g Q. Barra + 400g Paleta Cocida',                                                7000, ''),
        ('Combo 4',       '1 Doc. Pan Panchos + 1 Doc. Salchichas + Mostaza o Ketchup',                        5000, ''),
        ('Combo 4 VIP',   '1 Doc. Pan Panchos + 1 Doc. Salchichas Especiales + Mostaza o Ketchup',             5600, ''),
        ('Combo 5',       '2 Paq. Hamb. + 4 Panes Hamb. + 4 fetas Paleta + 4 fetas Q. Barra',                 4000, ''),
        ('Combo 5 VIP',   '2 Paq. Hamb. + 4 Panes Hamb. + 4 fetas Paleta Cocida + 4 fetas Q. Barra',          4500, ''),
        ('Combo 6',       '1 Pascualina + 200g Q. Cremoso + 200g Paleta',                                      3900, ''),
        ('Combo 6 VIP',   '1 Pascualina + 200g Q. Cremoso + 200g Paleta Cocida',                               4500, ''),
        ('Combo 7',       '2 Doc. Tapas Emp. H/F + 250g Paleta + 200g Q. Cremoso',                             4400, ''),
        ('Combo 7 VIP',   '2 Doc. Tapas Emp. H/F + 250g Paleta Cocida + 200g Q. Cremoso',                      4800, ''),
        ('Combo 8',       '400g Muzzarella + 300g Paleta Cocida',                                               5800, ''),
        ('Combo 9',       '300g Salame Milán + 300g Q. Barra',                                                  6700, ''),
        ('Combo 10',      '400g Q. Cremoso + 400g Paleta',                                                      5400, ''),
        ('Combo 10 VIP',  '400g Q. Cremoso + 400g Paleta Cocida',                                              5800, ''),
        ('Combo 11',      '1 Paq. Pan Lactal + 10 fetas Q. Barra + 10 fetas Paleta',                           5000, ''),
        ('Combo 11 VIP',  '1 Paq. Pan Lactal + 10 fetas Q. Barra + 10 fetas Paleta Cocida',                    5500, ''),
        ('Combo 12',      '200g Jamón + 200g Salame Milán + 200g Q. Barra',                                     7600, ''),
    ]),

    # ── COMBOS V-POWER ──
    (c_cvpow, [
        ('V-Power 1',  '1 Pan de Miga + 10 fetas Barra Noal + 10 fetas Jamón',                           7000, ''),
        ('V-Power 2',  '1 Pan Lactal + 10 fetas Barra Noal + 10 fetas Jamón Lario',                      7500, ''),
        ('V-Power 3',  '400g Barra Noal + 400g Jamón Lario',                                             10500, ''),
        ('V-Power 4',  '1 Pascualina + 200g Cremoso Noal + 200g Jamón Lario',                            6300, ''),
        ('V-Power 5',  '2 Doc. tapas emp. CR + 250g Jamón Lario + 200g Cremoso Noal',                    7200, ''),
        ('V-Power 6',  '400g Cremoso Noal + 400g Jamón Lario',                                            9500, ''),
        ('V-Power 7',  '200g Milán Lario + 200g Barra Noal',                                              7500, ''),
        ('V-Power 8',  '200g Morta Paladini + 200g Barra Noal',                                           5200, ''),
        ('V-Power 9',  '2 Paq. Hamb. Friar Fiesta + 4 Panes Hamb. + 4 fetas Q. Barra + 4 fetas Paleta', 6900, ''),
        ('V-Power 10', '200g Jamón Lario + 200g Barra Noal',                                              6000, ''),
        ('V-Power 11', '1 Doc. Salch. Paladini + 1 Doc. Pan Panchos + Ketchup o Mostaza',                 8200, ''),
        ('V-Power 12', '1 Pascualina + 200g Barra Noal + 200g Jamón Lario',                               6500, ''),
    ]),

    # ── COMBOS ESPECIALES ──
    (c_cesp, [
        ('Combo Pernil',      '12 Panes de Pernil + 150g Paleta Cocida + 150g Q. Barra',                    4200, ''),
        ('Combo Juntada',     '6 Paq. Hamb. + 12 Panes + 12 fetas Paleta + 12 fetas Queso + 1 Mayo 250g', 13500, ''),
        ('Combo Superpancho', '12 Salchichas XL + 12 Panes Pancho XL',                                      9000, ''),
        ('Combo Pizzeta x12', '12 Pizzetas + 100g Paleta Cocida + 100g Q. Barra',                           3500, ''),
        ('Combo Pizzeta x24', '24 Pizzetas + 150g Paleta Cocida + 200g Muzzarella',                          4500, ''),
    ]),

    # ── COMBO LOCO ──
    (c_cloco, [
        ('Combo Loco 1', '100g Paleta Cocida + 100g Q. Barra + 100g Salame Milán', 2800, ''),
        ('Combo Loco 2', '100g Salchichón + 100g Q. Barra + 100g Mortadela',       2800, ''),
        ('Combo Loco 3', '100g Morcillón + 100g Q. Barra + 100g Mortadela',        2800, ''),
    ]),

    # ── COMBOS GRANDE ──
    (c_cgrande, [
        ('Combo Grande 1', '1 Molde de Miga + 1kg Paleta Sandw. + 1kg Q. Barra', 25000, ''),
        ('Combo Grande 2', '1 Molde de Miga + 1kg Paleta Cocida + 1kg Q. Barra', 27500, ''),
        ('Combo Grande 3', '1 Molde de Miga + 1kg Jamón + 1kg Q. Barra',         32000, ''),
        ('Combo Grande 4', '1kg Q. Barra + 1kg Paleta Sand.',                     15000, ''),
        ('Combo Grande 5', '1kg Q. Barra + 1kg Paleta Cocida',                    17000, ''),
        ('Combo Grande 6', '1kg Q. Barra + 1kg Jamón Cocido',                     22000, ''),
    ]),

    # ── MEGAFIESTA ──
    (c_mega, [
        ('Megafiesta 1', '1 pieza Muzzarella 3kg + 30 Pre-pizzas + 500g Paleta rallada + 500g Calabresa + 1kg aceitunas + 1lt salsa',    60000, ''),
        ('Megafiesta 2', '1 pieza Cremoso Noal 4kg + 30 Pre-pizzas + 500g Paleta rallada + 500g Calabresa + 1kg aceitunas + 1lt salsa',  60000, ''),
    ]),
]

print("Creando productos...")
total = 0
for cat_obj, items in products_data:
    print(f"\n  [{cat_obj.name}]")
    for name, net_content, price, offer_tag in items:
        Product.objects.create(
            name=name,
            net_content=net_content,
            price=price,
            offer_tag=offer_tag,
            category=cat_obj,
            stock=100,
            is_active=True,
        )
        label = f"{name} {net_content}".strip()
        print(f"    + {label:<55} ${price:>7,}")
        total += 1

print(f"\n{'='*60}")
print(f"  {Category.objects.count()} categorias  |  {total} productos")
print(f"{'='*60}")
