const API_URL = '/api';

export const authService = {
  async login(username, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
  },
  
  async signup(username, password) {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Signup failed');
    return data;
  }
};

export const skinService = {
  async analyze(userId, imageBlob) {
    const formData = new FormData();
    formData.append('image', imageBlob);
    formData.append('userId', userId);

    const response = await fetch(`${API_URL}/skincare/analyze`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Analysis failed');
    return response.json();
  },

  async getCurrentPlan(userId) {
    const response = await fetch(`${API_URL}/skincare/current/${userId}`);
    if (!response.ok) return null;
    return response.json();
  },

  async getAnalysisHistory(userId) {
    const response = await fetch(`${API_URL}/skincare/history/${userId}`);
    if (!response.ok) return [];
    return response.json();
  }
};

export const progressService = {
  async updateProgress(userId, date, type) {
    const response = await fetch(`${API_URL}/progress/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, date, type })
    });
    return response.json();
  },

  async getHistory(userId) {
    const response = await fetch(`${API_URL}/progress/${userId}`);
    return response.json();
  }
};
