const formatDate = isoString => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date);
};

export const fetchMessages = async () => {
    const supabaseClient = window.__supabase;
    const isSupabaseEnabled = Boolean(supabaseClient);

    // Debug: Check Supabase connection
    if (!isSupabaseEnabled) {
        console.warn('Supabase client not found in window.__supabase');
        // Fallback for local dev
        return JSON.parse(localStorage.getItem('my_inquiries') || '[]');
    }

    try {
        const { data, error } = await supabaseClient
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        return [];
    }
};

export const renderMessages = async (container) => {
    if (!container) return;

    container.innerHTML = '<div class="loading-state">載入中...</div>';

    const messages = await fetchMessages();

    if (messages.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <p>目前沒有任何訊息。</p>
      </div>
    `;
        return;
    }

    container.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'message-list';

    messages.forEach(msg => {
        const item = document.createElement('div');
        item.className = 'message-item';
        // Handle both Supabase (snake_case) and LocalStorage (camelCase) formats
        const title = msg.listing_title || msg.listingTitle || '未命名刊登';
        const body = msg.message || '';
        const time = formatDate(msg.created_at || msg.sentAt);
        const sender = msg.sender_contact || '訪客';

        item.innerHTML = `
      <div class="message-header">
        <span class="message-listing">${title}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-sender">來自：${sender}</div>
      <div class="message-body">${body}</div>
    `;
        list.appendChild(item);
    });

    container.appendChild(list);
};
