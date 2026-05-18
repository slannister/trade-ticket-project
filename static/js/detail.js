import { getListing } from './api/listings.js';
import { createInquiry } from './api/inquiries.js';
import { showToast, query } from './utils/dom.js';
import { formatDateValue } from './utils/date.js';
import { getCurrentUser } from './api/auth.js';

const TYPE_LABELS = { auction: '出售', transfer: '讓票', swap: '交換', request: '求票' };
const DELIVERY_METHODS = { meetup: '面交', shipping: '寄件' };

document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle();

    const params = new URLSearchParams(window.location.search);
    const listingId = params.get('id');

    if (!listingId) {
        showToast('無法取得刊登資訊', 'error');
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

async function loadListing(id) {
    try {
        const data = await getListing(id);
        // client.js auto-unwraps Flask's wrapper
        renderListing(data.listing || data);
    } catch (error) {
        showToast('載入失敗，請稍後再試', 'error');
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

    if (titleEl) titleEl.textContent = listing.title || '未命名票券';
    if (descriptionEl) descriptionEl.textContent = listing.description || '暫無補充資訊。';
    if (typeEl) typeEl.textContent = TYPE_LABELS[listing.type] || listing.type || '—';
    if (categoryEl) categoryEl.textContent = listing.category || '—';
    if (quantityEl) quantityEl.textContent = listing.quantity || '—';
    if (deliveryEl) deliveryEl.textContent = DELIVERY_METHODS[listing.delivery_method] || listing.delivery_method || '—';
    if (locationEl) locationEl.textContent = listing.location || '—';
    if (expiresEl) expiresEl.textContent = listing.expires_at ? formatDateValue(listing.expires_at) : '—';

    if (priceEl) {
        if (listing.buy_now) {
            priceEl.textContent = `NT$ ${Number(listing.buy_now).toLocaleString()}`;
        } else if (listing.face_value) {
            priceEl.textContent = `原價 NT$ ${Number(listing.face_value).toLocaleString()}`;
        } else {
            priceEl.textContent = '面議';
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
                const imgEl = document.createElement('img');
                imgEl.src = img.url || img;
                imgEl.alt = `${listing.title} 圖片 ${index + 1}`;
                imgEl.loading = 'lazy';
                if (index === 0) imgEl.className = 'detail-image-main';
                imagesEl.appendChild(imgEl);
            });
        }
    }

    if (tagsEl) {
        tagsEl.innerHTML = '';
        if (listing.type) {
            const tag = document.createElement('span');
            tag.className = 'detail-tag';
            tag.textContent = TYPE_LABELS[listing.type];
            tagsEl.appendChild(tag);
        }
        if (listing.urgency === 'urgent') {
            const urgentTag = document.createElement('span');
            urgentTag.className = 'detail-tag detail-tag-urgent';
            urgentTag.textContent = '超急';
            tagsEl.appendChild(urgentTag);
        }
    }

    // Update page title
    document.title = `${listing.title || '刊登詳情'} - TikSwap`;
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
            showToast('請輸入訊息', 'error');
            return;
        }

        const user = getCurrentUser();
        const senderContact = user?.email || 'Guest';

        try {
            await createInquiry(listingId, message, senderContact);
            showToast('訊息已送出！', 'success');
            inquiryForm.reset();
        } catch (error) {
            showToast('訊息傳送失敗，請稍後再試', 'error');
        }
    });
}