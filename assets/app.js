document.addEventListener('DOMContentLoaded', () => {
  // DOM 元素
  const listingForm = document.getElementById('listing-form');
  const listingFormPanel = document.getElementById('listing-form-panel');
  const listingsContainer = document.getElementById('listings-container');
  const listingTemplate = document.getElementById('listing-template');
  const listingTimeInput = document.getElementById('listing-time');
  const listingCancelButton = document.getElementById('listing-cancel-edit');
  const paginationRoot = document.getElementById('listing-pagination');
  const paginationPrev = paginationRoot ? paginationRoot.querySelector('[data-pagination-prev]') : null;
  const paginationNext = paginationRoot ? paginationRoot.querySelector('[data-pagination-next]') : null;
  const paginationInfo = paginationRoot ? paginationRoot.querySelector('[data-pagination-info]') : null;
  const paginationPageDisplay = paginationRoot ? paginationRoot.querySelector('[data-pagination-page]') : null;
  const filterType = document.getElementById('filter-type');
  const filterCategory = document.getElementById('filter-category');
  const filterSearch = document.getElementById('filter-search');
  const filterQuantityMin = document.getElementById('filter-quantity-min');
  const filterDelivery = document.getElementById('filter-delivery');
  const filterCreatedStart = document.getElementById('filter-created-start');
  const filterCreatedEnd = document.getElementById('filter-created-end');
  const filterExpiresStart = document.getElementById('filter-expires-start');
  const filterExpiresEnd = document.getElementById('filter-expires-end');
  const filterClear = document.getElementById('filter-clear');
  const sidebarAction = document.querySelector('.sidebar-action');
  const sidebarCategoryButtons = document.querySelectorAll('.sidebar-nav button[data-category]');
  const memberButton = document.querySelector('[data-member-trigger]');
  const accountControl = document.querySelector('[data-account-control]');
  const accountMenu = document.querySelector('[data-account-menu]');
  const accountLogoutButton = document.querySelector('[data-account-logout]');
  const memberModal = document.getElementById('member-modal');
  const memberModalBody = memberModal ? memberModal.querySelector('.member-modal-body') : null;
  const memberTabs = memberModal ? Array.from(memberModal.querySelectorAll('[data-member-tab]')) : [];
  const memberRouteButtons = memberModal ? Array.from(memberModal.querySelectorAll('[data-member-route]')) : [];
  const memberViews = memberModal ? Array.from(memberModal.querySelectorAll('[data-member-view]')) : [];
  const memberMessage = memberModal ? memberModal.querySelector('[data-member-message]') : null;
  const memberLogoutButtons = memberModal ? Array.from(memberModal.querySelectorAll('[data-member-logout]')) : [];
  const memberLoginForm = document.getElementById('member-login-form');
  const memberSignupForm = document.getElementById('member-signup-form');
  const memberResetForm = document.getElementById('member-reset-form');
  let memberUpdateForm = document.getElementById('member-update-password-form');
  const categoryPanel = document.getElementById('category-panel');
  const categoryPanelTitle = document.getElementById('category-panel-title');
  const categoryPanelSubtitle = document.getElementById('category-panel-subtitle');
  const listingImageInput = document.getElementById('listing-images');
  const imageModalRoot = document.getElementById('image-modal');
  const imageModalBackdrop = imageModalRoot ? imageModalRoot.querySelector('.image-modal-backdrop') : null;
  const imageModalContent = imageModalRoot ? imageModalRoot.querySelector('.image-modal-content') : null;
  const imageModalImage = imageModalRoot ? imageModalRoot.querySelector('.image-modal-image') : null;
  const imageModalClose = imageModalRoot ? imageModalRoot.querySelector('.image-modal-close') : null;
  const imageModalPrev = imageModalRoot ? imageModalRoot.querySelector('.image-modal-prev') : null;
  const imageModalNext = imageModalRoot ? imageModalRoot.querySelector('.image-modal-next') : null;
  const imageModalCounter = imageModalRoot ? imageModalRoot.querySelector('.image-modal-counter') : null;
  const supabaseClient = window.__supabase || null;
  const isSupabaseEnabled = Boolean(supabaseClient);
  const listingsTableName = 'listings';
  const storageBucketName = 'listing-images';
  const isStorageEnabled = isSupabaseEnabled;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_IMAGE_COUNT = 6;
  const DEFAULT_DEADLINE_TIME_INPUT = '23:59';
  const DEFAULT_DEADLINE_TIME_ISO = '23:59:59';
  const MY_LISTINGS_CATEGORY = 'my-listings';
  const FAVORITES_CATEGORY = 'favorites';
  const FAVORITES_STORAGE_PREFIX = 'tikswapFavorites:';
  const REMEMBER_EMAIL_KEY = 'authRememberEmail';
  const LISTINGS_PER_PAGE = 6;
  const SELECTED_LISTING_KEY = 'selectedListing';
  const LISTING_CACHE_KEY = 'listingCache';
  const WINDOW_TRANSFER_KEY = '__tikswapSelectedListing';
  const isUuid = value => typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  let modalState = { images: [], index: 0 };
  let activeCategory = 'all';
  let memberSession = null;
  let memberFavorites = new Set();
  let memberModalView = 'login';
  let memberFocusReturnElement = null;
  let memberOriginalOverflow = '';
  let editingListingId = null;
  let editingListingOriginal = null;
  let currentPage = 1;
  let totalPages = 1;

  function setupPasswordToggles(scope = document) {
    if (!scope) return;
    const toggles = scope.querySelectorAll('[data-password-toggle]');
    toggles.forEach(toggle => {
      if (toggle.dataset.passwordToggleBound === 'true') return;
      toggle.dataset.passwordToggleBound = 'true';
      toggle.addEventListener('click', () => {
        const wrapper = toggle.closest('[data-password-field]');
        const input = wrapper ? wrapper.querySelector('input') : null;
        if (!input) return;
        const isVisible = input.type === 'text';
        input.type = isVisible ? 'password' : 'text';
        toggle.setAttribute('aria-pressed', (!isVisible).toString());
        toggle.setAttribute('aria-label', isVisible ? '顯示密碼' : '隱藏密碼');
      });
    });
  }

  function ensureRecoverViewExists() {
    if (memberUpdateForm || !memberModalBody) return;
    const recoverSection = document.createElement('section');
    recoverSection.className = 'member-view';
    recoverSection.dataset.memberView = 'recover';
    recoverSection.hidden = true;
    recoverSection.innerHTML = `
      <h3>設定新密碼</h3>
      <form class="member-form" id="member-update-password-form">
        <label class="member-field member-field-password">
          <span>新的密碼</span>
          <div class="member-input-wrapper" data-password-field>
            <input autocomplete="new-password" name="newPassword" placeholder="至少 6 碼" minlength="6" required type="password">
            <button class="member-password-toggle" type="button" data-password-toggle aria-pressed="false" aria-label="顯示密碼">
              <span aria-hidden="true"></span>
            </button>
          </div>
        </label>
        <label class="member-field member-field-password">
          <span>確認密碼</span>
          <div class="member-input-wrapper" data-password-field>
            <input autocomplete="new-password" name="confirmNewPassword" placeholder="再次輸入" minlength="6" required type="password">
            <button class="member-password-toggle" type="button" data-password-toggle aria-pressed="false" aria-label="顯示密碼">
              <span aria-hidden="true"></span>
            </button>
          </div>
        </label>
        <button class="member-primary" type="submit">更新密碼</button>
      </form>
      <p class="member-footnote">完成後可直接 <button class="member-link" data-member-route="login" type="button">返回登入</button></p>
    `;
    if (memberMessage) {
      memberModalBody.insertBefore(recoverSection, memberMessage);
    } else {
      memberModalBody.appendChild(recoverSection);
    }
    memberViews.push(recoverSection);
    memberRouteButtons.push(...recoverSection.querySelectorAll('[data-member-route]'));
    memberUpdateForm = recoverSection.querySelector('#member-update-password-form');
    setupPasswordToggles(recoverSection);
  }

  ensureRecoverViewExists();
  setupPasswordToggles();

  const formatDeliveryMethod = value => {
    if (!value) return '—';
    return value === 'meetup' ? '面交' : value === 'shipping' ? '寄件' : value;
  };

  const parseDate = value => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'number') {
      const fromNumber = new Date(value);
      return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
    }
    if (value.toDate && typeof value.toDate === 'function') {
      const fromToDate = value.toDate();
      return fromToDate instanceof Date && !Number.isNaN(fromToDate.getTime()) ? fromToDate : null;
    }
    if (value.seconds) {
      const fromSeconds = new Date(value.seconds * 1000);
      return Number.isNaN(fromSeconds.getTime()) ? null : fromSeconds;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [yearStr, monthStr, dayStr] = trimmed.split('-');
        const year = Number(yearStr);
        const month = Number(monthStr);
        const day = Number(dayStr);
        if ([year, month, day].some(num => Number.isNaN(num))) return null;
        const localDate = new Date(year, month - 1, day);
        return Number.isNaN(localDate.getTime()) ? null : localDate;
      }
      let normalized = trimmed.includes('T') ? trimmed : trimmed.replace(/\s+/, 'T');
      normalized = normalized.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
      normalized = normalized.replace(/([+-]\d{2})$/, '$1:00');
      normalized = normalized.replace(/(\.\d{3})\d+/, '$1');
      let date = new Date(normalized);
      if (!Number.isNaN(date.getTime())) return date;
      if (!/(?:[zZ]|[+-]\d{2}:\d{2})$/.test(normalized)) {
        date = new Date(`${normalized}Z`);
        if (!Number.isNaN(date.getTime())) return date;
      }
      return null;
    }
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  };

  const formatTimeValue = value => {
    if (!value) return '';
    const timeParts = value.split(':');
    const hour = (timeParts[0] || '00').padStart(2, '0');
    const minute = (timeParts[1] || '00').padStart(2, '0');
    return `${hour}:${minute}`;
  };

  const formatDateValue = value => {
    const date = parseDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  const formatDateTimeValue = value => {
    const date = parseDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  const toIsoString = value => {
    const date = parseDate(value);
    return date ? date.toISOString() : null;
  };

  const parseImages = value => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(img => img && img.url);
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter(img => img && img.url) : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const adjustEndOfDay = (date, rawValue) => {
    if (!date || !rawValue) return date;
    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (trimmed && !trimmed.includes('T')) {
        const adjusted = new Date(date.getTime());
        adjusted.setHours(23, 59, 59, 999);
        return adjusted;
      }
    }
    return date;
  };

  const categoryBackgrounds = {
    '演唱會': 'linear-gradient(140deg, rgba(224, 114, 255, 0.4), rgba(118, 86, 255, 0.35))',
    '體育賽事': 'linear-gradient(140deg, rgba(91, 200, 255, 0.35), rgba(76, 181, 163, 0.4))',
    '戲劇舞台': 'linear-gradient(140deg, rgba(255, 168, 91, 0.4), rgba(170, 99, 255, 0.35))',
    '綜藝活動': 'linear-gradient(140deg, rgba(255, 129, 179, 0.38), rgba(255, 182, 108, 0.38))',
    '展覽 / 市集': 'linear-gradient(140deg, rgba(99, 205, 255, 0.35), rgba(112, 255, 188, 0.35))',
    '收藏品 / 周邊': 'linear-gradient(140deg, rgba(164, 129, 255, 0.38), rgba(108, 218, 255, 0.32))',
    '其他': 'linear-gradient(140deg, rgba(140, 150, 170, 0.35), rgba(90, 99, 120, 0.35))'
  };

  const getCategoryBackground = value => {
    if (!value) return 'linear-gradient(140deg, rgba(91, 140, 255, 0.24), rgba(127, 91, 255, 0.18))';
    return categoryBackgrounds[value] || 'linear-gradient(140deg, rgba(91, 140, 255, 0.24), rgba(127, 91, 255, 0.18))';
  };

  const getCategoryLabel = value => {
    if (!value || value === 'all') return '全部票券';
    const match = Array.from(sidebarCategoryButtons || []).find(
      button => (button.dataset.category || 'all') === value
    );
    return match ? match.textContent.trim() : value;
  };

  function updateCategoryPanelSubtitle() {
    if (!categoryPanelSubtitle) return;
    if (!categoryPanel || categoryPanel.hidden) {
      categoryPanelSubtitle.textContent = '選擇左側類別以查看對應的刊登與篩選工具。';
      return;
    }
    if (activeCategory === MY_LISTINGS_CATEGORY) {
      categoryPanelSubtitle.textContent = '顯示由你建立的刊登，可立即編輯或刪除。';
      return;
    }
    if (activeCategory === FAVORITES_CATEGORY) {
      categoryPanelSubtitle.textContent = '收藏於「我的最愛」的刊登都會集中在這裡。';
      return;
    }
    const label = getCategoryLabel(activeCategory);
    categoryPanelSubtitle.textContent = `${label} 的刊登與篩選結果顯示於此。`;
  }



  const getFavoritesStorageKey = userId => `${FAVORITES_STORAGE_PREFIX}${userId}`;

  const getSessionUser = () => (memberSession && memberSession.user ? memberSession.user : null);

  const getDisplayNameFromUser = user => {
    if (!user) return '會員';
    const metaName = user.user_metadata && user.user_metadata.display_name;
    if (metaName && metaName.trim()) return metaName.trim();
    if (user.phone) return user.phone;
    if (user.email) return user.email;
    return '會員';
  };

  function loadRememberedEmail() {
    if (!memberLoginForm) return;
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      const emailInput = memberLoginForm.querySelector('input[name="email"]');
      const rememberInput = memberLoginForm.querySelector('input[name="remember"]');
      if (saved && emailInput) {
        emailInput.value = saved;
        if (rememberInput) rememberInput.checked = true;
      }
    } catch (error) {
      console.warn('無法讀取記住帳號資訊', error);
    }
  }

  function persistRememberedEmail(shouldRemember, email) {
    try {
      if (shouldRemember && email) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch (error) {
      console.warn('無法儲存記住帳號資訊', error);
    }
  }

  function loadFavoritesForSession() {
    memberFavorites = new Set();
    const user = getSessionUser();
    if (!user) return;
    try {
      const raw = localStorage.getItem(getFavoritesStorageKey(user.id));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memberFavorites = new Set(parsed.map(id => id.toString()));
      }
    } catch (error) {
      console.warn('無法讀取收藏資料', error);
    }
  }

  function persistFavorites() {
    const user = getSessionUser();
    if (!user) return;
    try {
      localStorage.setItem(
        getFavoritesStorageKey(user.id),
        JSON.stringify(Array.from(memberFavorites))
      );
    } catch (error) {
      console.warn('無法儲存收藏資料', error);
    }
  }

  function isFavorite(listingId) {
    if (!listingId) return false;
    return memberFavorites.has(listingId.toString());
  }

  function toggleFavorite(listingId) {
    if (!listingId) return;
    if (!ensureAuthenticated({ view: 'login', reason: '請先登入以使用我的最愛。' })) {
      return;
    }
    const key = listingId.toString();
    if (memberFavorites.has(key)) {
      memberFavorites.delete(key);
    } else {
      memberFavorites.add(key);
    }
    persistFavorites();
    renderListings();
  }

  function updateMemberUI() {
    const user = getSessionUser();
    if (memberButton) {
      if (user) {
        memberButton.textContent = `Hi，${getDisplayNameFromUser(user)}`;
        memberButton.dataset.memberState = 'signed-in';
      } else {
        memberButton.textContent = '登入 / 註冊';
        memberButton.dataset.memberState = 'signed-out';
      }
    }
    memberLogoutButtons.forEach(button => {
      button.hidden = !user;
    });
    if (accountMenu) {
      accountMenu.classList.remove('is-open');
      accountMenu.hidden = true;
    }
  }

  function setMemberMessage(message, { variant = 'neutral' } = {}) {
    if (!memberMessage) return;
    memberMessage.hidden = !message;
    memberMessage.textContent = message || '';
    memberMessage.classList.remove('is-error', 'is-success', 'is-warning');
    if (!message) return;
    if (variant === 'error') {
      memberMessage.classList.add('is-error');
    } else if (variant === 'success') {
      memberMessage.classList.add('is-success');
    } else if (variant === 'warning') {
      memberMessage.classList.add('is-warning');
    }
  }

  function setMemberView(view = 'login') {
    memberModalView = view;
    memberViews.forEach(section => {
      const isActive = section.dataset.memberView === view;
      section.hidden = !isActive;
    });
    memberTabs.forEach(tab => {
      const target = tab.dataset.memberTab;
      const isActive = target === view;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    if (view === 'login') {
      loadRememberedEmail();
    }
  }

  function openMemberModal(initialView = 'login') {
    if (!memberModal) return;
    if (!isSupabaseEnabled) {
      showToast('尚未設定 Supabase 連線，無法使用會員功能。');
      return;
    }
    setMemberView(initialView);
    if (!memberModal.classList.contains('is-open')) {
      memberFocusReturnElement = document.activeElement;
      memberOriginalOverflow = document.body.style.overflow || '';
    }
    memberModal.classList.add('is-open');
    memberModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setMemberMessage('');
    const activeView = memberViews.find(section => !section.hidden);
    const firstInput = activeView ? activeView.querySelector('input') : null;
    if (firstInput && typeof firstInput.focus === 'function') {
      firstInput.focus({ preventScroll: true });
    }
  }

  function closeMemberModal() {
    if (!memberModal) return;
    memberModal.classList.remove('is-open');
    memberModal.setAttribute('aria-hidden', 'true');
    if (!imageModalRoot || !imageModalRoot.classList.contains('is-visible')) {
      document.body.style.overflow = memberOriginalOverflow || '';
    }
    if (memberFocusReturnElement && typeof memberFocusReturnElement.focus === 'function') {
      memberFocusReturnElement.focus({ preventScroll: true });
    }
    memberFocusReturnElement = null;
  }


  function setMemberFormLoading(form, isLoading) {
    if (!form) return;
    const controls = Array.from(form.querySelectorAll('input, button'));
    controls.forEach(control => {
      control.disabled = isLoading;
    });
  }

  async function handleMemberLogin(event) {
    event.preventDefault();
    if (!memberLoginForm) return;
    if (!isSupabaseEnabled) {
      setMemberMessage('尚未設定 Supabase 連線，無法使用會員功能。', { variant: 'error' });
      return;
    }
    const formData = new FormData(memberLoginForm);
    const email = (formData.get('email') || '').toString().trim();
    const password = (formData.get('password') || '').toString();
    const remember = formData.get('remember') === 'on';
    if (!email || !password) {
      setMemberMessage('請輸入電子郵件與密碼。', { variant: 'error' });
      return;
    }
    setMemberFormLoading(memberLoginForm, true);
    setMemberMessage('');
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      persistRememberedEmail(remember, email);
      setMemberMessage('登入成功，正在為您更新狀態。', { variant: 'success' });
    } catch (error) {
      console.error('Supabase signIn failed', error);
      setMemberMessage(error.message || '登入失敗，請稍後再試。', { variant: 'error' });
    } finally {
      setMemberFormLoading(memberLoginForm, false);
    }
  }

  async function handleMemberSignup(event) {
    event.preventDefault();
    if (!memberSignupForm) return;
    if (!isSupabaseEnabled) {
      setMemberMessage('尚未設定 Supabase 連線，無法使用會員功能。', { variant: 'error' });
      return;
    }
    const formData = new FormData(memberSignupForm);
    const email = (formData.get('email') || '').toString().trim();
    const password = (formData.get('password') || '').toString();
    const confirm = (formData.get('confirmPassword') || '').toString();
    if (!email || !password || !confirm) {
      setMemberMessage('請填寫完整的註冊資訊。', { variant: 'error' });
      return;
    }
    if (password.length < 6) {
      setMemberMessage('密碼至少需要 6 碼。', { variant: 'error' });
      return;
    }
    if (password !== confirm) {
      setMemberMessage('兩次輸入的密碼不一致。', { variant: 'error' });
      return;
    }
    setMemberFormLoading(memberSignupForm, true);
    setMemberMessage('');
    try {
      const { error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;
      setMemberMessage('帳號建立成功！若需驗證請至信箱查收。', { variant: 'success' });
    } catch (error) {
      console.error('Supabase signUp failed', error);
      setMemberMessage(error.message || '註冊失敗，請稍後再試。', { variant: 'error' });
    } finally {
      setMemberFormLoading(memberSignupForm, false);
    }
  }

  async function handleMemberReset(event) {
    event.preventDefault();
    if (!memberResetForm) return;
    const formData = new FormData(memberResetForm);
    const email = (formData.get('email') || '').toString().trim();
    if (!email) {
      setMemberMessage('請輸入電子郵件。', { variant: 'error' });
      return;
    }
    if (!isSupabaseEnabled) {
      setMemberMessage('示範模式：已記錄您的重設請求，請留意信箱。', { variant: 'info' });
      memberResetForm.reset();
      return;
    }
    setMemberFormLoading(memberResetForm, true);
    setMemberMessage('正在寄送重設連結…');
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/index.html`
      });
      if (error) throw error;
      setMemberMessage('已寄出重設密碼連結，請查收信箱。', { variant: 'success' });
    } catch (error) {
      console.error('Supabase resetPassword failed', error);
      setMemberMessage(error.message || '寄送失敗，請稍後再試。', { variant: 'error' });
    } finally {
      setMemberFormLoading(memberResetForm, false);
    }
  }

  async function handleMemberPasswordUpdate(event) {
    event.preventDefault();
    if (!memberUpdateForm) return;
    if (!isSupabaseEnabled) {
      setMemberMessage('尚未設定 Supabase 連線，無法更新密碼。', { variant: 'error' });
      return;
    }
    const formData = new FormData(memberUpdateForm);
    const newPassword = (formData.get('newPassword') || '').toString();
    const confirmNewPassword = (formData.get('confirmNewPassword') || '').toString();
    if (!newPassword || !confirmNewPassword) {
      setMemberMessage('請輸入並確認新密碼。', { variant: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setMemberMessage('新密碼至少需要 6 碼。', { variant: 'error' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setMemberMessage('兩次輸入的密碼不一致。', { variant: 'error' });
      return;
    }
    setMemberFormLoading(memberUpdateForm, true);
    setMemberMessage('正在更新密碼…');
    try {
      const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMemberMessage('密碼已更新，請重新登入。', { variant: 'success' });
      memberUpdateForm.reset();
      setMemberView('login');
    } catch (error) {
      console.error('Supabase updateUser failed', error);
      setMemberMessage(error.message || '更新密碼失敗，請稍後再試。', { variant: 'error' });
    } finally {
      setMemberFormLoading(memberUpdateForm, false);
    }
  }

  function ensureAuthenticated({ view = 'login', reason = '' } = {}) {
    if (!isSupabaseEnabled) return true;
    if (getSessionUser()) return true;
    openMemberModal(view);
    if (reason) {
      setMemberMessage(reason, { variant: 'warning' });
    }
    return false;
  }

  async function handleMemberLogout() {
    if (!isSupabaseEnabled) {
      showToast('尚未設定 Supabase 連線，無法使用會員登出。');
      return;
    }
    try {
      await supabaseClient.auth.signOut();
    } catch (error) {
      console.error('Supabase signOut failed', error);
      showToast('登出失敗，請稍後再試。');
    }
  }

  function bindMemberEvents() {
    if (memberButton) {
      memberButton.addEventListener('click', () => {
        if (getSessionUser()) {
          if (accountMenu) {
            const isOpen = accountMenu.classList.toggle('is-open');
            accountMenu.hidden = !isOpen;
          }
        } else {
          openMemberModal('login');
        }
      });
    }
    memberTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetView = tab.dataset.memberTab;
        if (!targetView) return;
        setMemberMessage('');
        setMemberView(targetView);
      });
    });
    memberRouteButtons.forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        const targetView = button.dataset.memberRoute || 'login';
        setMemberMessage('');
        setMemberView(targetView);
      });
    });
    if (memberModal) {
      memberModal.addEventListener('click', event => {
        if (event.target.matches('[data-member-dismiss]')) {
          event.preventDefault();
          closeMemberModal();
        }
      });
    }
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && memberModal && memberModal.classList.contains('is-open')) {
        closeMemberModal();
      }
    });
    if (memberLoginForm) memberLoginForm.addEventListener('submit', handleMemberLogin);
    if (memberSignupForm) memberSignupForm.addEventListener('submit', handleMemberSignup);
    if (memberResetForm) memberResetForm.addEventListener('submit', handleMemberReset);
    if (memberUpdateForm) memberUpdateForm.addEventListener('submit', handleMemberPasswordUpdate);
    memberLogoutButtons.forEach(button => button.addEventListener('click', handleMemberLogout));
    if (accountLogoutButton) {
      accountLogoutButton.addEventListener('click', () => {
        handleMemberLogout();
        if (accountMenu) {
          accountMenu.classList.remove('is-open');
          accountMenu.hidden = true;
        }
      });
    }
    document.addEventListener('click', event => {
      if (!accountControl || !accountMenu) return;
      if (!accountControl.contains(event.target)) {
        accountMenu.classList.remove('is-open');
        accountMenu.hidden = true;
      }
    });
  }

  async function refreshMemberSession() {
    if (!isSupabaseEnabled) return;
    try {
      const { data } = await supabaseClient.auth.getSession();
      memberSession = data.session || null;
      updateMemberUI();
      loadFavoritesForSession();
      renderListings();
    } catch (error) {
      console.warn('無法取得會員會話', error);
    }
  }

  function initializeMembership() {
    bindMemberEvents();
    loadRememberedEmail();
    if (!isSupabaseEnabled) {
      updateMemberUI();
      return;
    }
    refreshMemberSession();
    supabaseClient.auth.onAuthStateChange((event, session) => {
      memberSession = session;
      updateMemberUI();
      loadFavoritesForSession();
      renderListings();
      if (event === 'PASSWORD_RECOVERY') {
        openMemberModal('recover');
        setMemberMessage('請輸入新的密碼以完成重設。', { variant: 'warning' });
      } else if (event === 'SIGNED_IN') {
        const user = getSessionUser();
        showToast(`歡迎回來，${getDisplayNameFromUser(user)}！`);
        closeMemberModal();
        setMemberMessage('');
      } else if (event === 'SIGNED_OUT') {
        showToast('已登出帳號');
      }
    });
  }
  function setActiveCategory(value, { syncSelect = false, syncNav = false } = {}) {
    const normalized = value && value !== '' ? value : 'all';
    const requiresAuth = normalized === MY_LISTINGS_CATEGORY || normalized === FAVORITES_CATEGORY;
    if (requiresAuth && !getSessionUser()) {
      activeCategory = 'all';
      resetPagination();
      return;
    }
    activeCategory = normalized;
    resetPagination();

    if (syncSelect && filterCategory) {
      const hasOption = Array.from(filterCategory.options || []).some(option => option.value === normalized);
      if (hasOption) {
        filterCategory.value = normalized;
      }
    }

    if (syncNav) {
      Array.from(sidebarCategoryButtons || []).forEach(button => {
        const buttonCategory = button.dataset.category || 'all';
        button.classList.toggle('is-active', buttonCategory === normalized);
        button.setAttribute('aria-pressed', buttonCategory === normalized ? 'true' : 'false');
      });
    }

    if (categoryPanelTitle) {
      categoryPanelTitle.textContent = normalized === 'all'
        ? '全部票券'
        : `${getCategoryLabel(normalized)}`;
    }

    updateCategoryPanelSubtitle();
  }

function hideCategoryPanel() {
    if (!categoryPanel) return;
    categoryPanel.classList.add('is-hidden');
    categoryPanel.hidden = true;
  }

  function hideListingForm() {
    if (!listingFormPanel) return;
    listingFormPanel.classList.add('is-hidden');
    listingFormPanel.hidden = true;
  }

  function showListingForm() {
    if (!listingFormPanel) return;
    listingFormPanel.classList.remove('is-hidden');
    listingFormPanel.hidden = false;
  }

  function setFormMode(mode = 'create') {
    if (!listingForm) return;
    const submitButton = listingForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = mode === 'edit' ? '更新刊登' : '發布刊登';
    }
    if (listingCancelButton) {
      listingCancelButton.hidden = mode !== 'edit';
    }
    listingForm.classList.toggle('is-editing', mode === 'edit');
  }

  function clearEditingState() {
    editingListingId = null;
    editingListingOriginal = null;
    setFormMode('create');
  }

  function cancelListingEdit() {
    if (!listingForm) return;
    const wasEditing = Boolean(editingListingId);
    listingForm.reset();
    ensureDefaultDeadlineTime();
    clearEditingState();
    scrollToCategoryPanel();
    if (wasEditing) {
      showToast('已取消編輯');
    }
  }

  function populateListingForm(listing) {
    if (!listingForm || !listing) return;
    const assign = (name, value) => {
      const field = listingForm.elements && listingForm.elements[name];
      if (field) field.value = value ?? '';
    };
    assign('title', listing.title || '');
    assign('quantity', listing.quantity || 1);
    assign('type', listing.type || '');
    assign('category', listing.category || '');
    assign('faceValue', listing.faceValue || '');
    assign('buyNow', listing.buyNow || '');
    assign('deliveryMethod', listing.deliveryMethod || '');
    assign('urgency', listing.urgency || 'normal');
    assign('location', listing.location || '');
    assign('sellerName', listing.sellerName || '');
    assign('sellerContact', listing.sellerContact || '');
    assign('swapPreferences', listing.swapPreferences || '');
    assign('description', listing.description || '');

    const expiresDateField = listingForm.elements && listingForm.elements['expiresDate'];
    const expiresTimeField = listingForm.elements && listingForm.elements['expiresTime'];
    const expiresDateValue = listing.expiresDate || (listing.expiresAt ? toIsoString(listing.expiresAt)?.slice(0, 10) : '');
    if (expiresDateField) {
      expiresDateField.value = expiresDateValue || '';
    }
    if (expiresTimeField) {
      if (listing.expiresTime) {
        expiresTimeField.value = formatTimeValue(listing.expiresTime);
      } else if (listing.expiresAt) {
        const parsed = parseDate(listing.expiresAt);
        if (parsed && !Number.isNaN(parsed.getTime())) {
          expiresTimeField.value = `${parsed.getHours().toString().padStart(2, '0')}:${parsed.getMinutes().toString().padStart(2, '0')}`;
        } else {
          expiresTimeField.value = DEFAULT_DEADLINE_TIME_INPUT;
        }
      } else {
        expiresTimeField.value = DEFAULT_DEADLINE_TIME_INPUT;
      }
    }
  }

  function beginEditListing(listing) {
    if (!listing || !listing.id) return;
    const user = getSessionUser();
    if (!user || listing.ownerId !== user.id) {
      showToast('僅能編輯自己的刊登。');
      return;
    }
    editingListingId = listing.id;
    editingListingOriginal = JSON.parse(JSON.stringify(listing));
    populateListingForm(listing);
    setFormMode('edit');
    showListingForm();
    scrollToListingForm();
  }

  async function deleteListing(listing) {
    if (!listing || !listing.id) return;
    const user = getSessionUser();
    if (!user || listing.ownerId !== user.id) {
      showToast('僅能刪除自己的刊登。');
      return;
    }
    const confirmed = typeof window !== 'undefined'
      ? window.confirm('確定要刪除此刊登嗎？')
      : true;
    if (!confirmed) return;
    const listingId = listing.id.toString();
    try {
      if (isSupabaseEnabled) {
        await supabaseClient
          .from(listingsTableName)
          .delete()
          .eq('id', listingId);
      }
    } catch (error) {
      console.error('Supabase 刪除失敗', error);
    } finally {
      const index = listings.findIndex(item => (item.id ? item.id.toString() : '') === listingId);
      if (index >= 0) {
        listings.splice(index, 1);
      }
      if (memberFavorites.has(listingId)) {
        memberFavorites.delete(listingId);
        persistFavorites();
      }
      renderListings();
      showToast('刊登已刪除');
      if (editingListingId === listingId) {
        clearEditingState();
        if (listingForm) listingForm.reset();
      }
    }
  }

  function showCategoryPanel() {
    if (!categoryPanel) return;
    categoryPanel.hidden = false;
    categoryPanel.classList.remove('is-hidden');
    hideListingForm();
    updateCategoryPanelSubtitle();
  }

  function persistSelectedListingPayload(payload) {
    if (!payload) return;
    let serialized = '';
    try {
      serialized = JSON.stringify(payload);
    } catch (error) {
      console.warn('無法序列化刊登資料', error);
      return;
    }
    try {
      localStorage.setItem(SELECTED_LISTING_KEY, serialized);
    } catch (error) {
      console.warn('無法快取選取的刊登', error);
    }
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SELECTED_LISTING_KEY, serialized);
      }
    } catch {
      /* sessionStorage 失敗時略過 */
    }
    if (typeof window !== 'undefined') {
      try {
        let transferState = {};
        if (window.name && window.name.trim()) {
          try {
            transferState = JSON.parse(window.name);
          } catch {
            transferState = {};
          }
        }
        transferState[WINDOW_TRANSFER_KEY] = serialized;
        window.name = JSON.stringify(transferState);
      } catch {
        try {
          window.name = serialized;
        } catch {
          /* ignore window name assignment failure */
        }
      }
    }
  }

  function persistListingCache(payload) {
    if (!payload || !payload.id) return;
    try {
      const raw = localStorage.getItem(LISTING_CACHE_KEY) || '{}';
      const cache = JSON.parse(raw);
      cache[payload.id] = payload;
      localStorage.setItem(LISTING_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('無法更新刊登快取', error);
    }
  }

  function encodeListingForUrl(payload) {
    if (!payload) return '';
    try {
      const json = JSON.stringify(payload);
      if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        const safeJson = encodeURIComponent(json);
        const base64 = window.btoa(safeJson)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/g, '');
        return base64;
      }
      return encodeURIComponent(json);
    } catch (error) {
      console.warn('無法序列化刊登資料供網址使用', error);
      return '';
    }
  }

  function navigateToListingDetail(data) {
    if (!data) return;
    const payload = { ...data };
    if (!payload.__detailBackground) {
      payload.__detailBackground = getCategoryBackground(payload.category);
    }
    payload.__savedAt = Date.now();
    persistSelectedListingPayload(payload);
    persistListingCache(payload);
    const url = new URL('detail.html', window.location.href);
    if (payload.id) {
      url.searchParams.set('id', payload.id);
    }
    const encoded = encodeListingForUrl(payload);
    if (encoded) {
      url.searchParams.set('payload', encoded);
      url.hash = `data=${encoded}`;
    } else {
      url.hash = '';
    }
    window.location.href = url.toString();
  }



  const normalizeSupabaseListing = row => {
    if (!row) return null;
    // Accept both camelCase and snake_case timestamps since local data may use either
    const expiresAtIso = toIsoString(row.expires_at ?? row.expiresAt);
    let derivedDate = '';
    let derivedTime = '';

    if (expiresAtIso) {
      const expiresDateObj = new Date(expiresAtIso);
      if (!Number.isNaN(expiresDateObj.getTime())) {
        derivedDate = expiresDateObj.toISOString().slice(0, 10);
        derivedTime = expiresDateObj.toISOString().slice(11, 16);
      }
    }

    const mapped = {
      id: (row.id ?? row.uuid ?? '').toString() || Date.now().toString(),
      title: row.title ?? '',
      type: row.type ?? '',
      category: row.category ?? '',
      ownerId: (row.owner_id ?? row.ownerId ?? null) && (row.owner_id ?? row.ownerId ?? null).toString(),
      quantity: row.quantity ?? '',
      faceValue: row.faceValue ?? row.face_value ?? '',
      buyNow: row.buyNow ?? row.buy_now ?? '',
      expiresAt: expiresAtIso,
      deliveryMethod: row.deliveryMethod ?? row.delivery_method ?? '',
      swapPreferences: row.swapPreferences ?? row.swap_preferences ?? '',
      sellerName: row.sellerName ?? row.seller_name ?? '',
      sellerContact: row.sellerContact ?? row.seller_contact ?? '',
      location: row.location ?? '',
      urgency: row.urgency ?? '',
      description: row.description ?? '',
      images: parseImages(row.images ?? row.image_urls ?? null),
      imageUrl: row.imageUrl ?? row.image_url ?? null, // fallback for legacy data
      createdAt: toIsoString(row.createdAt ?? row.created_at) || new Date().toISOString()
    };
    mapped.expiresDate = derivedDate;
    mapped.expiresTime = derivedTime;
    return mapped;
  };

  const fetchListingsFromStore = async () => {
    if (!isSupabaseEnabled) return [];
    const { data, error } = await supabaseClient
      .from(listingsTableName)
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Failed to fetch listings from Supabase', error);
      return [];
    }
    return data.map(normalizeSupabaseListing).filter(Boolean);
  };

  const numberOrNull = value => {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };

  const combineDateTime = (dateStr, timeStr) => {
    if (!dateStr && !timeStr) return null;
    const safeTime = timeStr
      ? (timeStr.length === 5 ? `${timeStr}:00` : timeStr)
      : DEFAULT_DEADLINE_TIME_ISO;
    const safeDate = dateStr || (() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = `${now.getMonth() + 1}`.padStart(2, '0');
      const day = `${now.getDate()}`.padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();
    const combined = `${safeDate}T${safeTime}`;
    const result = new Date(combined);
    return Number.isNaN(result.getTime()) ? null : result.toISOString();
  };

  const ensureDefaultDeadlineTime = () => {
    if (listingTimeInput && !listingTimeInput.value) {
      listingTimeInput.value = DEFAULT_DEADLINE_TIME_INPUT;
    }
  };

  const persistListing = async data => {
    if (!isSupabaseEnabled) {
      return { ...data };
    }

    const hasValidId = isUuid(data.id);
    const payload = {
      id: hasValidId ? data.id : undefined,
      title: data.title ?? null,
      type: data.type ?? null,
      category: data.category ?? null,
      quantity: numberOrNull(data.quantity),
      face_value: numberOrNull(data.faceValue),
      buy_now: numberOrNull(data.buyNow),
      expires_at: data.expiresAt ?? null,
      delivery_method: data.deliveryMethod ?? null,
      swap_preferences: data.swapPreferences ?? null,
      seller_name: data.sellerName ?? null,
      seller_contact: data.sellerContact ?? null,
      location: data.location ?? null,
      urgency: data.urgency ?? null,
      description: data.description ?? null,
      images: data.images ?? null,
      owner_id: data.ownerId ?? null,
      created_at: data.createdAt ?? new Date().toISOString()
    };

    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) delete payload[key];
    });

    const query = supabaseClient.from(listingsTableName);
    const request = hasValidId
      ? query.upsert(payload, { onConflict: 'id' })
      : query.insert(payload);

    const { data: inserted, error } = await request.select().single();

    if (error) {
      console.error('Failed to persist listing to Supabase', error);
      throw error;
    }

    return normalizeSupabaseListing(inserted);
  };

  const uploadListingImages = async (files, listingId) => {
    if (!isStorageEnabled || !files || files.length === 0) return [];
    const safeId = listingId || Date.now().toString();

    const uploads = files.map(async (file, index) => {
      const sanitizedName = (file.name || `image-${index}`)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w.\-]+/g, '-');
      const storagePath = `${safeId}/${Date.now()}-${index}-${sanitizedName}`;
      const { error: uploadError } = await supabaseClient.storage
        .from(storageBucketName)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Supabase storage upload failed', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabaseClient.storage.from(storageBucketName).getPublicUrl(storagePath);
      const publicUrl = urlData?.publicUrl || null;

      return {
        url: publicUrl,
        path: storagePath,
        name: file.name || sanitizedName
      };
    });

    return Promise.all(uploads);
  };

  // 應用程式狀態 (所有刊登資料)
  const listings = [];
  const upsertListing = newListing => {
    if (!newListing) return;
    const normalizedListing = normalizeSupabaseListing(newListing) || newListing;
    const targetId = normalizedListing.id;
    const existingIndex = listings.findIndex(item => (item.id ? item.id.toString() : '') === targetId);
    if (existingIndex >= 0) {
      listings[existingIndex] = normalizedListing;
    } else {
      listings.push(normalizedListing);
    }
  };

  function updateImageModal() {
    if (!imageModalRoot || !imageModalImage) return;
    const { images, index } = modalState;
    const current = images[index];
    if (!current) {
      closeImageModal();
      return;
    }
    imageModalImage.src = current.url;
    imageModalImage.alt = current.name || `圖片 ${index + 1}`;
    if (imageModalCounter) {
      imageModalCounter.textContent = `${index + 1} / ${images.length}`;
    }
    const disabled = images.length <= 1;
    if (imageModalPrev) imageModalPrev.disabled = disabled;
    if (imageModalNext) imageModalNext.disabled = disabled;
  }

  function openImageModal(images, startIndex = 0) {
    if (!imageModalRoot) return;
    const filtered = Array.isArray(images) ? images.filter(img => img && img.url) : [];
    if (!filtered.length) return;
    modalState = {
      images: filtered,
      index: Math.min(Math.max(startIndex, 0), filtered.length - 1)
    };
    imageModalRoot.classList.add('is-visible');
    imageModalRoot.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    updateImageModal();
  }

  function closeImageModal() {
    if (!imageModalRoot) return;
    imageModalRoot.classList.remove('is-visible');
    imageModalRoot.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (imageModalImage) {
      imageModalImage.src = '';
      imageModalImage.alt = '';
    }
    modalState = { images: [], index: 0 };
  }

  function changeModalImage(direction) {
    if (!modalState.images.length) return;
    modalState.index = (modalState.index + direction + modalState.images.length) % modalState.images.length;
    updateImageModal();
  }

  function handleModalKeydown(event) {
    if (!imageModalRoot || !imageModalRoot.classList.contains('is-visible')) return;
    if (event.key === 'Escape') {
      closeImageModal();
    } else if (event.key === 'ArrowLeft') {
      changeModalImage(-1);
    } else if (event.key === 'ArrowRight') {
      changeModalImage(1);
    }
  }

  /**
   * 根據資料建立一個刊登卡片元素
   * @param {object} data - 刊登資料
   * @returns {HTMLElement} - 建立好的卡片元素
   */
  function createListingCard(data) {
    const card = listingTemplate.content.firstElementChild.cloneNode(true);
    const media = card.querySelector('.listing-card-media');
    const fallback = card.querySelector('.listing-card-fallback');
    const fallbackInitial = fallback ? fallback.querySelector('.fallback-initial') : null;
    const badgesContainer = card.querySelector('.listing-card-badges');
    const titleEl = card.querySelector('.listing-card-title');
    const metaEl = card.querySelector('.listing-card-meta');
    const descriptionEl = card.querySelector('.listing-card-description');
    const publishedEl = card.querySelector('.listing-card-published');
    const priceValueEl = card.querySelector('.price-value');
    const actionBtn = card.querySelector('.listing-card-action');
    const favoriteButton = card.querySelector('.listing-card-favorite');
    const galleryTrigger = card.querySelector('.listing-card-gallery');
    const galleryCount = card.querySelector('.listing-card-gallery-count');
    const sliderWrapper = card.querySelector('.listing-card-slider');
    const sliderTrack = card.querySelector('.listing-card-slider-track');
    const sliderNavPrev = card.querySelector('.listing-card-nav-prev');
    const sliderNavNext = card.querySelector('.listing-card-nav-next');
    const ownerMenuWrapper = card.querySelector('.listing-card-owner-menu');
    const ownerMenuTrigger = ownerMenuWrapper ? ownerMenuWrapper.querySelector('.owner-menu-trigger') : null;
    const ownerMenu = ownerMenuWrapper ? ownerMenuWrapper.querySelector('.owner-menu') : null;
    const editBtn = card.querySelector('.listing-card-edit');
    const deleteBtn = card.querySelector('.listing-card-delete');

    const imageList = (() => {
      const images = parseImages(data.images);
      if (images.length) return images;
      if (data.imageUrl) {
        return [{ url: data.imageUrl, name: data.imageName || data.title || 'listing-image' }];
      }
      return [];
    })();

    if (media) {
      media.style.background = getCategoryBackground(data.category);
    }

    card.addEventListener('click', () => {
      navigateToListingDetail(data);
    });
    card.style.cursor = 'pointer';
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigateToListingDetail(data);
      }
    });

    if (favoriteButton) {
      const fav = isFavorite(data.id);
      favoriteButton.classList.toggle('is-active', fav);
      favoriteButton.setAttribute('aria-pressed', fav ? 'true' : 'false');
      favoriteButton.setAttribute('aria-label', fav ? '從我的最愛移除' : '加入我的最愛');
      favoriteButton.title = fav ? '從我的最愛移除' : '加入我的最愛';
      favoriteButton.addEventListener('click', event => {
        event.stopPropagation();
        toggleFavorite(data.id);
      });
    }

    
    const currentUser = getSessionUser();
    const isMyListingsView = activeCategory === MY_LISTINGS_CATEGORY;
    const isOwner = Boolean(currentUser && data.ownerId && currentUser.id === data.ownerId && isMyListingsView);

    if (ownerMenuWrapper) {
      ownerMenuWrapper.hidden = !isOwner;
      if (!isOwner && ownerMenu) {
        ownerMenu.classList.remove('is-open');
      }
    }
    if (isOwner && ownerMenu && ownerMenuTrigger) {
      const closeMenu = () => {
        ownerMenu.classList.remove('is-open');
        ownerMenuTrigger.setAttribute('aria-expanded', 'false');
      };
      ownerMenuTrigger.addEventListener('click', event => {
        event.stopPropagation();
        const isOpen = ownerMenu.classList.toggle('is-open');
        ownerMenuTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      document.addEventListener('click', () => closeMenu(), { once: false });
      ownerMenu.addEventListener('click', event => event.stopPropagation());
      if (editBtn) {
        editBtn.addEventListener('click', event => {
          event.stopPropagation();
          ownerMenu.classList.remove('is-open');
          beginEditListing(data);
        });
      }
      if (deleteBtn) {
        deleteBtn.addEventListener('click', event => {
          event.stopPropagation();
          ownerMenu.classList.remove('is-open');
          deleteListing(data);
        });
      }
    }

    if (sliderWrapper && sliderTrack) {
      sliderTrack.innerHTML = '';
      if (imageList.length) {
        sliderWrapper.hidden = false;
        card.classList.add('has-image');
        imageList.forEach((imageData, index) => {
          if (!imageData || !imageData.url) return;
          const slide = document.createElement('button');
          slide.type = 'button';
          slide.className = 'listing-card-slide';
          slide.setAttribute('aria-label', `查看詳情（圖片 ${index + 1}）`);
          const slideImg = document.createElement('img');
          slideImg.src = imageData.url;
          slideImg.alt = imageData.name || data.title || `刊登圖片 ${index + 1}`;
          slideImg.loading = 'lazy';
          slide.appendChild(slideImg);
          slide.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            navigateToListingDetail(data);
          });
          sliderTrack.appendChild(slide);
        });

        let currentIndex = 0;
        const showNav = imageList.length > 1;
        const updateNavState = () => {
          if (sliderNavPrev) {
            sliderNavPrev.hidden = !showNav;
            sliderNavPrev.disabled = !showNav || currentIndex === 0;
          }
          if (sliderNavNext) {
            sliderNavNext.hidden = !showNav;
            sliderNavNext.disabled = !showNav || currentIndex === imageList.length - 1;
          }
        };
        const scrollToIndex = newIndex => {
          const clamped = Math.max(0, Math.min(imageList.length - 1, newIndex));
          currentIndex = clamped;
          const targetLeft = sliderWrapper.clientWidth * clamped;
          if (typeof sliderWrapper.scrollTo === 'function') {
            sliderWrapper.scrollTo({
              left: targetLeft,
              behavior: 'smooth'
            });
          } else {
            sliderWrapper.scrollLeft = targetLeft;
          }
          updateNavState();
        };
        sliderWrapper.scrollLeft = 0;
        updateNavState();
        if (sliderNavPrev) {
          sliderNavPrev.addEventListener('click', event => {
            event.stopPropagation();
            scrollToIndex(currentIndex - 1);
          });
        }
        if (sliderNavNext) {
          sliderNavNext.addEventListener('click', event => {
            event.stopPropagation();
            scrollToIndex(currentIndex + 1);
          });
        }

        let scrollDebounce;
        sliderWrapper.addEventListener('scroll', () => {
          if (!imageList.length) return;
          if (scrollDebounce) clearTimeout(scrollDebounce);
          scrollDebounce = setTimeout(() => {
            const index = Math.round(sliderWrapper.scrollLeft / Math.max(sliderWrapper.clientWidth, 1));
            if (index !== currentIndex) {
              currentIndex = Math.max(0, Math.min(imageList.length - 1, index));
              updateNavState();
            }
          }, 80);
        });
      } else {
        sliderWrapper.hidden = true;
        card.classList.remove('has-image');
        if (sliderNavPrev) sliderNavPrev.hidden = true;
        if (sliderNavNext) sliderNavNext.hidden = true;
      }
    }

    if (!imageList.length && fallbackInitial) {
      const initial = (data.category || data.title || '票').trim().charAt(0);
      fallbackInitial.textContent = initial ? initial.toUpperCase() : '票';
      if (fallback) {
        fallback.style.background = getCategoryBackground(data.category);
      }
    }

    if (titleEl) {
      titleEl.textContent = data.title || '未命名票券';
    }

    if (metaEl) {
      const metaParts = [];
      if (data.category) metaParts.push(data.category);
      if (data.quantity) metaParts.push(`數量 ${data.quantity}`);
      if (data.deliveryMethod) metaParts.push(formatDeliveryMethod(data.deliveryMethod));
      if (data.location) metaParts.push(data.location);
      if (data.expiresAt) metaParts.push(`截止 ${formatDateValue(data.expiresAt)}`);
      metaEl.innerHTML = '';
      metaEl.classList.toggle('is-empty', metaParts.length === 0);
      if (metaParts.length === 0) {
        metaEl.textContent = '活動資訊整理中';
      } else {
        metaParts.forEach(part => {
          const tag = document.createElement('span');
          tag.textContent = part;
          metaEl.appendChild(tag);
        });
      }
    }

    if (descriptionEl) {
      if (data.description && data.description.trim()) {
        descriptionEl.textContent = data.description.trim();
      } else if (data.swapPreferences) {
        descriptionEl.textContent = `交換偏好：${data.swapPreferences}`;
      } else if (data.sellerContact) {
        descriptionEl.textContent = `聯絡方式：${data.sellerContact}`;
      } else {
        descriptionEl.textContent = '暫無補充資訊。';
      }
    }

    if (publishedEl) {
      const createdAtValue = data.createdAt ?? data.created_at ?? null;
      publishedEl.textContent = createdAtValue
        ? `發佈：${formatDateTimeValue(createdAtValue)}`
        : '發佈：—';
    }

    if (priceValueEl) {
      if (data.buyNow) {
        priceValueEl.textContent = `NT$ ${Number(data.buyNow).toLocaleString()}`;
      } else if (data.faceValue) {
        priceValueEl.textContent = `原價 NT$ ${Number(data.faceValue).toLocaleString()}`;
      } else {
        priceValueEl.textContent = '面議';
      }
    }


    if (actionBtn) {
      actionBtn.textContent = '查看詳情';
      actionBtn.addEventListener('click', event => {
        event.stopPropagation();
        navigateToListingDetail(data);
      });
    }

    if (galleryTrigger) {
      const canPreview = imageModalRoot && imageList.length > 0;
      if (canPreview) {
        galleryTrigger.hidden = false;
        const label = imageList.length > 1 ? `${imageList.length} 張` : '1 張';
        if (galleryCount) {
          galleryCount.textContent = label;
        }
        const previewLabel = `預覽 ${label}圖片`;
        galleryTrigger.setAttribute('aria-label', previewLabel);
        galleryTrigger.title = previewLabel;
        galleryTrigger.addEventListener('click', event => {
          event.stopPropagation();
          openImageModal(imageList, 0);
        });
      } else {
        galleryTrigger.hidden = true;
      }
    }

    if (badgesContainer) {
      badgesContainer.innerHTML = '';
      const typeMap = { auction: '出價', transfer: '讓票', swap: '交換' };
      const typeClassMap = { auction: 'badge-auction', transfer: 'badge-transfer', swap: 'badge-swap' };
      if (data.type && typeMap[data.type]) {
        const typeBadge = document.createElement('span');
        const typeClass = typeClassMap[data.type] || '';
        typeBadge.className = `badge ${typeClass}`.trim();
        typeBadge.textContent = typeMap[data.type];
        badgesContainer.appendChild(typeBadge);
      }
      if (data.urgency === 'urgent') {
        const urgencyBadge = document.createElement('span');
        urgencyBadge.className = 'badge badge-urgent';
        urgencyBadge.textContent = '超急';
        badgesContainer.appendChild(urgencyBadge);
      }
    }

        if (card && media && !imageList.length) {
      card.classList.add('is-placeholder');
    }

    return card;
  }

  function scrollToListingForm() {
    if (!listingForm || !listingFormPanel) return;
    if (!ensureAuthenticated({ view: 'signup', reason: '登入後即可建立新的刊登。' })) {
      return;
    }
    hideCategoryPanel();
    showListingForm();
    listingFormPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const focusable = listingForm.querySelector('input, select, textarea');
    if (focusable && typeof focusable.focus === 'function') {
      focusable.focus({ preventScroll: true });
    }
  }

  function scrollToCategoryPanel() {
    if (!categoryPanel) return;
    showCategoryPanel();
    categoryPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetPagination() {
    currentPage = 1;
  }

  /**
   * 重設篩選器輸入欄位
   */
  function updatePaginationControls({ totalItems, startIndex, visibleCount }) {
    if (!paginationRoot) return;
    const shouldShow = totalItems > LISTINGS_PER_PAGE;
    paginationRoot.hidden = !shouldShow;
    if (!shouldShow) {
      if (paginationInfo) paginationInfo.textContent = '';
      if (paginationPageDisplay) paginationPageDisplay.textContent = '';
      if (paginationPrev) paginationPrev.disabled = true;
      if (paginationNext) paginationNext.disabled = true;
      return;
    }
    const safeVisible = Math.max(visibleCount || 0, 0);
    const start = startIndex + 1;
    const end = Math.min(totalItems, startIndex + safeVisible);
    if (paginationInfo) {
      paginationInfo.textContent = `第 ${start}-${end} 筆，共 ${totalItems} 筆`;
    }
    if (paginationPageDisplay) {
      paginationPageDisplay.textContent = `第 ${currentPage} / ${totalPages} 頁`;
    }
    if (paginationPrev) {
      paginationPrev.disabled = currentPage <= 1;
    }
    if (paginationNext) {
      paginationNext.disabled = currentPage >= totalPages;
    }
  }

  function resetFilters() {
    if (filterType) filterType.value = 'all';
    if (filterSearch) filterSearch.value = '';
    if (filterQuantityMin) filterQuantityMin.value = '';
    if (filterDelivery) filterDelivery.value = 'all';
    if (filterCreatedStart) filterCreatedStart.value = '';
    if (filterCreatedEnd) filterCreatedEnd.value = '';
    if (filterExpiresStart) filterExpiresStart.value = '';
    if (filterExpiresEnd) filterExpiresEnd.value = '';
    setActiveCategory(activeCategory, { syncSelect: true, syncNav: true });
    renderListings({ resetPage: true });
  }

  /**
   * 根據目前的篩選器和搜尋條件，渲染刊登列表
   */
  function renderListings(options = {}) {
    if (!listingsContainer) return;
    const { resetPage = false } = options;
    const typeValue = filterType ? filterType.value : 'all';
    const navCategory = activeCategory || 'all';
    const useSelectCategory = navCategory !== MY_LISTINGS_CATEGORY && navCategory !== FAVORITES_CATEGORY;
    const categoryValue = useSelectCategory && filterCategory
      ? (filterCategory.value || navCategory)
      : navCategory;
    const sessionUser = getSessionUser();
    const sessionUserId = sessionUser ? sessionUser.id : null;
    const searchTerm = filterSearch && filterSearch.value ? filterSearch.value.toLowerCase() : '';
    const quantityMinValue = filterQuantityMin && filterQuantityMin.value !== ''
      ? Number(filterQuantityMin.value)
      : Number.NaN;
    const hasQuantityFilter = Number.isFinite(quantityMinValue) && quantityMinValue > 0;
    const deliveryValue = filterDelivery ? filterDelivery.value : 'all';
    const createdStartRaw = filterCreatedStart ? filterCreatedStart.value : '';
    const createdEndRaw = filterCreatedEnd ? filterCreatedEnd.value : '';
    const expiresStartRaw = filterExpiresStart ? filterExpiresStart.value : '';
    const expiresEndRaw = filterExpiresEnd ? filterExpiresEnd.value : '';
    const createdStartValue = createdStartRaw
      ? parseDate(createdStartRaw)
      : null;
    const createdEndValue = createdEndRaw
      ? adjustEndOfDay(parseDate(createdEndRaw), createdEndRaw)
      : null;
    const expiresStartValue = expiresStartRaw
      ? parseDate(expiresStartRaw)
      : null;
    const expiresEndValue = expiresEndRaw
      ? adjustEndOfDay(parseDate(expiresEndRaw), expiresEndRaw)
      : null;

    // 根據條件過濾刊登
    const filteredListings = listings.filter(listing => {
      const lowerTitle = listing.title ? listing.title.toLowerCase() : '';
      const lowerDescription = listing.description ? listing.description.toLowerCase() : '';
      const lowerSellerName = listing.sellerName ? listing.sellerName.toLowerCase() : '';
      const lowerLocation = listing.location ? listing.location.toLowerCase() : '';
      const typeMatch = typeValue === 'all' || listing.type === typeValue;
      let categoryMatch = true;
      if (categoryValue === MY_LISTINGS_CATEGORY) {
        categoryMatch = Boolean(sessionUserId && listing.ownerId && sessionUserId === listing.ownerId);
      } else if (categoryValue === FAVORITES_CATEGORY) {
        categoryMatch = Boolean(sessionUserId && isFavorite(listing.id));
      } else {
        categoryMatch = categoryValue === 'all' || listing.category === categoryValue;
      }
      const searchMatch = !searchTerm ||
        lowerTitle.includes(searchTerm) ||
        lowerDescription.includes(searchTerm) ||
        lowerSellerName.includes(searchTerm) ||
        lowerLocation.includes(searchTerm);
      const rawQuantity = listing.quantity ?? null;
      const numericQuantity = typeof rawQuantity === 'number' ? rawQuantity : Number(rawQuantity);
      const quantityMatch = !hasQuantityFilter || (!Number.isNaN(numericQuantity) && numericQuantity >= quantityMinValue);
      const deliveryMatch = deliveryValue === 'all' || listing.deliveryMethod === deliveryValue;
      const createdDate = parseDate(listing.createdAt ?? listing.created_at ?? null);
      const createdStartMatch = !createdStartValue || (createdDate && createdDate >= createdStartValue);
      const createdEndMatch = !createdEndValue || (createdDate && createdDate <= createdEndValue);
      const createdMatch = createdStartMatch && createdEndMatch;
      const expiresDate = parseDate(listing.expiresAt ?? listing.expires_at ?? null);
      const expiresStartMatch = !expiresStartValue || (expiresDate && expiresDate >= expiresStartValue);
      const expiresEndMatch = !expiresEndValue || (expiresDate && expiresDate <= expiresEndValue);
      const expiresMatch = expiresStartMatch && expiresEndMatch;
      return typeMatch && categoryMatch && searchMatch && quantityMatch && deliveryMatch && createdMatch && expiresMatch;
    });
    const sortedListings = filteredListings.slice().reverse();

    if (resetPage) {
      resetPagination();
    }
    const totalListings = sortedListings.length;
    totalPages = Math.max(1, Math.ceil(totalListings / LISTINGS_PER_PAGE));
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = totalListings ? (currentPage - 1) * LISTINGS_PER_PAGE : 0;
    const pageListings = totalListings
      ? sortedListings.slice(startIndex, startIndex + LISTINGS_PER_PAGE)
      : [];
    updatePaginationControls({
      totalItems: totalListings,
      startIndex,
      visibleCount: pageListings.length
    });

    // 清空目前的列表並插入建立刊登卡片
    listingsContainer.innerHTML = '';

    // 顯示結果
    if (pageListings.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = '沒有找到符合條件的刊登。';
      listingsContainer.appendChild(empty);
      return;
    }

    // 從最新到最舊顯示
    pageListings.forEach(listingData => {
      const card = createListingCard(listingData);
      listingsContainer.appendChild(card);
    });

    const scrollContainer = categoryPanel?.closest('.app-content') || categoryPanel;
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }

  /**
   * 顯示一個提示訊息 (Toast)
   * @param {string} message - 要顯示的訊息
   */
  function showToast(message) {
    const toastRoot = document.getElementById('toast-root');
    if (!toastRoot) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastRoot.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-visible');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('toast-visible');
      toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
  }

  /**
   * 處理表單提交
   * @param {Event} event - 提交事件
   */
  async function handleFormSubmit(event) {
    event.preventDefault();
    if (!ensureAuthenticated({ view: 'login', reason: '請先登入會員再提交刊登。' })) {
      return;
    }

    const formData = new FormData(listingForm);
    const imageFiles = listingImageInput && listingImageInput.files
      ? Array.from(listingImageInput.files).filter(file => file && file.size > 0)
      : [];
    const isEditing = Boolean(editingListingId);

    if (imageFiles.length > MAX_IMAGE_COUNT) {
      showToast(`最多可上傳 ${MAX_IMAGE_COUNT} 張圖片。`);
      return;
    }

    for (const file of imageFiles) {
      if (!file.type.startsWith('image/')) {
        showToast('請選擇圖片檔案。');
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        showToast('圖片過大，請限制在 5MB 以內。');
        return;
      }
    }

    if (imageFiles.length && !isStorageEnabled) {
      showToast('目前尚未啟用圖片上傳，請移除檔案或稍後再試。');
      return;
    }

    formData.delete('listing-images');

    const data = Object.fromEntries(formData.entries());
    data.id = isEditing ? editingListingId : Date.now().toString();
    data.createdAt = isEditing
      ? (editingListingOriginal?.createdAt || editingListingOriginal?.created_at || new Date().toISOString())
      : new Date().toISOString();
    data.expiresAt = combineDateTime(data.expiresDate, data.expiresTime);
    const sessionUser = getSessionUser();
    data.ownerId = sessionUser ? sessionUser.id : (editingListingOriginal?.ownerId || null);

    data.images = [];

    if (imageFiles.length && isStorageEnabled) {
      try {
        const uploadedImages = await uploadListingImages(imageFiles, data.id);
        if (uploadedImages && uploadedImages.length) {
          data.images = uploadedImages;
        }
      } catch (error) {
        console.error('Image upload failed', error);
        showToast('圖片上傳失敗，將不附帶圖片。');
      }
    }

    if (!data.images.length && isEditing && editingListingOriginal?.images) {
      data.images = editingListingOriginal.images;
    }
    if (!data.images.length) {
      delete data.images;
    }
    if (isEditing && editingListingOriginal?.imageUrl) {
      data.imageUrl = editingListingOriginal.imageUrl;
    }

    try {
      const storedListing = await persistListing(data);
      upsertListing(storedListing);
      renderListings();
      listingForm.reset();
      if (listingImageInput) listingImageInput.value = '';
      ensureDefaultDeadlineTime();
      clearEditingState();
      const nextCategory = isEditing ? MY_LISTINGS_CATEGORY : 'all';
      setActiveCategory(nextCategory, {
        syncSelect: nextCategory !== MY_LISTINGS_CATEGORY && nextCategory !== FAVORITES_CATEGORY,
        syncNav: true
      });
      showCategoryPanel();
      showToast(isEditing ? '刊登已更新！' : '刊登已成功發布！');
      const target = categoryPanel || listingsContainer.parentElement;
      if (target && target.scrollIntoView) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      console.error('Failed to save listing to Supabase', error);
      upsertListing(data);
      renderListings();
      if (!isEditing) {
        data.id = Date.now().toString();
      }
      setActiveCategory('all', { syncSelect: true, syncNav: true });
      showCategoryPanel();
      showToast('暫時無法儲存到雲端，資料已存於此頁面。');
      const target = categoryPanel || listingsContainer.parentElement;
      if (target && target.scrollIntoView) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  async function loadInitialListings() {
    if (!isSupabaseEnabled) return;
    try {
      const remoteListings = await fetchListingsFromStore();
      const existingIds = new Set(listings.map(item => (item.id ? item.id.toString() : '')));
      remoteListings.forEach(item => {
        const itemId = item.id ? item.id.toString() : '';
        if (!existingIds.has(itemId)) {
          upsertListing(item);
        }
      });
      renderListings();
    } catch (error) {
      console.error('Failed to load listings from Supabase', error);
      showToast('無法從雲端載入資料，顯示暫存內容。');
    }
  }

  /**
   * 初始化應用程式
   */
  function initialize() {
    const initialCategory = filterCategory ? (filterCategory.value || 'all') : 'all';
    ensureDefaultDeadlineTime();
    setActiveCategory(initialCategory, { syncSelect: true, syncNav: true });
    showCategoryPanel();
    renderListings();
    loadInitialListings();

    // 綁定表單和篩選器事件
    if (listingForm) {
      listingForm.addEventListener('submit', handleFormSubmit);
      listingForm.addEventListener('reset', () => {
        clearEditingState();
        setTimeout(ensureDefaultDeadlineTime, 0);
      });
    }
    if (listingCancelButton) {
      listingCancelButton.addEventListener('click', cancelListingEdit);
    }
    const rerenderWithReset = () => renderListings({ resetPage: true });
    if (filterType) filterType.addEventListener('change', rerenderWithReset);
    if (filterSearch) filterSearch.addEventListener('input', rerenderWithReset);
    if (filterQuantityMin) filterQuantityMin.addEventListener('input', rerenderWithReset);
    if (filterDelivery) filterDelivery.addEventListener('change', rerenderWithReset);
    if (filterCreatedStart) filterCreatedStart.addEventListener('change', rerenderWithReset);
    if (filterCreatedEnd) filterCreatedEnd.addEventListener('change', rerenderWithReset);
    if (filterExpiresStart) filterExpiresStart.addEventListener('change', rerenderWithReset);
    if (filterExpiresEnd) filterExpiresEnd.addEventListener('change', rerenderWithReset);
    if (filterClear) filterClear.addEventListener('click', resetFilters);
    if (filterCategory) {
      filterCategory.addEventListener('change', event => {
        const selectedValue = event.target.value || 'all';
        setActiveCategory(selectedValue, { syncSelect: false, syncNav: true });
        showCategoryPanel();
        renderListings();
        scrollToCategoryPanel();
      });
    }

    if (sidebarAction) {
      sidebarAction.addEventListener('click', scrollToListingForm);
    }

    Array.from(sidebarCategoryButtons || []).forEach(button => {
      button.addEventListener('click', () => {
        const categoryValue = button.dataset.category || 'all';
        if ((categoryValue === MY_LISTINGS_CATEGORY || categoryValue === FAVORITES_CATEGORY) && !getSessionUser()) {
          openMemberModal('login');
          setMemberMessage('請先登入會員以查看此區域。', { variant: 'warning' });
          return;
        }
        setActiveCategory(categoryValue, { syncSelect: true, syncNav: true });
        showCategoryPanel();
        renderListings();
        scrollToCategoryPanel();
      });
    });

    if (paginationPrev) {
      paginationPrev.addEventListener('click', () => {
        if (currentPage <= 1) return;
        currentPage -= 1;
        renderListings();
        scrollToCategoryPanel();
      });
    }

    if (paginationNext) {
      paginationNext.addEventListener('click', () => {
        if (currentPage >= totalPages) return;
        currentPage += 1;
        renderListings();
        scrollToCategoryPanel();
      });
    }

    if (imageModalClose) imageModalClose.addEventListener('click', closeImageModal);
    if (imageModalBackdrop) imageModalBackdrop.addEventListener('click', closeImageModal);
    if (imageModalPrev) imageModalPrev.addEventListener('click', () => changeModalImage(-1));
    if (imageModalNext) imageModalNext.addEventListener('click', () => changeModalImage(1));
    document.addEventListener('keydown', handleModalKeydown);
  }

  initializeMembership();
  // 啟動應用程式
  initialize();
});
