import axios from 'axios';
import { navigate } from 'react-router-dom';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Fonction pour rafraîchir le token
const refreshToken = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/refresh-token', {
      refreshToken: localStorage.getItem('refreshToken'),
    });
    localStorage.setItem('token', response.data.token); // Mettre à jour le token
    return response.data.token;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token :', error);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login'); // Rediriger vers la page de connexion
    return null;
  }
};

// Intercepteur Axios pour rafraîchir le token
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        if (newToken) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return axios(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        navigate('/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Intercepteur pour ajouter le token à chaque requête
axios.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default axios;