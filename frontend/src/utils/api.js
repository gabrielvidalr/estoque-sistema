import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const produtosAPI = {
  listar: (params) => api.get('/produtos', { params }),
  buscar: (id) => api.get(`/produtos/${id}`),
  criar: (data) => api.post('/produtos', data),
  atualizar: (id, data) => api.put(`/produtos/${id}`, data),
  deletar: (id) => api.delete(`/produtos/${id}`),
  series: (id) => api.get(`/produtos/${id}/series`),
};

export const depositosAPI = {
  listar: () => api.get('/depositos'),
  criar: (data) => api.post('/depositos', data),
  atualizar: (id, data) => api.put(`/depositos/${id}`, data),
  deletar: (id) => api.delete(`/depositos/${id}`),
  estoque: (id) => api.get(`/depositos/${id}/estoque`),
};

export const seriesAPI = {
  buscarNumero: (n) => api.get(`/series/buscar/${encodeURIComponent(n)}`),
};

export const movimentacoesAPI = {
  listar: (params) => api.get('/movimentacoes', { params }),
  registrar: (data) => api.post('/movimentacoes', data),
};

export const usuariosAPI = {
  listar: () => api.get('/usuarios'),
  criar: (data) => api.post('/usuarios', data),
  atualizar: (id, data) => api.put(`/usuarios/${id}`, data),
};

export const dashboardAPI = { dados: () => api.get('/dashboard') };
export const categoriasAPI = { listar: () => api.get('/categorias') };

export default api;
