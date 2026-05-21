import { query, queryAll, show, hide } from './utils/dom.js';
import { showToast } from './utils/toast.js';
import { getFilters, setFilter, resetFilters, buildQueryParams } from './modules/filters.js';
import { getPagination, setPagination, nextPage, prevPage, resetPage } from './modules/pagination.js';
import { loadListings, loadMyListings, createListing, updateListing, deleteListing, updateListingStatus } from './modules/listings.js';
import { init as initAuth, handleLogin, handleRegister, handleLogout, getCurrentUser, requireAuth } from './modules/auth.js';
import { init as initFavorites, isFavorite, toggle as toggleFavoriteLocal, syncFromServer } from './modules/favorites.js';
import { init as initChat } from './modules/chat.js';
import { initI18n, getLocale, setLocale, t, updateStaticContent } from './i18n/index.js';
import { renderListingGrid, createListingCard } from './modules/listingGrid.js';
import { bindFormEvents, collectFormData, fillForm, resetForm, showFormPanel, getEditingId, setEditingId } from './modules/formHandler.js';

let listings = [];
let activeCategory = sessionStorage.getItem('activeCategory') || 'all';

document.addEventListener('DOMContentLoaded', async () => {
    initI18n();
    updateStaticContent();
    initAuth(handleAuthChange);
    initFavorites();
    initChat(loadMessagesView);
    initThemeToggle();
    initLangToggle();
    initSidebarToggle();
    initMemberModal();
    initImageModal();
    bindEvents();
    bindFormEvents(handleFormSubmit, handleCancelEdit);
    await loadInitialData();
    restoreViewState();
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

function initSidebarToggle() {
    const toggle = query('#sidebar-toggle');
    const sidebar = query('.app-sidebar');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('is-collapsed');
        const isCollapsed = sidebar.classList.contains('is-collapsed');
        toggle.setAttribute('aria-label', isCollapsed ? t('sidebar.expand') : t('sidebar.collapse'));
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    });

    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === 'true') {
        sidebar.classList.add('is-collapsed');
    }
}

/* ── Member Modal ── */
function initMemberModal() {
    const modal = query('#member-modal');
    if (!modal) return;

    const triggers = queryAll('[data-member-trigger]');
    triggers.forEach(btn => {
        btn.addEventListener('click', () => {
            const user = getCurrentUser();
            if (user) {
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

    queryAll('[data-member-dismiss]').forEach(el => {
        el.addEventListener('click', () => closeMemberModal());
    });

    queryAll('[data-member-tab]', modal).forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.dataset.memberTab;
            switchMemberView(view);
        });
    });

    queryAll('[data-member-route]', modal).forEach(link => {
        link.addEventListener('click', () => {
            switchMemberView(link.dataset.memberRoute);
        });
    });

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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            closeMemberModal();
        }
    });
}

/* ── Restore View State ── */
function restoreViewState() {
    const savedCategory = sessionStorage.getItem('activeCategory');
    if (savedCategory && savedCategory !== 'all') {
        activeCategory = savedCategory;
        const sidebarButtons = queryAll('.sidebar-nav button[data-category]');
        sidebarButtons.forEach(btn => {
            btn.classList.remove('is-active');
            btn.setAttribute('aria-pressed', 'false');
            if (btn.dataset.category === savedCategory) {
                btn.classList.add('is-active');
                btn.setAttribute('aria-pressed', 'true');
            }
        });
        const panelTitle = query('#category-panel-title');
        if (panelTitle) {
            const btn = query(`.sidebar-nav button[data-category="${savedCategory}"]`);
            if (btn) panelTitle.textContent = btn.querySelector('span:last-child')?.textContent || t('category.all');
        }

        const categoryPanel = query('#category-panel');
        const formPanel = query('#listing-form-panel');
        const messagesPanel = query('#messages-panel');

        if (savedCategory === 'messages') {
            hide(categoryPanel);
            hide(formPanel);
            show(messagesPanel);
            loadMessagesView();
        } else if (savedCategory === 'my-listings') {
            hide(messagesPanel);
            show(categoryPanel);
            loadMyListingsView();
        } else if (savedCategory === 'favorites') {
            hide(messagesPanel);
            show(categoryPanel);
            loadFavoritesView();
        } else {
            hide(messagesPanel);
            show(categoryPanel);
            resetPage();
            loadListingsView();
        }
    }
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
    renderListingGrid(listings, {
        getCurrentUser,
        isFavorite,
        onEdit: handleEditListing,
        onDelete: handleDeleteListing,
        onSold: handleSoldListing,
        onFavorite: handleFavoriteListing,
        onImageClick: openImageModal
    });
}

/* ── Listing Actions ── */
function handleEditListing(listing) {
    setEditingId(listing.id);
    fillForm(listing);
    showFormPanel();
}

async function handleDeleteListing(listing) {
    if (confirm(t('listingForm.deleteConfirm'))) {
        try {
            await deleteListing(listing.id);
            showToast(t('listingForm.deleted'), 'success');
            await loadListingsView();
        } catch (err) {
            showToast(t('errors.deleteFailed'), 'error');
        }
    }
}

async function handleSoldListing(listing) {
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
}

async function handleFavoriteListing(listing, btn) {
    if (!requireAuth(t('authPrompts.toFavorite'))) {
        openMemberModal();
        return;
    }
    try {
        const added = await toggleFavoriteLocal(listing.id);
        if (btn) {
            btn.classList.toggle('is-active', added);
            btn.setAttribute('aria-pressed', added);
        }
        showToast(added ? t('favorites.added') : t('favorites.removed'), 'success');
    } catch (err) {
        showToast(t('favorites.addFailed'), 'error');
    }
}

function handleCancelEdit() {
    resetForm();
}

/* ── Form Submit ── */
async function handleFormSubmit(data, editingId) {
    if (!requireAuth(t('authPrompts.toPublish'))) {
        openMemberModal();
        return;
    }

    try {
        if (editingId) {
            await updateListing(editingId, data);
            showToast(t('listingForm.updated'), 'success');
        } else {
            await createListing(data);
            showToast(t('listingForm.created'), 'success');
        }
        resetForm();
        await loadListingsView();
    } catch (error) {
        showToast(error.message || t('errors.saveFailed'), 'error');
    }
}

/* ── Event Binding ── */
function bindEvents() {
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
            sessionStorage.setItem('activeCategory', activeCategory);

            sidebarButtons.forEach(b => {
                b.classList.remove('is-active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('is-active');
            btn.setAttribute('aria-pressed', 'true');

            const panelTitle = query('#category-panel-title');
            if (panelTitle) panelTitle.textContent = btn.querySelector('span:last-child')?.textContent || t('category.all');

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
            showFormPanel();
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
            const displayMessage = msg.latestMessage || msg.message;
            const displayTime = msg.latestTime || msg.created_at;
            const replyTag = msg.unreadReplyCount > 0 ? `<span class="message-reply-tag">+${msg.unreadReplyCount}則未讀</span>` : '';
            // Mark as unread if the message itself is unread OR if it has unread replies
            if (!msg.read || msg.unreadReplyCount > 0) card.classList.add('is-unread');
            card.innerHTML = `
                <div class="message-header">
                    <span class="message-sender">${msg.sender_contact || 'Anonymous'}</span>
                    <span class="message-time">${formatDateTimeValue(displayTime)}</span>
                </div>
                ${listingInfo ? `<div class="message-listing">${listingInfo}</div>` : ''}
                <p class="message-body">${displayMessage}</p>
                ${replyTag}
                <button class="message-reply-btn" type="button">${t('messages.reply')}</button>
            `;
            card.addEventListener('click', (e) => {
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

function removeChildren(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

function createElement(tag, props) {
    const el = document.createElement(tag);
    if (props.className) el.className = props.className;
    if (props.textContent) el.textContent = props.textContent;
    if (props.hidden !== undefined) el.hidden = props.hidden;
    return el;
}

function formatDateTimeValue(dateStr) {
    // Import from date.js if needed, simplified inline version
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString();
}