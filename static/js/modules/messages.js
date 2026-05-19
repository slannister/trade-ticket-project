import * as inquiriesApi from '../api/inquiries.js';
import { formatDateTimeValue } from '../utils/date.js';
import { getCurrentUser } from '../api/auth.js';

export async function loadMessages() {
    const data = await inquiriesApi.getInquiries();
    const inquiries = data.inquiries || [];
    const currentUser = getCurrentUser();

    // For each inquiry, get latest message (either itself or last reply)
    const messagesWithReplies = await Promise.all(
        inquiries.map(async (inquiry) => {
            try {
                const replyData = await inquiriesApi.getReplies(inquiry.id);
                const replies = replyData?.inquiries || [];
                const isOwner = currentUser && inquiry.listing?.owner_id === currentUser.id;

                if (replies.length > 0) {
                    const lastReply = replies[replies.length - 1];
                    // Count unread replies (only count others' messages, not your own)
                    const unreadReplyCount = replies.filter(r => !r.read && r.sender_id !== currentUser?.id).length;

                    return {
                        ...inquiry,
                        latestMessage: lastReply.message,
                        latestTime: lastReply.created_at,
                        unreadReplyCount
                    };
                }
            } catch (e) {
                // ignore
            }
            return {
                ...inquiry,
                latestMessage: inquiry.message,
                latestTime: inquiry.created_at,
                unreadReplyCount: 0
            };
        })
    );

    return messagesWithReplies;
}

export async function sendInquiry(listingId, message, senderContact) {
    return inquiriesApi.createInquiry(listingId, message, senderContact);
}

export function formatMessageDate(isoString) {
    return formatDateTimeValue(isoString);
}