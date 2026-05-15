import apiClient from './client.js';

export async function register(email, password, displayName) {
    const data = await apiClient.post('/auth/register', {
        email,
        password,
        display_name: displayName
    });
    if (data.access_token) {
        apiClient.setToken(data.access_token);
    }
    return data;
}

export async function login(email, password) {
    const data = await apiClient.post('/auth/login', { email, password });
    if (data.access_token) {
        apiClient.setToken(data.access_token);
    }
    return data;
}

export async function logout() {
    try {
        await apiClient.post('/auth/logout');
    } finally {
        apiClient.setToken(null);
    }
}

export async function getMe() {
    return apiClient.get('/auth/me');
}

export async function resetPassword(email) {
    return apiClient.post('/auth/password/reset', { email });
}

export function getCurrentUser() {
    return JSON.parse(localStorage.getItem('auth_user') || 'null');
}

export function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('auth_user');
    }
}