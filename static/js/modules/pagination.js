const ITEMS_PER_PAGE = 20;

let currentPage = 1;
let totalPages = 1;
let totalItems = 0;

export function getPagination() {
    return { currentPage, totalPages, totalItems };
}

export function setPagination(page, total, perPage = ITEMS_PER_PAGE) {
    currentPage = page;
    totalItems = total;
    totalPages = Math.max(1, Math.ceil(total / perPage));
}

export function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        return currentPage;
    }
    return null;
}

export function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        return currentPage;
    }
    return null;
}

export function resetPage() {
    currentPage = 1;
}

export function getOffset(perPage = ITEMS_PER_PAGE) {
    return (currentPage - 1) * perPage;
}