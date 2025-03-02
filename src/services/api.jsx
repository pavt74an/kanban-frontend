import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // If the error is due to an expired token, clear localStorage and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Function to clear token on logout
export const clearToken = () => {
  localStorage.removeItem('token');
};

export default api;
