import * as authApi from '../api/auth.js';
import { showToast } from '../utils/dom.js';

let currentUser = null;
let onAuthChange = null;

export function init(authChangeCallback) {
    onAuthChange = authChangeCallback;
    validateToken();
}

async function validateToken() {
    const savedUser = authApi.getCurrentUser();
    const token = localStorage.getItem('auth_token');
    if (savedUser && token) {
        try {
            const data = await authApi.getMe();
            currentUser = data.user;
            authApi.setCurrentUser(currentUser);
        } catch (e) {
            currentUser = null;
            authApi.setCurrentUser(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
        }
    } else if (savedUser) {
        authApi.setCurrentUser(null);
        currentUser = null;
    }
    if (onAuthChange) onAuthChange(currentUser);
}

export function getCurrentUser() {
    return currentUser;
}

export function isAuthenticated() {
    return !!currentUser;
}

export async function handleLogin(email, password) {
    const data = await authApi.login(email, password);
    currentUser = data.user;
    authApi.setCurrentUser(currentUser);
    if (onAuthChange) onAuthChange(currentUser);
    return data;
}

export async function handleRegister(email, password, displayName) {
    const data = await authApi.register(email, password, displayName);
    currentUser = data.user;
    authApi.setCurrentUser(currentUser);
    if (onAuthChange) onAuthChange(currentUser);
    return data;
}

export async function handleLogout() {
    await authApi.logout();
    currentUser = null;
    authApi.setCurrentUser(null);
    localStorage.removeItem('favorites');
    if (onAuthChange) onAuthChange(currentUser);
}

export function requireAuth(reason = '') {
    if (!isAuthenticated()) {
        showToast(reason || '請先登入', 'warning');
        return false;
    }
    return true;
}