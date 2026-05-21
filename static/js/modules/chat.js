import * as inquiriesApi from '../api/inquiries.js';
import { getCurrentUser } from '../api/auth.js';
import { showToast, query, createElement, removeChildren } from '../utils/dom.js';
import { formatDateTimeValue } from '../utils/date.js';

let chatPanel = null;
let currentConversation = null;
let chatMessages = [];
let onMessageSent = null;
let refreshInterval = null;
let eventSource = null;
let badgeInterval = null;
const REFRESH_INTERVAL = 5000;
const BADGE_INTERVAL = 3000;

export function init(onSentCallback) {
    onMessageSent = onSentCallback;
    createChatPanel();
    attachChatListeners();
    updateUnreadBadge();
    startSSE();
    // Fallback badge polling in case SSE fails
    badgeInterval = setInterval(updateUnreadBadge, BADGE_INTERVAL);
}

function startSSE() {
    stopSSE();
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
        const url = new URL('/api/inquiries/stream', window.location.origin);
        url.searchParams.set('token', token);
        eventSource = new EventSource(url.toString());
        eventSource.onopen = () => {
            // SSE connected successfully
        };
        eventSource.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type === 'heartbeat') {
                    updateUnreadBadgeCount(data.unread_count);
                }
            } catch (err) {
                // Ignore parse errors
            }
        };
        eventSource.onerror = () => {
            // Don't retry - rely on badge polling instead
            stopSSE();
        };
    } catch (err) {
        // SSE not supported or failed, rely on polling
    }
}

function stopSSE() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
    // Don't clear badgeInterval - it's the fallback polling
}

function updateUnreadBadgeCount(count) {
    const badge = query('#messages-badge');
    const msgBtn = query('.sidebar-personal[data-category="messages"]');
    if (!badge) return;

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.hidden = false;
        msgBtn?.classList.add('has-unread');
    } else {
        badge.hidden = true;
        msgBtn?.classList.remove('has-unread');
    }
}

async function updateUnreadBadge() {
    const badge = query('#messages-badge');
    const msgBtn = query('.sidebar-personal[data-category="messages"]');
    if (!badge) return;

    try {
        const data = await inquiriesApi.getUnreadCount();
        updateUnreadBadgeCount(data?.count || 0);
    } catch (err) {
        // Silently fail
    }
}

function createChatPanel() {
    chatPanel = createElement('div', {
        className: 'chat-panel',
        id: 'chat-panel',
        hidden: true
    });
    chatPanel.innerHTML = `
        <div class="chat-panel-header">
            <div class="chat-panel-title">
                <span class="chat-panel-listing-title"></span>
            </div>
            <button class="chat-panel-close" type="button" aria-label="關閉">×</button>
        </div>
        <div class="chat-panel-messages" id="chat-messages-container"></div>
        <div class="chat-panel-input">
            <textarea class="chat-input" placeholder="輸入訊息..." rows="1"></textarea>
            <button class="chat-send" type="button" aria-label="發送">發送</button>
        </div>
    `;
    document.body.appendChild(chatPanel);
}

function attachChatListeners() {
    const closeBtn = query('.chat-panel-close');
    closeBtn?.addEventListener('click', closeChat);

    const sendBtn = query('.chat-send');
    sendBtn?.addEventListener('click', sendChatMessage);

    const chatInput = query('.chat-input');
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
}

export async function openChat(inquiry) {
    if (!inquiry || !inquiry.listing) {
        showToast('無法開啟對話', 'error');
        return;
    }

    const currentUser = getCurrentUser();
    const isOwner = currentUser && inquiry.listing.owner_id === currentUser.id;

    // Owner cannot reply to inquiries on their own listing
    if (isOwner) {
        showToast('無法回覆自己的詢問', 'error');
        return;
    }

    currentConversation = inquiry;
    currentConversation._isOwner = isOwner;

    try {
        const result = await inquiriesApi.getReplies(inquiry.id);
        const replies = result && result.inquiries ? result.inquiries : [];
        chatMessages = [inquiry, ...replies];
    } catch (err) {
        chatMessages = [inquiry];
    }

    const headerTitle = query('.chat-panel-listing-title');
    if (headerTitle) {
        headerTitle.textContent = inquiry.listing.title || '詢問';
    }

    renderChatMessages();
    updateUnreadBadge();

    if (currentConversation) {
        inquiriesApi.markAsRead(currentConversation.id).catch(() => {});
    }

    chatPanel.hidden = false;
    chatPanel.classList.add('is-open');

    requestAnimationFrame(() => {
        const container = query('#chat-messages-container');
        if (container) container.scrollTop = container.scrollHeight;
    });

    startAutoRefresh();

    const chatInput = query('.chat-input');
    if (chatInput) {
        chatInput.focus();
    }
}

export function closeChat() {
    if (chatPanel) {
        chatPanel.hidden = true;
        chatPanel.classList.remove('is-open');
    }
    currentConversation = null;
    stopAutoRefresh();
    updateUnreadBadge();
}

export async function refreshMessages() {
    if (!currentConversation) return;
    try {
        const result = await inquiriesApi.getReplies(currentConversation.id);
        const replies = result && result.inquiries ? result.inquiries : [];
        const newMessages = [currentConversation, ...replies];
        if (newMessages.length !== chatMessages.length) {
            chatMessages = newMessages;
            renderChatMessages();
        }
    } catch (err) {
        // Silently fail on refresh errors
    }
}

function startAutoRefresh() {
    stopAutoRefresh();
    refreshInterval = setInterval(refreshMessages, REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

export async function sendChatMessage() {
    const input = query('.chat-input');
    const message = input?.value.trim();

    if (!message || !currentConversation) return;

    try {
        const result = await inquiriesApi.replyInquiry(
            currentConversation.id,
            message
        );

        const reply = result?.reply || result;
        if (reply) {
            chatMessages.push(reply);
        }
        input.value = '';
        showToast('訊息已發送', 'success');
        renderChatMessages();

        if (onMessageSent) {
            onMessageSent();
        }
        await refreshMessages();
        updateUnreadBadge(); // Refresh badge after sending
    } catch (err) {
        showToast(err.message || '發送失敗', 'error');
    }
}

function renderChatMessages() {
    const container = query('#chat-messages-container');
    if (!container || !currentConversation) return;

    removeChildren(container);

    const listing = currentConversation.listing;
    const currentUser = getCurrentUser();

    const headerEl = createElement('div', { className: 'chat-conversation-header' });
    headerEl.innerHTML = `
        <a href="/detail?id=${listing?.id}" class="chat-listing-link" target="_blank">
            關於：${listing?.title || '未知刊登'}
        </a>
    `;
    container.appendChild(headerEl);

    chatMessages.forEach((msg) => {
        const isOwn = currentUser && msg.sender_id === currentUser.id;
        const msgEl = createElement('div', { className: 'chat-message' });
        msgEl.classList.add(isOwn ? 'chat-message-own' : 'chat-message-other');
        const bubbleEl = createElement('div', { className: 'chat-bubble' });
        bubbleEl.textContent = msg.message || '';
        const metaEl = createElement('div', { className: 'chat-meta' });
        metaEl.innerHTML = `
            <span class="chat-sender">${escapeHtml(msg.sender_contact || '匿名')}</span>
            <span class="chat-time">${escapeHtml(formatDateTimeValue(msg.created_at))}</span>
        `;
        msgEl.appendChild(bubbleEl);
        msgEl.appendChild(metaEl);
        container.appendChild(msgEl);
    });

    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function isChatOpen() {
    return chatPanel && !chatPanel.hidden;
}