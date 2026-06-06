import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem('access_token', response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        } catch (err) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login/', { username, password }),
  register: (data: any) =>
    api.post('/auth/register/', data),
};

export const productsAPI = {
  getAll: (params?: any) => api.get('/products/', { params }),
  getById: (id: number) => api.get(`/products/${id}/`),
  create: (data: any) => api.post('/products/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: number, data: any) => api.put(`/products/${id}/`, data),
  patch:  (id: number, data: any) => api.patch(`/products/${id}/`, data),
  delete: (id: number) => api.delete(`/products/${id}/`),
};

export const categoriesAPI = {
  getAll: ()                  => api.get('/categories/'),
  create: (data: any)         => api.post('/categories/', data),
  update: (id: number, data: any) => api.put(`/categories/${id}/`, data),
  delete: (id: number)        => api.delete(`/categories/${id}/`),
};

export const combosAPI = {
  getAll: ()                        => api.get('/combos/'),
  getById: (id: number)             => api.get(`/combos/${id}/`),
  create: (data: any)               => api.post('/combos/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: any)   => api.patch(`/combos/${id}/`, data),
  delete: (id: number)              => api.delete(`/combos/${id}/`),
  addItem: (id: number, product_id: number, quantity: number) =>
    api.post(`/combos/${id}/item/`, { product_id, quantity }),
  removeItem: (id: number, product_id: number) =>
    api.delete(`/combos/${id}/item/`, { data: { product_id } }),
};

export const cartAPI = {
  get: () => api.get('/cart/'),
  addItem: (productId: number, quantity: number) =>
    api.post('/cart/add_item/', { product_id: productId, quantity }),
  updateItem: (productId: number, quantity: number) =>
    api.put('/cart/update_item/', { product_id: productId, quantity }),
  removeItem: (productId: number) =>
    api.delete('/cart/remove_item/', { data: { product_id: productId } }),
  clear: () => api.delete('/cart/clear/'),
};

export const cardsAPI = {
  getAll:    ()                  => api.get('/cards/'),
  create:    (data: any)         => api.post('/cards/', data),
  update:    (id: number, data: any) => api.patch(`/cards/${id}/`, data),
  delete:    (id: number)        => api.delete(`/cards/${id}/`),
  setDefault:(id: number)        => api.patch(`/cards/${id}/set_default/`),
};

export const ordersAPI = {
  getAll: () => api.get('/orders/'),
  getById: (id: number) => api.get(`/orders/${id}/`),
  create: (data: any) => api.post('/orders/', data),
  presencial: (data: { items: { product_id: number; quantity: number }[]; customer_id?: number | null; notes?: string }) =>
    api.post('/orders/presencial/', data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}/update_status/`, { status }),
  getSalesData: () => api.get('/orders/sales_data/'),
};

export const profileAPI = {
  get:            ()           => api.get('/auth/profile/'),
  update:         (data: any)  => api.patch('/auth/profile/', data),
  uploadAvatar:   (file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.patch('/auth/profile/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  changePassword: (old_password: string, new_password: string) =>
    api.put('/auth/profile/', { old_password, new_password }),
};

export const rolesAPI = {
  getUsers: ()                           => api.get('/auth/roles/'),
  updateRole: (id: number, role: string) => api.patch(`/auth/roles/${id}/`, { role }),
};

export default api;
