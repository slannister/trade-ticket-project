import { formatDateTimeValue } from '../utils/date.js';
import { query, createElement, removeChildren } from '../utils/dom.js';
import { showToast } from '../utils/toast.js';
import { getLocale, t } from '../i18n/index.js';

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

export function getCategoryBackground(category) {
    return CATEGORY_BACKGROUNDS[category] || 'linear-gradient(140deg, rgba(91, 140, 255, 0.24), rgba(127, 91, 255, 0.18))';
}

export function getListingTypeLabel(type) {
    const locale = getLocale();
    if (locale.startsWith('zh')) {
        return LISTING_TYPES[type] || type || '';
    }
    return LISTING_TYPES_EN[type] || type || '';
}

export function getDeliveryMethodLabel(method) {
    const locale = getLocale();
    if (locale.startsWith('zh')) {
        return DELIVERY_METHODS[method] || method || '';
    }
    return DELIVERY_METHODS_EN[method] || method || '';
}

export function renderListingGrid(listings, {
    getCurrentUser,
    isFavorite,
    onEdit,
    onDelete,
    onSold,
    onFavorite,
    onImageClick
} = {}) {
    const container = query('#listings-container');
    if (!container) return;

    removeChildren(container);

    if (listings.length === 0) {
        container.appendChild(createElement('div', { className: 'empty-state', textContent: t('empty.noListings') }));
        return;
    }

    listings.forEach(listing => {
        const card = createListingCard(listing, {
            getCurrentUser,
            isFavorite,
            onEdit,
            onDelete,
            onSold,
            onFavorite,
            onImageClick
        });
        container.appendChild(card);
    });
}

export function createListingCard(listing, {
    getCurrentUser,
    isFavorite,
    onEdit,
    onDelete,
    onSold,
    onFavorite,
    onImageClick
} = {}) {
    const user = getCurrentUser?.();
    const isOwner = user && listing.owner_id === user.id;
    const fav = isFavorite?.(listing.id) ?? false;

    const images = listing.images || [];
    const background = getCategoryBackground(listing.category);
    const listingTypeLabel = getListingTypeLabel(listing.type);
    const deliveryLabel = getDeliveryMethodLabel(listing.delivery_method);

    const imagesDataAttr = images.length > 1 ? ` data-gallery-trigger data-images='${btoa(JSON.stringify(images))}'` : '';

    const card = createElement('article', { className: 'listing-card' });
    card.innerHTML = `
        <div class="listing-card-media" style="background: ${background}">
            ${images.length > 0
            ? `<img src="${images[0].url || images[0]}" alt="${listing.title}" loading="lazy"${imagesDataAttr} />`
            : `<span class="listing-card-fallback">${(listing.category || listing.title || t('category.other')).charAt(0).toUpperCase()}</span>`}
            ${listing.status === 'sold' ? `<div class="listing-card-sold-badge">${t('listingCard.sold')}</div>` : ''}
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
                <button class="listing-card-favorite${fav ? ' is-active' : ''}" type="button" aria-pressed="${fav}" aria-label="${fav ? t('favorites.removed') : t('favorites.added')}"></button>`}
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
        </div>
    `;

    // Click card to navigate
    card.addEventListener('click', (e) => {
        if (!e.target.matches('button') && !e.target.closest('button')) {
            window.location.href = `/detail?id=${listing.id}`;
        }
    });

    // Favorite button handler
    const favBtn = card.querySelector('.listing-card-favorite');
    if (favBtn && onFavorite) {
        favBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await onFavorite(listing, favBtn);
        });
    }

    // Gallery trigger for multi-image cards
    const galleryTrigger = card.querySelector('[data-gallery-trigger]');
    if (galleryTrigger && images.length > 1 && onImageClick) {
        galleryTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            onImageClick(images, 0);
        });
    }

    // Owner actions
    if (isOwner) {
        const menuTrigger = card.querySelector('.owner-menu-trigger');
        const menu = card.querySelector('.owner-menu');
        menuTrigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('is-open');
        });

        const editBtn = card.querySelector('.listing-card-edit');
        editBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (onEdit) onEdit(listing);
        });

        const deleteBtn = card.querySelector('.listing-card-delete');
        deleteBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (onDelete) await onDelete(listing);
        });

        const soldBtn = card.querySelector('.listing-card-sold');
        soldBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (onSold) await onSold(listing);
        });
    }

    return card;
}