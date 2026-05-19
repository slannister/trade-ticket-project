import { formatDateValue, formatDateTimeValue } from './utils/date.js';
import { showToast, query, queryAll, createElement, removeChildren, show, hide } from './utils/dom.js';
import { getFilters, setFilter, resetFilters, buildQueryParams } from './modules/filters.js';
import { getPagination, setPagination, nextPage, prevPage, resetPage } from './modules/pagination.js';
import { loadListings, loadMyListings, createListing, updateListing, deleteListing, updateListingStatus, uploadImage } from './modules/listings.js';
import { init as initAuth, handleLogin, handleRegister, handleLogout, getCurrentUser, requireAuth } from './modules/auth.js';
import { init as initFavorites, isFavorite, toggle as toggleFavoriteLocal, syncFromServer, addFavorite, removeFavorite } from './modules/favorites.js';
import { init as initChat } from './modules/chat.js';
import { initI18n, getLocale, setLocale, t, updateStaticContent } from './i18n/index.js';
const CATEGORY_BACKGROUNDS = {
    '演唱會': 'linear-gradient(140deg, rgba(224, 114, 255, 0.4), rgba(118, 86, 255, 0.35))',
    'Concert': 'linear-gradient(140deg, rgba(224, 114, 255, 0.4), rgba(118, 86, 255, 0.35))',
    '體育賽事': 'linear-gradient(140deg, rgba(91, 200, 255, 0.35), rgba(76, 181, 163, 0.4))',
    'Sports': 'linear-gradient(140deg, rgba(91, 200, 255, 0.35), rgba(76, 181, 163, 0.4))',
    '戲劇舞台': 'linear-gradient(140deg, rgba(255, 168, 91, 0.4), rgba(170, 99, 255, 0.35))',
    'Theater': 'linear-gradient(140deg, rgba(255, 168, 91, 0.4), rgba(170, 99, 255, 0.35))',
    '綜藝活動': 'linear-gradient(140deg, rgba(255, 129, 179, 0.38), rgba(255, 182, 108, 0.38))',
    'Show / Event': 'linear-gradient(140deg, rgba(255, 129, 179, 0.38), rgba(255, 182, 108, 0.38))',
    '展覽 / 市集': 'linear-gradient(140deg, rgba(99, 205, 255, 0.35), rgba(112, 255, 188, 0.35))',
    'Exhibition / Market': 'linear-gradient(140deg, rgba(99, 205, 255, 0.35), rgba(112, 255, 188, 0.35))',
    '收藏品 / 周邊': 'linear-gradient(140deg, rgba(164, 129, 255, 0.38), rgba(108, 218, 255, 0.32))',
    'Collectibles / Merchandise': 'linear-gradient(140deg, rgba(164, 129, 255, 0.38), rgba(108, 218, 255, 0.32))',
    '其他': 'linear-gradient(140deg, rgba(140, 150, 170, 0.35), rgba(90, 99, 120, 0.35))',
    'Other': 'linear-gradient(140deg, rgba(140, 150, 170, 0.35), rgba(90, 99, 120, 0.35))'
};

const LISTING_TYPES = { auction: '出售', transfer: '讓票', swap: '交換', request: '求票' };
const LISTING_TYPES_EN = { auction: 'For Sale', transfer: 'Transfer', swap: 'Swap', request: 'Request' };
const DELIVERY_METHODS = { meetup: '面交', shipping: '寄件' };
const DELIVERY_METHODS_EN = { meetup: 'Meetup', shipping: 'Shipping' };

function getListingTypeLabel(type) {
    const locale = getLocale();
    if (locale.startsWith('zh')) {
        return LISTING_TYPES[type] || type || '';
    }
    return LISTING_TYPES_EN[type] || type || '';
}

function getDeliveryMethodLabel(method) {
    const locale = getLocale();
    if (locale.startsWith('zh')) {
        return DELIVERY_METHODS[method] || method || '';
    }
    return DELIVERY_METHODS_EN[method] || method || '';
}

function getCategoryBackground(category) {
    return CATEGORY_BACKGROUNDS[category] || 'linear-gradient(140deg, rgba(91, 140, 255, 0.24), rgba(127, 91, 255, 0.18))';
}

let listings = [];
let activeCategory = 'all';
let editingListingId = null;

document.addEventListener('DOMContentLoaded', async () => {
    initI18n();
    updateStaticContent();
    initAuth(handleAuthChange);
    initFavorites();
    initChat(loadMessagesView);
    initThemeToggle();
    initLangToggle();
    initMemberModal();
    initImageModal();
    bindEvents();
    await loadInitialData();
});

/* ── Theme Toggle ── */
function initThemeToggle() {
    const toggle = query('#theme-toggle');
    if (!toggle) return;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    toggle.setAttribute('aria-label', savedTheme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark'));

    toggle.addEventListener('click', () => {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        toggle.setAttribute('aria-label', next === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark'));
    });
}

/* ── Language Toggle ── */
function initLangToggle() {
    const toggle = query('#lang-toggle');
    if (!toggle) return;

    const updateLabel = () => {
        const locale = getLocale();
        toggle.textContent = locale.startsWith('zh') ? 'EN' : '中';
    };
    updateLabel();

    toggle.addEventListener('click', () => {
        const current = getLocale();
        const next = current.startsWith('zh') ? 'en' : 'zh-TW';
        setLocale(next);
        updateStaticContent();
        renderListings();
        updateLabel();
    });
}

/* ── Member Modal ── */
function initMemberModal() {
    const modal = query('#member-modal');
    if (!modal) return;

    // Open modal
    const triggers = queryAll('[data-member-trigger]');
    triggers.forEach(btn => {
        btn.addEventListener('click', () => {
            const user = getCurrentUser();
            if (user) {
                // If already logged in, show account menu
                const accountMenu = query('[data-account-menu]');
                if (accountMenu) {
                    const isHidden = accountMenu.hidden || !accountMenu.classList.contains('is-open');
                    accountMenu.hidden = false;
                    accountMenu.classList.toggle('is-open', isHidden);
                }
                return;
            }
            openMemberModal();
        });
    });

    // Close modal
    queryAll('[data-member-dismiss]').forEach(el => {
        el.addEventListener('click', () => closeMemberModal());
    });

    // Tab switching
    queryAll('[data-member-tab]', modal).forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.dataset.memberTab;
            switchMemberView(view);
        });
    });

    // Route links (我要註冊, 返回登入, 忘記密碼)
    queryAll('[data-member-route]', modal).forEach(link => {
        link.addEventListener('click', () => {
            switchMemberView(link.dataset.memberRoute);
        });
    });

    // Login form
    const loginForm = query('#member-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = query('#member-login-email').value;
            const password = query('#member-login-password').value;
            try {
                await handleLogin(email, password);
                showToast(t('auth.loginSuccess'), 'success');
                closeMemberModal();
            } catch (err) {
                showMemberMessage(err.message || t('auth.loginFailed'), 'error');
            }
        });
    }

    // Signup form
    const signupForm = query('#member-signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = query('#member-signup-email').value;
            const password = query('#member-signup-password').value;
            const confirm = query('#member-signup-confirm').value;
            if (password !== confirm) {
                showMemberMessage(t('auth.passwordMismatch'), 'error');
                return;
            }
            try {
                await handleRegister(email, password);
                showToast(t('auth.registerSuccess'), 'success');
                closeMemberModal();
            } catch (err) {
                showMemberMessage(err.message || t('auth.registerFailed'), 'error');
            }
        });
    }

    // Reset password form
    const resetForm = query('#member-reset-form');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = query('#member-reset-form input[name="email"]').value;
            try {
                const { resetPassword } = await import('./api/auth.js');
                await resetPassword(email);
                showMemberMessage('如果這個 Email 存在，會收到密碼重設連結', 'success');
                setTimeout(() => {
                    switchMemberView('login');
                }, 2000);
            } catch (err) {
                showMemberMessage(err.message || '傳送失敗', 'error');
            }
        });
    }

    // Logout
    queryAll('[data-account-logout], [data-member-logout]').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await handleLogout();
                showToast(t('auth.logoutSuccess'), 'success');
                closeMemberModal();
                const accountMenu = query('[data-account-menu]');
                if (accountMenu) accountMenu.hidden = true;
            } catch (err) {
                showToast(t('errors.deleteFailed') || '登出失敗', 'error');
            }
        });
    });

    // Password toggle
    queryAll('[data-password-toggle]', modal).forEach(btn => {
        btn.addEventListener('click', () => {
            const wrapper = btn.closest('[data-password-field]');
            const input = wrapper?.querySelector('input');
            if (input) {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                btn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
            }
        });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            closeMemberModal();
        }
    });
}

/* ── Image Modal ── */
let imageModalCurrentIndex = 0;
let imageModalImages = [];

function initImageModal() {
    const modal = query('#image-modal');
    if (!modal) return;

    const backdrop = modal.querySelector('.image-modal-backdrop');
    const closeBtn = modal.querySelector('.image-modal-close');
    const prevBtn = modal.querySelector('.image-modal-prev');
    const nextBtn = modal.querySelector('.image-modal-next');

    backdrop?.addEventListener('click', closeImageModal);
    closeBtn?.addEventListener('click', closeImageModal);
    prevBtn?.addEventListener('click', () => navigateImage(-1));
    nextBtn?.addEventListener('click', () => navigateImage(1));

    document.addEventListener('keydown', (e) => {
        if (modal.getAttribute('aria-hidden') === 'true') return;
        if (e.key === 'Escape') closeImageModal();
        if (e.key === 'ArrowLeft') navigateImage(-1);
        if (e.key === 'ArrowRight') navigateImage(1);
    });
}

function openImageModal(images, startIndex = 0) {
    const modal = query('#image-modal');
    if (!modal || !images || images.length === 0) return;

    imageModalImages = images;
    imageModalCurrentIndex = startIndex;

    modal.setAttribute('aria-hidden', 'false');
    updateImageModalContent();
}

function closeImageModal() {
    const modal = query('#image-modal');
    if (modal) {
        modal.setAttribute('aria-hidden', 'true');
    }
}

function navigateImage(direction) {
    imageModalCurrentIndex += direction;
    if (imageModalCurrentIndex < 0) {
        imageModalCurrentIndex = imageModalImages.length - 1;
    } else if (imageModalCurrentIndex >= imageModalImages.length) {
        imageModalCurrentIndex = 0;
    }
    updateImageModalContent();
}

function updateImageModalContent() {
    const modal = query('#image-modal');
    if (!modal) return;

    const img = modal.querySelector('.image-modal-image');
    const counter = modal.querySelector('.image-modal-counter');

    if (img && imageModalImages[imageModalCurrentIndex]) {
        const imgData = imageModalImages[imageModalCurrentIndex];
        img.src = imgData.url || imgData;
    }

    if (counter) {
        counter.textContent = `${imageModalCurrentIndex + 1} / ${imageModalImages.length}`;
    }
}

function openMemberModal() {
    const modal = query('#member-modal');
    if (modal) {
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('is-open');
        switchMemberView('login');
    }
}

function closeMemberModal() {
    const modal = query('#member-modal');
    if (modal) {
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('is-open');
        hideMemberMessage();
    }
}

function switchMemberView(view) {
    const modal = query('#member-modal');
    if (!modal) return;

    queryAll('[data-member-view]', modal).forEach(section => {
        section.hidden = section.dataset.memberView !== view;
    });

    queryAll('[data-member-tab]', modal).forEach(tab => {
        const isActive = tab.dataset.memberTab === view;
        tab.classList.toggle('is-active', isActive);
    });

    hideMemberMessage();
}

function showMemberMessage(text, type = 'error') {
    const el = query('[data-member-message]');
    if (el) {
        el.textContent = text;
        el.className = `member-message member-message-${type}`;
        el.hidden = false;
    }
}

function hideMemberMessage() {
    const el = query('[data-member-message]');
    if (el) {
        el.hidden = true;
        el.textContent = '';
    }
}

/* ── Auth State ── */
function handleAuthChange(user) {
    updateMemberUI(user);
    if (user) {
        syncFromServer();
    }
    renderListings();
}

function updateMemberUI(user) {
    const memberButton = query('[data-member-trigger]');
    if (memberButton) {
        memberButton.textContent = user ? `${t('auth.loginSuccess')}，${user.display_name || user.email}` : t('auth.loginRegister');
        memberButton.dataset.memberState = user ? 'signed-in' : 'signed-out';
    }
    // Show/hide logout button in modal
    const logoutBtn = query('[data-member-logout]');
    if (logoutBtn) logoutBtn.hidden = !user;
}

/* ── Data Loading ── */
async function loadInitialData() {
    await loadListingsView();
}

async function loadListingsView(params = {}) {
    try {
        const filters = getFilters();
        const pagination = getPagination();
        const queryParams = {
            ...buildQueryParams(),
            page: pagination.currentPage,
            per_page: 20,
            ...params
        };
        if (activeCategory && activeCategory !== 'all' && activeCategory !== 'my-listings' && activeCategory !== 'favorites' && activeCategory !== 'messages') {
            queryParams.category = activeCategory;
        }

        const data = await loadListings(queryParams);
        // client.js auto-unwraps Flask's { success, data } wrapper
        listings = data.listings || [];
        const paginationData = data.pagination || {};
        const totalItems = paginationData.total || 0;
        setPagination(pagination.currentPage, totalItems);
        renderListings();
        updatePaginationUI();
    } catch (error) {
        console.error('Load listings error:', error);
        showToast(t('errors.loadFailed'), 'error');
    }
}

/* ── Pagination UI ── */
function updatePaginationUI() {
    const paginationEl = query('#listing-pagination');
    if (!paginationEl) return;

    const { currentPage, totalPages, totalItems } = getPagination();
    if (totalItems <= 20) {
        paginationEl.hidden = true;
        return;
    }

    paginationEl.hidden = false;
    const infoEl = query('[data-pagination-info]', paginationEl);
    const pageEl = query('[data-pagination-page]', paginationEl);
    const prevBtn = query('[data-pagination-prev]', paginationEl);
    const nextBtn = query('[data-pagination-next]', paginationEl);

    const start = (currentPage - 1) * 20 + 1;
    const end = Math.min(currentPage * 20, totalItems);
    if (infoEl) infoEl.textContent = `${t('pagination.showing').replace('{start}', start).replace('{end}', end).replace('{total}', totalItems)}`;
    if (pageEl) pageEl.textContent = t('pagination.page').replace('{current}', currentPage).replace('{total}', totalPages);
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

/* ── Rendering ── */
function renderListings() {
    const container = query('#listings-container');
    if (!container) return;

    removeChildren(container);

    if (listings.length === 0) {
        container.appendChild(createElement('div', { className: 'empty-state', textContent: t('empty.noListings') }));
        return;
    }

    listings.forEach(listing => {
        container.appendChild(createListingCard(listing));
    });
}

function createListingCard(listing) {
    const card = createElement('article', { className: 'listing-card' });

    const images = listing.images || [];
    const background = getCategoryBackground(listing.category);
    const user = getCurrentUser();
    const isOwner = user && listing.owner_id === user.id;
    const isFav = !isOwner && isFavorite(listing.id);

    const imagesDataAttr = images.length > 1 ? ` data-gallery-trigger data-images='${btoa(JSON.stringify(images))}'` : '';

    const listingTypeLabel = getListingTypeLabel(listing.type);
    const deliveryLabel = getDeliveryMethodLabel(listing.delivery_method);

    card.innerHTML = `
        <div class="listing-card-media" style="background: ${background}">
            ${images.length > 0
            ? `<img src="${images[0].url || images[0]}" alt="${listing.title}" loading="lazy"${imagesDataAttr} />`
            : `<span class="listing-card-fallback">${(listing.category || listing.title || t('category.other')).charAt(0).toUpperCase()}</span>`}
            ${listing.status === 'sold' ? `<div class="listing-card-sold-badge">${t('listing.sold')}</div>` : ''}
        </div>
        <div class="listing-card-body">
            <div class="listing-card-title-row">
                <h3 class="listing-card-title">${listing.title || t('listingForm.titlePlaceholder')}</h3>
                ${isOwner ? `
                <div class="listing-card-owner-menu">
                    <button class="owner-menu-trigger" type="button" aria-label="${t('edit')}">⋯</button>
                    <div class="owner-menu" role="menu">
                        <button class="owner-menu-item listing-card-edit" type="button" role="menuitem">${t('edit')}</button>
                        <button class="owner-menu-item listing-card-sold" type="button" role="menuitem">${t('listingForm.markAsSold')}</button>
                        <button class="owner-menu-item listing-card-delete" type="button" role="menuitem">${t('delete')}</button>
                    </div>
                </div>` : `
                <button class="listing-card-favorite${isFav ? ' is-active' : ''}" type="button" aria-pressed="${isFav}" aria-label="${isFav ? t('favorites.removed') : t('favorites.added')}"></button>`}
            </div>
            <p class="listing-card-meta">
                ${listingTypeLabel ? `<span>${listingTypeLabel}</span>` : ''}
                ${listing.category ? `<span>${listing.category}</span>` : ''}
                ${listing.quantity ? `<span>${t('listingForm.quantity')} ${listing.quantity}</span>` : ''}
                ${deliveryLabel ? `<span>${deliveryLabel}</span>` : ''}
                ${listing.location ? `<span>${listing.location}</span>` : ''}
            </p>
            <p class="listing-card-description">${listing.description || t('listingCard.noDescription')}</p>
            ${listing.created_at ? `<p class="listing-card-published">${t('listingCard.published')}${formatDateTimeValue(listing.created_at)}</p>` : ''}
        </div>
        <div class="listing-card-footer">
            <div class="listing-card-price">
                <span class="price-label">${t('listingCard.priceLabel')}</span>
                <strong class="price-value">${listing.buy_now ? `NT$ ${Number(listing.buy_now).toLocaleString()}` : listing.face_value ? `${t('detail.faceValue')} NT$ ${Number(listing.face_value).toLocaleString()}` : t('listingCard.priceNegotiable')}</strong>
            </div>
            <button class="listing-card-action" data-listing-id="${listing.id}">${t('listingCard.viewDetails')}</button>
        </div>
    `;

    // Click card to navigate
    card.addEventListener('click', (e) => {
        if (!e.target.matches('button') && !e.target.closest('button')) {
            window.location.href = `/detail?id=${listing.id}`;
        }
    });

    const actionBtn = card.querySelector('.listing-card-action');
    actionBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `/detail?id=${listing.id}`;
    });

    // Favorite button handler
    const favBtn = card.querySelector('.listing-card-favorite');
    if (favBtn) {
        favBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!requireAuth(t('authPrompts.toFavorite'))) {
                openMemberModal();
                return;
            }
            try {
                const added = await toggleFavoriteLocal(listing.id);
                favBtn.classList.toggle('is-active', added);
                favBtn.setAttribute('aria-pressed', added);
                showToast(added ? t('favorites.added') : t('favorites.removed'), 'success');
            } catch (err) {
                showToast(t('favorites.addFailed'), 'error');
            }
        });
    }

    // Gallery trigger for multi-image cards
    const galleryTrigger = card.querySelector('[data-gallery-trigger]');
    if (galleryTrigger && images.length > 1) {
        galleryTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const storedImages = galleryTrigger.dataset.images;
            if (storedImages) {
                try {
                    const imgs = JSON.parse(atob(storedImages));
                    openImageModal(imgs, 0);
                } catch (err) {
                    window.location.href = `/detail?id=${listing.id}`;
                }
            }
        });
    }

    // Owner actions
    if (isOwner) {
        const editBtn = card.querySelector('.listing-card-edit');
        const deleteBtn = card.querySelector('.listing-card-delete');
        const menuTrigger = card.querySelector('.owner-menu-trigger');
        const menu = card.querySelector('.owner-menu');

        menuTrigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('is-open');
        });

        editBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            editingListingId = listing.id;
            fillEditForm(listing);
        });

        deleteBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(t('listingForm.deleteConfirm'))) {
                try {
                    await deleteListing(listing.id);
                    showToast(t('listingForm.deleted'), 'success');
                    await loadListingsView();
                } catch (err) {
                    showToast(t('errors.deleteFailed'), 'error');
                }
            }
        });

        const soldBtn = card.querySelector('.listing-card-sold');
        soldBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const newStatus = listing.status === 'sold' ? 'active' : 'sold';
            const confirmMsg = newStatus === 'sold' ? t('listingForm.markAsSoldConfirm') : t('listingForm.reopenConfirm');
            if (confirm(confirmMsg)) {
                try {
                    await updateListingStatus(listing.id, newStatus);
                    showToast(t('listingForm.statusUpdated'), 'success');
                    await loadListingsView();
                } catch (err) {
                    showToast(t('errors.updateFailed'), 'error');
                }
            }
        });
    }

    return card;
}

function fillEditForm(listing) {
    const formPanel = query('#listing-form-panel');
    if (formPanel) {
        show(formPanel);
        formPanel.scrollIntoView({ behavior: 'smooth' });
    }

    const form = query('#listing-form');
    if (!form) return;

    const fields = {
        'title': listing.title,
        'type': listing.type,
        'category': listing.category,
        'quantity': listing.quantity,
        'buy_now': listing.buy_now,
        'delivery_method': listing.delivery_method,
        'urgency': listing.urgency,
        'location': listing.location,
        'swap_preferences': listing.swap_preferences,
        'description': listing.description
    };

    for (const [name, value] of Object.entries(fields)) {
        const input = form.querySelector(`[name="${name}"]`);
        if (input && value != null) input.value = value;
    }

    const cancelBtn = query('#listing-cancel-edit');
    if (cancelBtn) {
        cancelBtn.hidden = false;
        cancelBtn.onclick = () => {
            editingListingId = null;
            form.reset();
            cancelBtn.hidden = true;
            hide(formPanel);
        };
    }
}

/* ── Event Binding ── */
function bindEvents() {
    const listingForm = query('#listing-form');
    if (listingForm) {
        listingForm.addEventListener('submit', handleFormSubmit);
    }

    // Filters
    const filterType = query('#filter-type');
    if (filterType) {
        filterType.addEventListener('change', () => {
            setFilter('type', filterType.value);
            resetPage();
            loadListingsView();
        });
    }

    const filterDelivery = query('#filter-delivery');
    if (filterDelivery) {
        filterDelivery.addEventListener('change', () => {
            setFilter('delivery', filterDelivery.value);
            resetPage();
            loadListingsView();
        });
    }

    const filterSearch = query('#filter-search');
    if (filterSearch) {
        let searchTimeout;
        filterSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                setFilter('search', filterSearch.value);
                resetPage();
                loadListingsView();
            }, 400);
        });
    }

    const filterClear = query('#filter-clear');
    if (filterClear) {
        filterClear.addEventListener('click', () => {
            resetFilters();
            resetPage();
            // Reset UI
            const filterInputs = queryAll('.filters select, .filters input');
            filterInputs.forEach(el => {
                if (el.tagName === 'SELECT') el.selectedIndex = 0;
                else el.value = '';
            });
            loadListingsView();
        });
    }

    // Range Filters
    const filterQuantityMin = query('#filter-quantity-min');
    if (filterQuantityMin) {
        filterQuantityMin.addEventListener('input', () => {
            setFilter('quantityMin', filterQuantityMin.value ? parseInt(filterQuantityMin.value, 10) : null);
            resetPage();
            loadListingsView();
        });
    }

    const filterCreatedStart = query('#filter-created-start');
    const filterCreatedEnd = query('#filter-created-end');
    if (filterCreatedStart) {
        filterCreatedStart.addEventListener('change', () => {
            setFilter('createdStart', filterCreatedStart.value);
            resetPage();
            loadListingsView();
        });
    }
    if (filterCreatedEnd) {
        filterCreatedEnd.addEventListener('change', () => {
            setFilter('createdEnd', filterCreatedEnd.value);
            resetPage();
            loadListingsView();
        });
    }

    const filterExpiresStart = query('#filter-expires-start');
    const filterExpiresEnd = query('#filter-expires-end');
    if (filterExpiresStart) {
        filterExpiresStart.addEventListener('change', () => {
            setFilter('expiresStart', filterExpiresStart.value);
            resetPage();
            loadListingsView();
        });
    }
    if (filterExpiresEnd) {
        filterExpiresEnd.addEventListener('change', () => {
            setFilter('expiresEnd', filterExpiresEnd.value);
            resetPage();
            loadListingsView();
        });
    }

    // Sidebar navigation
    const sidebarButtons = queryAll('.sidebar-nav button[data-category]');
    sidebarButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            activeCategory = btn.dataset.category;

            // Update active state
            sidebarButtons.forEach(b => {
                b.classList.remove('is-active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('is-active');
            btn.setAttribute('aria-pressed', 'true');

            // Update panel title
            const panelTitle = query('#category-panel-title');
            if (panelTitle) panelTitle.textContent = btn.querySelector('span:last-child')?.textContent || t('category.all');

            // Handle special views
            const categoryPanel = query('#category-panel');
            const formPanel = query('#listing-form-panel');
            const messagesPanel = query('#messages-panel');

            if (activeCategory === 'messages') {
                hide(categoryPanel);
                hide(formPanel);
                show(messagesPanel);
                loadMessagesView();
                return;
            }

            show(categoryPanel);
            hide(messagesPanel);

            if (activeCategory === 'my-listings') {
                resetFilters();
                resetPage();
                loadMyListingsView();
                return;
            }

            if (activeCategory === 'favorites') {
                resetFilters();
                resetPage();
                loadFavoritesView();
                return;
            }

            resetPage();
            setFilter('category', activeCategory);
            loadListingsView();
        });
    });

    // Sidebar "建立刊登" button
    const createBtn = query('[data-scroll-target="#listing-form-panel"]');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            if (!requireAuth(t('authPrompts.toPublish'))) {
                openMemberModal();
                return;
            }
            const formPanel = query('#listing-form-panel');
            if (formPanel) {
                show(formPanel);
                formPanel.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Pagination
    const prevBtn = query('[data-pagination-prev]');
    const nextBtn = query('[data-pagination-next]');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const page = prevPage();
            if (page) loadListingsView();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const page = nextPage();
            if (page) loadListingsView();
        });
    }
}

/* ── My Listings View ── */
async function loadMyListingsView() {
    if (!requireAuth(t('authPrompts.toViewMyListings'))) {
        openMemberModal();
        return;
    }
    try {
        const data = await loadMyListings();
        listings = Array.isArray(data) ? data : [];
        renderListings();
    } catch (error) {
        showToast(t('errors.loadFailed'), 'error');
    }
}

/* ── Favorites View ── */
async function loadFavoritesView() {
    if (!requireAuth(t('authPrompts.toViewFavorites'))) {
        openMemberModal();
        return;
    }
    try {
        await syncFromServer();
        // Re-fetch listings and filter by favorites
        const data = await loadListings({ per_page: 100 });
        const allListings = data.listings || [];
        listings = allListings.filter(l => isFavorite(l.id));
        renderListings();
    } catch (error) {
        showToast(t('errors.loadFailed'), 'error');
    }
}

/* ── Messages View ── */
async function loadMessagesView() {
    if (!requireAuth(t('authPrompts.toViewMessages'))) {
        openMemberModal();
        return;
    }
    const container = query('#messages-container');
    if (!container) return;

    try {
        const { loadMessages } = await import('./modules/messages.js');
        const messages = await loadMessages();
        removeChildren(container);

        if (messages.length === 0) {
            container.appendChild(createElement('div', { className: 'empty-state', textContent: t('empty.noMessages') }));
            return;
        }

        messages.forEach(msg => {
            const card = createElement('div', { className: 'message-item' });
            const listingInfo = msg.listing ? `<a href="/detail?id=${msg.listing.id}" class="message-listing-link">${msg.listing.title}</a>` : '';
            card.innerHTML = `
                <div class="message-header">
                    <span class="message-sender">${msg.sender_contact || 'Anonymous'}</span>
                    <span class="message-time">${formatDateTimeValue(msg.created_at)}</span>
                </div>
                ${listingInfo ? `<div class="message-listing">${listingInfo}</div>` : ''}
                <p class="message-body">${msg.message}</p>
                <button class="message-reply-btn" type="button">${t('messages.reply')}</button>
            `;
            card.addEventListener('click', (e) => {
                // Don't open chat if clicking on links or reply button
                if (e.target.closest('a') || e.target.matches('.message-reply-btn') || e.target.closest('.message-reply-btn')) {
                    return;
                }
                import('./modules/chat.js').then(({ openChat }) => {
                    openChat(msg);
                });
            });
        container.appendChild(card);
    });
    } catch (error) {
        showToast(t('errors.loadFailed'), 'error');
    }
}

/* ── Form Submit ── */
async function handleFormSubmit(e) {
    e.preventDefault();

    if (!requireAuth(t('authPrompts.toPublish'))) {
        openMemberModal();
        return;
    }

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Combine date + time → expires_at
    if (data.expires_date) {
        const time = data.expires_time || '23:59';
        data.expires_at = `${data.expires_date}T${time}:00`;
    }
    delete data.expires_date;
    delete data.expires_time;

    // Clean up empty fields
    Object.keys(data).forEach(key => {
        if (data[key] === '' || data[key] === undefined) delete data[key];
    });

    // Parse numbers
    if (data.quantity) data.quantity = parseInt(data.quantity, 10);
    if (data.buy_now) data.buy_now = parseFloat(data.buy_now);

    // Handle image uploads
    const imageInput = e.target.querySelector('input[name="listing-images"]');
    if (imageInput && imageInput.files && imageInput.files.length > 0) {
        const maxImages = 6;
        const files = Array.from(imageInput.files).slice(0, maxImages);
        const uploadedImages = [];

        for (const file of files) {
            try {
                const result = await uploadImage(file);
                uploadedImages.push({ url: result.url, filename: result.filename });
            } catch (err) {
                console.error('Image upload failed:', err);
            }
        }

        if (uploadedImages.length > 0) {
            data.images = uploadedImages;
        }
    }

    try {
        if (editingListingId) {
            await updateListing(editingListingId, data);
            showToast(t('listingForm.updated'), 'success');
        } else {
            await createListing(data);
            showToast(t('listingForm.created'), 'success');
        }
        e.target.reset();
        editingListingId = null;
        const cancelBtn = query('#listing-cancel-edit');
        if (cancelBtn) cancelBtn.hidden = true;
        const formPanel = query('#listing-form-panel');
        if (formPanel) hide(formPanel);
        await loadListingsView();
    } catch (error) {
        showToast(error.message || t('errors.saveFailed'), 'error');
    }
}