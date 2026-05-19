import apiClient from './client.js';

export async function getInquiries() {
    return apiClient.get('/inquiries');
}

export async function createInquiry(listingId, message, senderContact) {
    return apiClient.post('/inquiries', {
        listing_id: listingId,
        message,
        sender_contact: senderContact
    });
}

export async function replyInquiry(parentId, message) {
    return apiClient.post(`/inquiries/${parentId}/reply`, { message });
}

export async function getReplies(inquiryId) {
    return apiClient.get(`/inquiries/${inquiryId}/replies`);
}

export async function getUnreadCount() {
    return apiClient.get('/inquiries/unread-count');
}

export async function markAsRead(inquiryId) {
    return apiClient.put(`/inquiries/${inquiryId}/read`, {});
}