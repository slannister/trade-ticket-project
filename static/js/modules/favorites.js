import apiClient from '../api/client.js';

const FAVORITES_KEY = 'favorites';
let favorites = new Set();

export function init() {
    try {
        const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
        favorites = new Set(saved);
    } catch {
        favorites = new Set();
    }
}

export function isFavorite(listingId) {
    return favorites.has(listingId.toString());
}

export async function toggle(listingId) {
    const key = listingId.toString();
    const wasFavorite = favorites.has(key);

    try {
        if (wasFavorite) {
            await apiClient.delete(`/favorites/${listingId}`);
            favorites.delete(key);
        } else {
            await apiClient.post(`/favorites/${listingId}`);
            favorites.add(key);
        }
        save();
        return !wasFavorite;
    } catch (e) {
        console.error('Favorite toggle failed:', e);
        throw e;
    }
}

function save() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
}

export async function syncFromServer() {
    try {
        const response = await apiClient.get('/favorites');
        if (response.favorites) {
            favorites = new Set(response.favorites.map(l => l.id.toString()));
            save();
        }
    } catch (e) {
        console.warn('Failed to sync favorites', e);
    }
}

export async function addFavorite(listingId) {
    await apiClient.post(`/favorites/${listingId}`);
    favorites.add(listingId.toString());
    save();
}

export async function removeFavorite(listingId) {
    await apiClient.delete(`/favorites/${listingId}`);
    favorites.delete(listingId.toString());
    save();
}