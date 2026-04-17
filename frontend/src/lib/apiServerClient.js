const apiServerClient = {
  get: async (url) => {
    try {
      const response = await fetch(`http://localhost:3000${url}`);
      return response.json();
    } catch {
      return null;
    }
  },
  post: async (url, data) => {
    try {
      const response = await fetch(`http://localhost:3000${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    } catch {
      return null;
    }
  }
};

export default apiServerClient;
