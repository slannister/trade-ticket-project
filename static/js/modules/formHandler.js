import { query, show, hide } from '../utils/dom.js';
import { showToast } from '../utils/toast.js';
import { uploadImage as uploadImageApi } from '../api/listings.js';
import { t } from '../i18n/index.js';

let editingListingId = null;

export function getEditingId() {
    return editingListingId;
}

export function setEditingId(id) {
    editingListingId = id;
}

export function clearEditingId() {
    editingListingId = null;
}

export function bindFormEvents(onSubmit, onCancelEdit) {
    const form = query('#listing-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = collectFormData(e.target);
            if (!data) return;

            const imageInput = e.target.querySelector('input[name="listing-images"]');
            if (imageInput && imageInput.files && imageInput.files.length > 0) {
                await handleImageUpload(data, imageInput.files);
            }

            await onSubmit(data, editingListingId);
            resetForm();
        });
    }

    const cancelBtn = query('#listing-cancel-edit');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            resetForm();
            if (onCancelEdit) onCancelEdit();
        });
    }
}

export function collectFormData(form) {
    const formData = new FormData(form);
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

    return data;
}

export async function handleImageUpload(data, files) {
    const maxImages = 6;
    const filesArr = Array.from(files).slice(0, maxImages);
    const uploadedImages = [];

    for (const file of filesArr) {
        try {
            const result = await uploadImageApi(file);
            uploadedImages.push({ url: result.url, filename: result.filename });
        } catch (err) {
            console.error('Image upload failed:', err);
        }
    }

    if (uploadedImages.length > 0) {
        data.images = uploadedImages;
    }
}

export function fillForm(listing) {
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
    }
}

export function resetForm() {
    const form = query('#listing-form');
    if (form) form.reset();
    editingListingId = null;
    const cancelBtn = query('#listing-cancel-edit');
    if (cancelBtn) cancelBtn.hidden = true;
    const formPanel = query('#listing-form-panel');
    if (formPanel) hide(formPanel);
}

export function showFormPanel() {
    const formPanel = query('#listing-form-panel');
    if (formPanel) {
        show(formPanel);
        formPanel.scrollIntoView({ behavior: 'smooth' });
    }
}