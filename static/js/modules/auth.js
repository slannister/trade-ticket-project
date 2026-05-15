import * as authApi from '../api/auth.js';
import { showToast } from '../utils/dom.js';

let currentUser = null;
let onAuthChange = null;

export function init(authChangeCallback) {
    onAuthChange = authChangeCallback;
    const savedUser = authApi.getCurrentUser();
    if (savedUser) {
        currentUser = savedUser;
        if (onAuthChange) onAuthChange(currentUser);
    }
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
    if (onAuthChange) onAuthChange(currentUser);
}

export function requireAuth(reason = '') {
    if (!isAuthenticated()) {
        showToast(reason || '請先登入', 'warning');
        return false;
    }
    return true;
}