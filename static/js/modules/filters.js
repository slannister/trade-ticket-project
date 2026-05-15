export const LISTING_TYPES = {
    auction: '出售',
    transfer: '讓票',
    swap: '交換',
    request: '求票'
};

export const DELIVERY_METHODS = {
    meetup: '面交',
    shipping: '寄件'
};

export const URGENCY_LEVELS = {
    normal: '一般',
    urgent: '超急'
};

let activeFilters = {
    type: 'all',
    category: 'all',
    delivery: 'all',
    search: '',
    quantityMin: null,
    createdStart: '',
    createdEnd: '',
    expiresStart: '',
    expiresEnd: ''
};

export function getFilters() {
    return { ...activeFilters };
}

export function setFilter(key, value) {
    activeFilters[key] = value;
}

export function resetFilters() {
    activeFilters = {
        type: 'all',
        category: 'all',
        delivery: 'all',
        search: '',
        quantityMin: null,
        createdStart: '',
        createdEnd: '',
        expiresStart: '',
        expiresEnd: ''
    };
}

export function buildQueryParams() {
    const params = {};
    if (activeFilters.type !== 'all') params.type = activeFilters.type;
    if (activeFilters.category !== 'all') params.category = activeFilters.category;
    if (activeFilters.delivery !== 'all') params.delivery = activeFilters.delivery;
    if (activeFilters.search) params.search = activeFilters.search;
    return params;
}