import { init as initAuth, handleLogin, handleRegister, handleLogout, getCurrentUser, requireAuth } from './modules/auth.js';
import { loadListings, loadMyListings, createListing, updateListing, deleteListing } from './modules/listings.js';
import { init as initFavorites, isFavorite, toggle as toggleFavoriteLocal, syncFromServer, addFavorite, removeFavorite } from './modules/favorites.js';
import { getFilters, setFilter, resetFilters, buildQueryParams } from './modules/filters.js';
import { getPagination, setPagination, nextPage, prevPage, resetPage } from './modules/pagination.js';
import { showToast, query, queryAll, createElement, removeChildren, show, hide } from './utils/dom.js';
import { formatDateValue, formatDateTimeValue } from './utils/date.js';

const LISTING_TYPES = { auction: '出售', transfer: '讓票', swap: '交換', request: '求票' };
const DELIVERY_METHODS = { meetup: '面交', shipping: '寄件' };
const CATEGORY_BACKGROUNDS = {
    '演唱會': 'linear-gradient(140deg, rgba(224, 114, 255, 0.4), rgba(118, 86, 255, 0.35))',
    '體育賽事': 'linear-gradient(140deg, rgba(91, 200, 255, 0.35), rgba(76, 181, 163, 0.4))',
    '戲劇舞台': 'linear-gradient(140deg, rgba(255, 168, 91, 0.4), rgba(170, 99, 255, 0.35))',
    '綜藝活動': 'linear-gradient(140deg, rgba(255, 129, 179, 0.38), rgba(255, 182, 108, 0.38))',
    '展覽 / 市集': 'linear-gradient(140deg, rgba(99, 205, 255, 0.35), rgba(112, 255, 188, 0.35))',
    '收藏品 / 周邊': 'linear-gradient(140deg, rgba(164, 129, 255, 0.38), rgba(108, 218, 255, 0.32))',
    '其他': 'linear-gradient(140deg, rgba(140, 150, 170, 0.35), rgba(90, 99, 120, 0.35))'
};

function getCategoryBackground(category) {
    return CATEGORY_BACKGROUNDS[category] || 'linear-gradient(140deg, rgba(91, 140, 255, 0.24), rgba(127, 91, 255, 0.18))';
}

let listings = [];
let activeCategory = 'all';
let editingListingId = null;

document.addEventListener('DOMContentLoaded', async () => {
    initAuth(handleAuthChange);
    initFavorites();
    initThemeToggle();
    initMemberModal();
    bindEvents();
    await loadInitialData();
});

/* ── Theme Toggle ── */
function initThemeToggle() {
    const toggle = query('#theme-toggle');
    if (!toggle) return;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    toggle.setAttribute('aria-label', savedTheme === 'dark' ? '切換為亮色模式' : '切換為暗色模式');

    toggle.addEventListener('click', () => {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        toggle.setAttribute('aria-label', next === 'dark' ? '切換為亮色模式' : '切換為暗色模式');
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
                // If already logged in, show account menu or logout
                const accountMenu = query('[data-account-menu]');
                if (accountMenu) {
                    accountMenu.hidden = !accountMenu.hidden;
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
                showToast('登入成功！', 'success');
                closeMemberModal();
            } catch (err) {
                showMemberMessage(err.message || '登入失敗', 'error');
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
                showMemberMessage('兩次輸入的密碼不一致', 'error');
                return;
            }
            try {
                await handleRegister(email, password);
                showToast('註冊成功！', 'success');
                closeMemberModal();
            } catch (err) {
                showMemberMessage(err.message || '註冊失敗', 'error');
            }
        });
    }

    // Logout
    queryAll('[data-account-logout], [data-member-logout]').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await handleLogout();
                showToast('已登出', 'success');
                closeMemberModal();
                const accountMenu = query('[data-account-menu]');
                if (accountMenu) accountMenu.hidden = true;
            } catch (err) {
                showToast('登出失敗', 'error');
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
        if (e.key === 'Escape' && !modal.getAttribute('aria-hidden') !== 'true') {
            closeMemberModal();
        }
    });
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
        memberButton.textContent = user ? `Hi，${user.display_name || user.email}` : '登入 / 註冊';
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
        setPagination(pagination.currentPage, paginationData.total || listings.length);
        renderListings();
        updatePaginationUI();
    } catch (error) {
        console.error('Load listings error:', error);
        showToast('載入失敗，請稍後再試', 'error');
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
    if (infoEl) infoEl.textContent = `第 ${start}-${end} 筆，共 ${totalItems} 筆`;
    if (pageEl) pageEl.textContent = `第 ${currentPage} / ${totalPages} 頁`;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

/* ── Rendering ── */
function renderListings() {
    const container = query('#listings-container');
    if (!container) return;

    removeChildren(container);

    if (listings.length === 0) {
        container.appendChild(createElement('div', { className: 'empty-state', textContent: '沒有找到符合條件的刊登。' }));
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

    card.innerHTML = `
        <div class="listing-card-media" style="background: ${background}">
            ${images.length > 0
            ? `<img src="${images[0].url || images[0]}" alt="${listing.title}" loading="lazy" />`
            : `<span class="listing-card-fallback">${(listing.category || listing.title || '票').charAt(0).toUpperCase()}</span>`}
        </div>
        <div class="listing-card-body">
            <div class="listing-card-title-row">
                <h3 class="listing-card-title">${listing.title || '未命名票券'}</h3>
                ${isOwner ? `
                <div class="listing-card-owner-menu">
                    <button class="owner-menu-trigger" type="button" aria-label="管理">⋯</button>
                    <div class="owner-menu" role="menu">
                        <button class="owner-menu-item listing-card-edit" type="button" role="menuitem">編輯</button>
                        <button class="owner-menu-item listing-card-delete" type="button" role="menuitem">刪除</button>
                    </div>
                </div>` : ''}
            </div>
            <p class="listing-card-meta">
                ${listing.type ? `<span>${LISTING_TYPES[listing.type] || listing.type}</span>` : ''}
                ${listing.category ? `<span>${listing.category}</span>` : ''}
                ${listing.quantity ? `<span>數量 ${listing.quantity}</span>` : ''}
                ${listing.delivery_method ? `<span>${DELIVERY_METHODS[listing.delivery_method] || listing.delivery_method}</span>` : ''}
                ${listing.location ? `<span>${listing.location}</span>` : ''}
            </p>
            <p class="listing-card-description">${listing.description || '暫無補充資訊。'}</p>
            ${listing.created_at ? `<p class="listing-card-published">發佈時間：${formatDateTimeValue(listing.created_at)}</p>` : ''}
        </div>
        <div class="listing-card-footer">
            <div class="listing-card-price">
                <span class="price-label">價格</span>
                <strong class="price-value">${listing.buy_now ? `NT$ ${Number(listing.buy_now).toLocaleString()}` : listing.face_value ? `原價 NT$ ${Number(listing.face_value).toLocaleString()}` : '面議'}</strong>
            </div>
            <button class="listing-card-action" data-listing-id="${listing.id}">查看詳情</button>
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
            if (confirm('確定要刪除此刊登嗎？')) {
                try {
                    await deleteListing(listing.id);
                    showToast('刊登已刪除', 'success');
                    await loadListingsView();
                } catch (err) {
                    showToast('刪除失敗', 'error');
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
            if (panelTitle) panelTitle.textContent = btn.querySelector('span:last-child')?.textContent || '全部票券';

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
                loadMyListingsView();
                return;
            }

            if (activeCategory === 'favorites') {
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
            if (!requireAuth('請先登入才能建立刊登')) {
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
    if (!requireAuth('請先登入以查看我的刊登')) {
        openMemberModal();
        return;
    }
    try {
        const data = await loadMyListings();
        listings = Array.isArray(data) ? data : [];
        renderListings();
    } catch (error) {
        showToast('載入失敗', 'error');
    }
}

/* ── Favorites View ── */
async function loadFavoritesView() {
    if (!requireAuth('請先登入以查看我的最愛')) {
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
        showToast('載入失敗', 'error');
    }
}

/* ── Messages View ── */
async function loadMessagesView() {
    if (!requireAuth('請先登入以查看訊息')) {
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
            container.appendChild(createElement('div', { className: 'empty-state', textContent: '目前沒有收到任何訊息。' }));
            return;
        }

        messages.forEach(msg => {
            const card = createElement('div', { className: 'message-card' });
            card.innerHTML = `
                <div class="message-header">
                    <span class="message-sender">${msg.sender_contact || '匿名'}</span>
                    <span class="message-date">${formatDateTimeValue(msg.created_at)}</span>
                </div>
                <p class="message-body">${msg.message}</p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        showToast('載入訊息失敗', 'error');
    }
}

/* ── Form Submit ── */
async function handleFormSubmit(e) {
    e.preventDefault();

    if (!requireAuth('請先登入才能發布刊登')) {
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

    try {
        if (editingListingId) {
            await updateListing(editingListingId, data);
            showToast('刊登已更新！', 'success');
        } else {
            await createListing(data);
            showToast('刊登已成功發布！', 'success');
        }
        e.target.reset();
        editingListingId = null;
        const cancelBtn = query('#listing-cancel-edit');
        if (cancelBtn) cancelBtn.hidden = true;
        const formPanel = query('#listing-form-panel');
        if (formPanel) hide(formPanel);
        await loadListingsView();
    } catch (error) {
        showToast(error.message || '儲存失敗，請稍後再試', 'error');
    }
}