import { getListing } from './api/listings.js';
import { createInquiry } from './api/inquiries.js';
import { showToast, query } from './utils/dom.js';
import { formatDateValue } from './utils/date.js';
import { getCurrentUser } from './api/auth.js';
import { initI18n, getLocale, setLocale, t, updateStaticContent } from './i18n/index.js';

const TYPE_LABELS = { auction: '出售', transfer: '讓票', swap: '交換', request: '求票' };
const DELIVERY_METHODS = { meetup: '面交', shipping: '寄件' };
const TYPE_LABELS_EN = { auction: 'For Sale', transfer: 'Transfer', swap: 'Swap', request: 'Request' };
const DELIVERY_METHODS_EN = { meetup: 'Meetup', shipping: 'Shipping' };

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
        if (!modal || modal.getAttribute('aria-hidden') === 'true') return;
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

function getTypeLabel(type) {
    const locale = getLocale();
    if (locale.startsWith('zh')) {
        return TYPE_LABELS[type] || type || '—';
    }
    return TYPE_LABELS_EN[type] || type || '—';
}

function getDeliveryLabel(method) {
    const locale = getLocale();
    if (locale.startsWith('zh')) {
        return DELIVERY_METHODS[method] || method || '—';
    }
    return DELIVERY_METHODS_EN[method] || method || '—';
}

document.addEventListener('DOMContentLoaded', async () => {
    initI18n();
    updateStaticContent();
    initThemeToggle();
    initLangToggle();
    initImageModal();

    const params = new URLSearchParams(window.location.search);
    const listingId = params.get('id');

    if (!listingId) {
        showToast(t('errors.loadFailed'), 'error');
        return;
    }

    await loadListing(listingId);
    bindInquiryForm();
});

function initThemeToggle() {
    const toggle = query('#theme-toggle');
    if (!toggle) return;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);

    toggle.addEventListener('click', () => {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

let currentListing = null;

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
        if (currentListing) renderListing(currentListing);
        updateLabel();
    });
}

async function loadListing(id) {
    try {
        const data = await getListing(id);
        currentListing = data.listing || data;
        renderListing(currentListing);
    } catch (error) {
        showToast(t('errors.loadFailed'), 'error');
    }
}

function renderListing(listing) {
    const root = query('[data-detail-root]');
    if (!root) return;

    const titleEl = root.querySelector('[data-title]');
    const descriptionEl = root.querySelector('[data-description]');
    const typeEl = root.querySelector('[data-type]');
    const categoryEl = root.querySelector('[data-category]');
    const quantityEl = root.querySelector('[data-quantity]');
    const deliveryEl = root.querySelector('[data-delivery]');
    const locationEl = root.querySelector('[data-location]');
    const expiresEl = root.querySelector('[data-expires]');
    const priceEl = root.querySelector('[data-price]');
    const contactEl = root.querySelector('[data-contact]');
    const tagsEl = root.querySelector('[data-tags]');
    const ownerEl = root.querySelector('[data-owner]');
    const createdEl = root.querySelector('[data-created]');
    const imagesEl = root.querySelector('[data-images]');

    if (titleEl) titleEl.textContent = listing.title || t('listingForm.titlePlaceholder');
    if (descriptionEl) descriptionEl.textContent = listing.description || t('detail.noDescription');
    if (typeEl) typeEl.textContent = getTypeLabel(listing.type);
    if (categoryEl) categoryEl.textContent = listing.category || '—';
    if (quantityEl) quantityEl.textContent = listing.quantity || '—';
    if (deliveryEl) deliveryEl.textContent = getDeliveryLabel(listing.delivery_method);
    if (locationEl) locationEl.textContent = listing.location || '—';
    if (expiresEl) expiresEl.textContent = listing.expires_at ? formatDateValue(listing.expires_at) : '—';

    if (priceEl) {
        if (listing.buy_now) {
            priceEl.textContent = `NT$ ${Number(listing.buy_now).toLocaleString()}`;
        } else if (listing.face_value) {
            priceEl.textContent = `${t('detail.faceValue')} NT$ ${Number(listing.face_value).toLocaleString()}`;
        } else {
            priceEl.textContent = t('listingCard.priceNegotiable');
        }
    }

    if (contactEl && listing.owner) {
        contactEl.textContent = listing.owner.email || '—';
    }

    if (ownerEl && listing.owner) {
        ownerEl.textContent = listing.owner.display_name || listing.owner.email || '—';
    }

    if (createdEl && listing.created_at) {
        createdEl.textContent = formatDateValue(listing.created_at);
    }

    const faceValueEl = root.querySelector('[data-face-value]');
    if (faceValueEl && listing.face_value) {
        faceValueEl.textContent = `NT$ ${Number(listing.face_value).toLocaleString()}`;
    }

    if (imagesEl) {
        imagesEl.innerHTML = '';
        const images = listing.images || [];
        if (images.length > 0) {
            images.forEach((img, index) => {
                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'detail-image-wrapper';

                const imgEl = document.createElement('img');
                imgEl.src = img.url || img;
                imgEl.alt = `${listing.title} image ${index + 1}`;
                imgEl.loading = 'lazy';
                if (index === 0) imgEl.className = 'detail-image-main';
                imgEl.style.cursor = 'pointer';
                imgEl.addEventListener('click', () => openImageModal(images, index));

                imgWrapper.appendChild(imgEl);
                imagesEl.appendChild(imgWrapper);
            });
        }
    }

    if (tagsEl) {
        tagsEl.innerHTML = '';
        if (listing.type) {
            const tag = document.createElement('span');
            tag.className = 'detail-tag';
            tag.textContent = getTypeLabel(listing.type);
            tagsEl.appendChild(tag);
        }
        if (listing.urgency === 'urgent') {
            const urgentTag = document.createElement('span');
            urgentTag.className = 'detail-tag detail-tag-urgent';
            urgentTag.textContent = t('listingForm.urgencyUrgent');
            tagsEl.appendChild(urgentTag);
        }
    }

    // Update page title
    document.title = `${listing.title || t('detail.listingTitle')} - TikSwap`;
}

function bindInquiryForm() {
    const inquiryForm = query('#inquiry-form');
    if (!inquiryForm) return;

    inquiryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const params = new URLSearchParams(window.location.search);
        const listingId = params.get('id');
        const message = inquiryForm.querySelector('textarea[name="message"]')?.value;

        if (!message) {
            showToast(t('detail.messagePlaceholder') || '請輸入訊息', 'error');
            return;
        }

        const user = getCurrentUser();
        const senderContact = user?.email || 'Guest';

        try {
            await createInquiry(listingId, message, senderContact);
            showToast(t('messages.sent'), 'success');
            inquiryForm.reset();
        } catch (error) {
            showToast(t('errors.sendFailed'), 'error');
        }
    });
}