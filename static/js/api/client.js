const API_BASE = '/api';

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE;
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            ...options.headers
        };

        // Don't set Content-Type for FormData (browser sets it with boundary)
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Request failed: ${response.status}`);
        }

        // Unwrap Flask's { success: true, data: {...} } wrapper
        // so the rest of the app can use the data directly
        if (data.success && data.data !== undefined) {
            return data.data;
        }

        // Some endpoints return { success: true, message: "..." } without data
        return data;
    }

    get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
export default apiClient;