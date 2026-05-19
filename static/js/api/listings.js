import apiClient from './client.js';

export async function getListings(params = {}) {
    return apiClient.get('/listings', params);
}

export async function getListing(id) {
    return apiClient.get(`/listings/${id}`);
}

export async function createListing(listing) {
    return apiClient.post('/listings', listing);
}

export async function updateListing(id, listing) {
    return apiClient.put(`/listings/${id}`, listing);
}

export async function deleteListing(id) {
    return apiClient.delete(`/listings/${id}`);
}

export async function updateListingStatus(id, status) {
    return apiClient.put(`/listings/${id}/status`, { status });
}

export async function getMyListings() {
    return apiClient.get('/listings/mine');
}

export async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
    }
    return data.data || data;
}