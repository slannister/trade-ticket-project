import * as inquiriesApi from '../api/inquiries.js';
import { getCurrentUser } from '../api/auth.js';
import { showToast, query, createElement, removeChildren } from '../utils/dom.js';
import { formatDateTimeValue } from '../utils/date.js';

let chatPanel = null;
let currentConversation = null;
let chatMessages = [];
let onMessageSent = null;

export function init(onSentCallback) {
    onMessageSent = onSentCallback;
    createChatPanel();
    attachChatListeners();
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

export function openChat(inquiry) {
    if (!inquiry || !inquiry.listing) {
        showToast('無法開啟對話', 'error');
        return;
    }

    const currentUser = getCurrentUser();
    const isOwner = currentUser && inquiry.listing.owner_id === currentUser.id;
    const isSender = currentUser && inquiry.sender_id === currentUser.id;

    // Can't reply to yourself
    if (isOwner && isSender) {
        showToast('無法回覆自己的詢問', 'error');
        return;
    }

    currentConversation = inquiry;
    currentConversation._isOwner = isOwner;
    currentConversation._isSender = isSender;
    chatMessages = [inquiry];

    const headerTitle = query('.chat-panel-listing-title');
    if (headerTitle) {
        headerTitle.textContent = inquiry.listing.title || '詢問';
    }

    renderChatMessages();

    chatPanel.hidden = false;
    chatPanel.classList.add('is-open');

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
}

export async function sendChatMessage() {
    const input = query('.chat-input');
    const message = input?.value.trim();

    if (!message || !currentConversation) return;

    try {
        await inquiriesApi.createInquiry(
            currentConversation.listing_id,
            message,
            currentConversation.sender_contact || 'Guest'
        );

        input.value = '';
        showToast('訊息已發送', 'success');

        if (onMessageSent) {
            onMessageSent();
        }
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
    const isOwn = currentUser && currentConversation.sender_id === currentUser.id;

    // Header with listing info
    const headerEl = createElement('div', { className: 'chat-conversation-header' });
    headerEl.innerHTML = `
        <a href="/detail?id=${listing?.id}" class="chat-listing-link" target="_blank">
            關於：${listing?.title || '未知刊登'}
        </a>
    `;
    container.appendChild(headerEl);

    // Messages
    const msgEl = createElement('div', { className: 'chat-message' });
    msgEl.classList.add(isOwn ? 'chat-message-own' : 'chat-message-other');
    msgEl.innerHTML = `
        <div class="chat-bubble">${escapeHtml(currentConversation.message)}</div>
        <div class="chat-meta">
            <span class="chat-sender">${currentConversation.sender_contact || '匿名'}</span>
            <span class="chat-time">${formatDateTimeValue(currentConversation.created_at)}</span>
        </div>
    `;
    container.appendChild(msgEl);

    // Scroll to bottom
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