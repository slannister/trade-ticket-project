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