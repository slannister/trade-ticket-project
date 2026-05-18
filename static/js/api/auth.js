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

export async function resetPasswordConfirm(token, newPassword) {
    return apiClient.post('/auth/password/reset/confirm', { token, new_password: newPassword });
}

export async function verifyResetToken(token) {
    return apiClient.post('/auth/password/reset/verify', { token });
}

export async function updateProfile(data) {
    return apiClient.put('/auth/profile', data);
}

export async function updatePassword(currentPassword, newPassword) {
    return apiClient.put('/auth/profile/password', {
        current_password: currentPassword,
        new_password: newPassword
    });
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