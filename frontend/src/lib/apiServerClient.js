const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    const err = await response.json().catch(() => ({}));
    if (err.sessionRevoked) {
      localStorage.removeItem('auth_token');
      window.dispatchEvent(new CustomEvent('auth:session-revoked'));
    }
    throw new Error(err.message || 'No autorizado');
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Error ${response.status}`);
  }
  return response.json();
};

const api = {
  get: (url) =>
    fetch(`${API_URL}${url}`, { headers: getHeaders() }).then(handleResponse),

  post: (url, data) =>
    fetch(`${API_URL}${url}`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
    }).then(handleResponse),

  put: (url, data) =>
    fetch(`${API_URL}${url}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
    }).then(handleResponse),

  patch: (url, data) =>
    fetch(`${API_URL}${url}`, {
      method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data)
    }).then(handleResponse),

  delete: (url) =>
    fetch(`${API_URL}${url}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};

export default api;
