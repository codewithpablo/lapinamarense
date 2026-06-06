"""
Descarga imagenes reales de supermercados argentinos (Jumbo, Disco, Friar, Paladini)
y las asigna a los productos en la base de datos.
"""
import os
import django
import requests
from django.core.files.base import ContentFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lapinamarense.settings')
django.setup()

from shop.models import Product

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
}

# Orden importa: la primera coincidencia (name.lower() contains pattern) gana.
RULES = [
    # Hamburguesas Friar
    ('friar fiesta',     'https://static.wixstatic.com/media/813d9d_b4683d59cc2a4d26a8c0d7223b9e1280~mv2.png'),
    ('friar finitas',    'https://static.wixstatic.com/media/813d9d_97fc0dd012b94596b9ce1a12b16aa1da~mv2.png'),
    ('friar clasicas',   'https://static.wixstatic.com/media/813d9d_a271469d314e41d9b1fbfa4263a42051~mv2.png'),
    ('friar grandes',    'https://static.wixstatic.com/media/813d9d_9264975f7a13415f901c705daa72ee85~mv2.png'),

    # Hamburguesas Paty
    ('paty finitas',     'https://jumboargentina.vtexassets.com/arquivos/ids/773992-800-auto?v=638146533949700000&width=800&height=auto&aspect=true'),
    ('paty clasicas',    'https://jumboargentina.vtexassets.com/arquivos/ids/802925-800-auto?v=638375620357230000&width=800&height=auto&aspect=true'),
    ('paty express',     'https://jumboargentina.vtexassets.com/arquivos/ids/773991-800-auto?v=638146533947070000&width=800&height=auto&aspect=true'),
    ('paty grandes',     'https://jumboargentina.vtexassets.com/arquivos/ids/773993-800-auto?v=638146533952400000&width=800&height=auto&aspect=true'),
    ('paty roticera',    'https://jumboargentina.vtexassets.com/arquivos/ids/826754-800-auto?v=638556393624070000&width=800&height=auto&aspect=true'),

    # Hamburguesas Paladini
    ('paladini + finita', 'https://www.paladini.com.ar/assets/img/productos/productos/hamburguesas-finas.png'),
    ('paladini',          'https://www.paladini.com.ar/assets/img/productos/productos/hamburguesas-clasicas-x2.png'),

    # Otras hamburguesas
    ('swift',            'https://jumboargentina.vtexassets.com/arquivos/ids/802925-800-auto?v=638375620357230000&width=800&height=auto&aspect=true'),
    ('la defensa',       'https://jumboargentina.vtexassets.com/arquivos/ids/773992-800-auto?v=638146533949700000&width=800&height=auto&aspect=true'),

    # Panatta
    ('chipacitos',       'https://jumboargentina.vtexassets.com/arquivos/ids/189734-800-auto?v=636383502909400000&width=800&height=auto&aspect=true'),
    ('bizcochitos',      'https://jumboargentina.vtexassets.com/arquivos/ids/776406-800-auto?v=638168349681800000&width=800&height=auto&aspect=true'),
    ('medialunas',       'https://jumboargentina.vtexassets.com/arquivos/ids/585354-800-auto?v=637256766268100000&width=800&height=auto&aspect=true'),

    # Pizzas
    ('pizzeton',         'https://jumboargentina.vtexassets.com/arquivos/ids/848274-800-auto?v=638693770140700000&width=800&height=auto&aspect=true'),
    ('pizza',            'https://jumboargentina.vtexassets.com/arquivos/ids/848274-800-auto?v=638693770140700000&width=800&height=auto&aspect=true'),

    # Congelados varios
    ('bastones',         'https://jumboargentina.vtexassets.com/arquivos/ids/850988-800-auto?v=638711806943500000&width=800&height=auto&aspect=true'),
    ('bocaditos',        'https://jumboargentina.vtexassets.com/arquivos/ids/850988-800-auto?v=638711806943500000&width=800&height=auto&aspect=true'),
    ('milanesas de arroz','https://jumboargentina.vtexassets.com/arquivos/ids/528223-800-auto?v=636890373035530000&width=800&height=auto&aspect=true'),

    # Tartas
    ('tarta',            'https://jumboargentina.vtexassets.com/arquivos/ids/528223-800-auto?v=636890373035530000&width=800&height=auto&aspect=true'),

    # Empanadas
    ('empanadas',        'https://jumboargentina.vtexassets.com/arquivos/ids/181622-800-auto?v=636383415926100000&width=800&height=auto&aspect=true'),

    # Tapas
    ('tapas pascualina', 'https://jumboargentina.vtexassets.com/arquivos/ids/657405-800-auto?v=637629201154200000&width=800&height=auto&aspect=true'),
    ('tapas empanada',   'https://jumboargentina.vtexassets.com/arquivos/ids/771536-800-auto?v=638132062304330000&width=800&height=auto&aspect=true'),
    ('tapas pastelitos', 'https://jumboargentina.vtexassets.com/arquivos/ids/771537-800-auto?v=638132062308100000&width=800&height=auto&aspect=true'),
    ('combo pastelitos', 'https://jumboargentina.vtexassets.com/arquivos/ids/771537-800-auto?v=638132062308100000&width=800&height=auto&aspect=true'),

    # Pastas
    ('ravioles',         'https://jumboargentina.vtexassets.com/arquivos/ids/657716-800-auto?v=637634817205500000&width=800&height=auto&aspect=true'),
    ('fideos',           'https://jumboargentina.vtexassets.com/arquivos/ids/657708-800-auto?v=637634817158670000&width=800&height=auto&aspect=true'),
    ('oquis',            'https://jumboargentina.vtexassets.com/arquivos/ids/657708-800-auto?v=637634817158670000&width=800&height=auto&aspect=true'),
]


def find_url(name):
    name_lower = name.lower()
    # Normalize accents for matching
    for ch, rep in [('á','a'),('é','e'),('í','i'),('ó','o'),('ú','u'),('ü','u'),('ñ','n')]:
        name_lower = name_lower.replace(ch, rep)
    for pattern, url in RULES:
        if pattern in name_lower:
            return url
    return None


# Cache de contenido ya descargado para no repetir requests al mismo URL
url_cache = {}

products = Product.objects.all()
print(f"Total productos: {products.count()}\n")

ok = already = skip = fail = 0

for product in products:
    if product.image:
        already += 1
        continue

    url = find_url(product.name)
    if not url:
        skip += 1
        continue

    if url not in url_cache:
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            if r.status_code == 200:
                url_cache[url] = r.content
            else:
                print(f"  HTTP {r.status_code} — {product.name}")
                fail += 1
                continue
        except Exception as e:
            print(f"  Error — {product.name}: {e}")
            fail += 1
            continue

    data = url_cache[url]
    safe = product.name.lower().replace(' ', '_')[:35].strip('_')
    for ch in ['/', '\\', '?', '*', ':', '<', '>', '|']:
        safe = safe.replace(ch, '_')
    filename = f"{safe}_{product.id}.jpg"
    product.image.save(filename, ContentFile(data), save=True)
    print(f"  + {product.name} ({product.net_content or '-'})")
    ok += 1

print(f"\n{'='*55}")
print(f"  + {ok} descargadas   = {already} ya tenian   - {fail} fallaron   ? {skip} sin regla")
print(f"{'='*55}")
