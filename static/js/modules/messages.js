import * as inquiriesApi from '../api/inquiries.js';
import { formatDateTimeValue } from '../utils/date.js';

export async function loadMessages() {
    const data = await inquiriesApi.getInquiries();
    return data.inquiries || [];
}

export async function sendInquiry(listingId, message, senderContact) {
    return inquiriesApi.createInquiry(listingId, message, senderContact);
}

export function formatMessageDate(isoString) {
    return formatDateTimeValue(isoString);
}