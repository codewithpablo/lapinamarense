// Carrito unificado: si hay sesión usa el carrito del backend; si no, un carrito
// de invitado guardado en localStorage. Misma API para ambos casos.
import { cartAPI } from './api';

export interface CartProduct {
  id: number;
  name: string;
  price: number;
  image?: string;
  image_url?: string;
}
export interface CartLine {
  id: number;
  product: CartProduct;
  quantity: number;
  subtotal: number;
}
export interface CartData {
  items: CartLine[];
  total_price: number;
}

const GUEST_KEY = 'guest_cart';

export function isAuth(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}

interface GuestLine { product: CartProduct; quantity: number; }

function readGuest(): GuestLine[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]'); } catch { return []; }
}
function writeGuest(items: GuestLine[]) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('cart-changed'));
}

function guestToCartData(): CartData {
  const raw = readGuest();
  const items: CartLine[] = raw.map((it, i) => ({
    id: i,
    product: it.product,
    quantity: it.quantity,
    subtotal: Number(it.product.price) * it.quantity,
  }));
  return { items, total_price: items.reduce((s, it) => s + it.subtotal, 0) };
}

export const cart = {
  async get(): Promise<CartData> {
    if (isAuth()) {
      const r = await cartAPI.get();
      return r.data as CartData;
    }
    return guestToCartData();
  },

  async add(product: CartProduct, quantity = 1): Promise<void> {
    if (isAuth()) { await cartAPI.addItem(product.id, quantity); return; }
    const items = readGuest();
    const ex = items.find(i => i.product.id === product.id);
    if (ex) ex.quantity += quantity;
    else items.push({ product: { id: product.id, name: product.name, price: Number(product.price), image: product.image || product.image_url }, quantity });
    writeGuest(items);
  },

  async update(productId: number, quantity: number): Promise<void> {
    if (quantity < 1) return;
    if (isAuth()) { await cartAPI.updateItem(productId, quantity); return; }
    const items = readGuest();
    const ex = items.find(i => i.product.id === productId);
    if (ex) ex.quantity = quantity;
    writeGuest(items.filter(i => i.quantity > 0));
  },

  async remove(productId: number): Promise<void> {
    if (isAuth()) { await cartAPI.removeItem(productId); return; }
    writeGuest(readGuest().filter(i => i.product.id !== productId));
  },

  async clear(): Promise<void> {
    if (isAuth()) { await cartAPI.clear(); return; }
    writeGuest([]);
  },

  // Cantidad de ítems del carrito de invitado (sincrónico, para el badge sin sesión).
  guestCount(): number {
    return readGuest().reduce((s, i) => s + i.quantity, 0);
  },
};
