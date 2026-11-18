import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api'
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and we're on an admin page, clear token
      if (window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
