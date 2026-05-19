import zhTW from './zh-TW.js';
import en from './en.js';

const translations = {
  'zh-TW': zhTW,
  'zh': zhTW,
  'en': en
};

const SUPPORTED = ['en', 'zh-TW', 'zh'];
const STORAGE_KEY = 'locale';
const browserLang = navigator.language;
const defaultLocale = 'en';

function getStoredLocale() {
  return localStorage.getItem(STORAGE_KEY);
}

function getBestMatchLocale() {
  const stored = getStoredLocale();
  if (stored && SUPPORTED.includes(stored)) return stored;

  const browserPrefix = browserLang.startsWith('zh') ? 'zh' : 'en';
  return browserPrefix;
}

let currentLocale = getBestMatchLocale();

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  if (!SUPPORTED.includes(locale)) return false;
  currentLocale = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  return true;
}

export function t(key) {
  const trans = translations[currentLocale] || translations[defaultLocale];
  const keys = key.split('.');
  let value = trans;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }
  return typeof value === 'string' ? value : key;
}

export function initI18n() {
  const best = getBestMatchLocale();
  setLocale(best);
  return best;
}

export function updateStaticContent() {
  const locale = getLocale();
  const isZh = locale.startsWith('zh');

  // Sidebar - category buttons
  document.querySelectorAll('[data-category]').forEach(btn => {
    const span = btn.querySelector('span:last-child');
    if (!span) return;
    const text = span.textContent.trim();
    if (isZh) {
      if (text === 'All Tickets') span.textContent = '全部票券';
      else if (text === 'Concert') span.textContent = '演唱會';
      else if (text === 'Sports') span.textContent = '體育賽事';
      else if (text === 'Theater') span.textContent = '戲劇舞台';
      else if (text === 'Show / Event') span.textContent = '綜藝活動';
      else if (text === 'Exhibition / Market') span.textContent = '展覽 / 市集';
      else if (text === 'Collectibles / Merchandise') span.textContent = '收藏品 / 周邊';
      else if (text === 'Other') span.textContent = '其他類別';
      else if (text === 'My Listings') span.textContent = '我的刊登';
      else if (text === 'My Favorites') span.textContent = '我的最愛';
      else if (text === 'My Messages') span.textContent = '我的訊息';
    } else {
      if (text === '全部票券') span.textContent = 'All Tickets';
      else if (text === '演唱會') span.textContent = 'Concert';
      else if (text === '體育賽事') span.textContent = 'Sports';
      else if (text === '戲劇舞台') span.textContent = 'Theater';
      else if (text === '綜藝活動') span.textContent = 'Show / Event';
      else if (text === '展覽 / 市集') span.textContent = 'Exhibition / Market';
      else if (text === '收藏品 / 周邊') span.textContent = 'Collectibles / Merchandise';
      else if (text === '其他類別') span.textContent = 'Other';
      else if (text === '我的刊登') span.textContent = 'My Listings';
      else if (text === '我的最愛') span.textContent = 'My Favorites';
      else if (text === '我的訊息') span.textContent = 'My Messages';
    }
  });

  // Sidebar personal label
  const personalLabel = document.querySelector('.sidebar-personal-label');
  if (personalLabel) personalLabel.textContent = isZh ? '會員空間' : 'Member Area';

  // Sidebar create button
  const createBtn = document.querySelector('[data-scroll-target="#listing-form-panel"]');
  if (createBtn) createBtn.textContent = isZh ? '+ 建立刊登' : '+ Create Listing';

  // Sidebar footer
  const footer = document.querySelector('.sidebar-footer');
  if (footer) footer.textContent = isZh ? '建議回饋：matsuri.tsai@gmail.com' : 'Feedback: matsuri.tsai@gmail.com';

  // Topbar login button
  const memberBtn = document.querySelector('[data-member-trigger]');
  if (memberBtn && memberBtn.dataset.memberState !== 'signed-in') {
    memberBtn.textContent = isZh ? '登入 / 註冊' : 'Login / Register';
  }

  // Account menu items
  const profileLink = document.querySelector('a[href="/profile"]');
  if (profileLink) profileLink.textContent = isZh ? '會員資料' : 'Profile';
  document.querySelectorAll('[data-account-logout]').forEach(btn => {
    btn.textContent = isZh ? '會員登出' : 'Logout';
  });

  // Panel headings
  const formPanelTitle = document.querySelector('#listing-form-panel h2');
  if (formPanelTitle) formPanelTitle.textContent = isZh ? '建立刊登' : 'Create Listing';
  const formPanelSubtitle = document.querySelector('#listing-form-panel .panel-subtitle');
  if (formPanelSubtitle) formPanelSubtitle.textContent = isZh ? '填寫票券資訊、上傳圖片並提交，讓買家立即找到你。' : 'Fill in ticket info, upload images and submit to help buyers find you.';

  const messagesPanelTitle = document.querySelector('#messages-panel h2');
  if (messagesPanelTitle) messagesPanelTitle.textContent = isZh ? '我的訊息' : 'My Messages';
  const messagesPanelSubtitle = document.querySelector('#messages-panel .panel-subtitle');
  if (messagesPanelSubtitle) messagesPanelSubtitle.textContent = isZh ? '查看買家對您刊登的詢問。' : 'View inquiries from buyers on your listings.';

  const categoryPanelTitle = document.querySelector('#category-panel-title');
  if (categoryPanelTitle) categoryPanelTitle.textContent = isZh ? '全部票券' : 'All Tickets';
  const categoryPanelSubtitle = document.querySelector('#category-panel-subtitle');
  if (categoryPanelSubtitle) categoryPanelSubtitle.textContent = isZh ? '選擇左側類別以查看對應的刊登與篩選工具。' : 'Select a category on the left to browse listings.';

  // Form labels
  const labels = {
    'listing-title': isZh ? '刊登標題' : 'Listing Title',
    'listing-quantity': isZh ? '數量' : 'Quantity',
    'listing-type': isZh ? '刊登類型' : 'Listing Type',
    'listing-category': isZh ? '票券類型' : 'Category',
    'buy-now': isZh ? '商品價格（選填）' : 'Price (optional)',
    'delivery-method': isZh ? '交付方式' : 'Delivery Method',
    'listing-urgency': isZh ? '急迫程度' : 'Urgency',
    'listing-date': isZh ? '截止日期' : 'Deadline',
    'listing-time': isZh ? '截止時間' : 'Time',
    'listing-location': isZh ? '交易地點' : 'Location',
    'swap-lookfor': isZh ? '交換偏好（若刊登類型為交換）' : 'Swap Preferences (if listing type is Swap)',
    'listing-description': isZh ? '其他資訊（選填）' : 'Additional Info (optional)',
    'listing-images': isZh ? '上傳圖片（最多 6 張）' : 'Upload Images (max 6)'
  };
  Object.entries(labels).forEach(([id, text]) => {
    const el = document.querySelector(`[for="${id}"]`);
    if (el) el.textContent = text;
  });

  // Placeholders
  const placeholders = {
    'listing-title': isZh ? '例如：Taylor Swift VIP席位' : 'e.g., Taylor Swift VIP Seat',
    'buy-now': isZh ? '例如：2200' : 'e.g., 2200',
    'listing-description': isZh ? '座位資訊' : 'Seat information',
    'filter-search': isZh ? '搜尋...' : 'Search...',
    'filter-quantity-min': isZh ? '至少' : 'Min'
  };
  Object.entries(placeholders).forEach(([id, text]) => {
    const el = document.querySelector(`#${id}`);
    if (el) el.placeholder = text;
  });

  // Select options
  const selectTexts = {
    'listing-type': { '': isZh ? '請選擇' : 'Select', 'auction': isZh ? '出售' : 'For Sale', 'transfer': isZh ? '讓票' : 'Transfer', 'swap': isZh ? '交換' : 'Swap', 'request': isZh ? '求票' : 'Request' },
    'listing-category': { '': isZh ? '請選擇' : 'Select', '演唱會': '演唱會', '體育賽事': '體育賽事', '戲劇舞台': '戲劇舞台', '綜藝活動': '綜藝活動', '展覽 / 市集': '展覽 / 市集', '收藏品 / 周邊': '收藏品 / 周邊', '其他': isZh ? '其他（請於詳細資訊補充）' : 'Other (add details below)' },
    'delivery-method': { 'meetup': isZh ? '面交' : 'Meetup', 'shipping': isZh ? '寄件' : 'Shipping' },
    'listing-urgency': { 'normal': isZh ? '一般' : 'Normal', 'urgent': isZh ? '超急' : 'Urgent' },
    'filter-type': { 'all': isZh ? '全部' : 'All', 'auction': isZh ? '出售' : 'For Sale', 'transfer': isZh ? '讓票' : 'Transfer', 'swap': isZh ? '交換' : 'Swap', 'request': isZh ? '求票' : 'Request' },
    'filter-delivery': { 'all': isZh ? '全部' : 'All', 'meetup': isZh ? '面交' : 'Meetup', 'shipping': isZh ? '寄件' : 'Shipping' }
  };
  Object.entries(selectTexts).forEach(([selectId, options]) => {
    const select = document.querySelector(`#${selectId}`);
    if (!select) return;
    Array.from(select.options).forEach(opt => {
      if (options[opt.value] !== undefined) opt.textContent = options[opt.value];
    });
  });

  // Filter labels
  const filterLabels = {
    'filter-type': isZh ? '刊登類型' : 'Listing Type',
    'filter-delivery': isZh ? '交付方式' : 'Delivery Method',
    'filter-quantity-min': isZh ? '數量' : 'Quantity',
    'filter-created-start': isZh ? '發佈日期' : 'Publish Date',
    'filter-expires-start': isZh ? '截止日期' : 'Expires Date',
    'filter-search': isZh ? '搜尋' : 'Search'
  };
  Object.entries(filterLabels).forEach(([id, text]) => {
    const el = document.querySelector(`label[for="${id}"]`);
    if (el) el.textContent = text;
  });

  // Filter range separator
  document.querySelectorAll('.filter-range-separator').forEach(el => {
    el.textContent = isZh ? '至' : 'to';
  });

  // Buttons
  const submitBtn = document.querySelector('#listing-form button[type="submit"]');
  if (submitBtn) submitBtn.textContent = isZh ? '發布刊登' : 'Publish Listing';
  const cancelEditBtn = document.querySelector('#listing-cancel-edit');
  if (cancelEditBtn) cancelEditBtn.textContent = isZh ? '取消編輯' : 'Cancel Edit';
  const clearBtn = document.querySelector('#filter-clear');
  if (clearBtn) clearBtn.textContent = isZh ? '快速清除' : 'Quick Clear';

  // Pagination
  document.querySelectorAll('[data-pagination-prev] span').forEach(el => el.textContent = isZh ? '上一頁' : 'Previous');
  document.querySelectorAll('[data-pagination-next] span').forEach(el => el.textContent = isZh ? '下一頁' : 'Next');

  // Member modal
  const loginTabLabel = document.querySelector('[data-member-tab="login"] .member-tab-label');
  if (loginTabLabel) loginTabLabel.textContent = isZh ? '登入' : 'Login';
  const signupTabLabel = document.querySelector('[data-member-tab="signup"] .member-tab-label');
  if (signupTabLabel) signupTabLabel.textContent = isZh ? '建立帳號' : 'Sign Up';

  const memberViews = {
    login: { title: isZh ? '登入' : 'Login', button: isZh ? '登入帳號' : 'Login', link1: isZh ? '我要註冊' : 'Create Account', link2: isZh ? '忘記密碼？' : 'Forgot Password?' },
    signup: { title: isZh ? '建立帳號' : 'Sign Up', button: isZh ? '建立會員' : 'Create Account', footnote: isZh ? '已經有帳號？' : 'Already have an account?', link: isZh ? '返回登入' : 'Back to Login' },
    reset: { title: isZh ? '重設密碼' : 'Reset Password', button: isZh ? '寄送重設連結' : 'Send Reset Link', footnote: isZh ? '已經記起密碼？' : 'Remember your password?', link: isZh ? '返回登入' : 'Back to Login' }
  };
  Object.entries(memberViews).forEach(([view, texts]) => {
    const viewEl = document.querySelector(`[data-member-view="${view}"]`);
    if (!viewEl) return;
    const h3 = viewEl.querySelector('h3');
    if (h3) h3.textContent = texts.title;
    const submit = viewEl.querySelector('button[type="submit"]');
    if (submit) submit.textContent = texts.button;
    if (view === 'login') {
      const link1 = viewEl.querySelector('[data-member-route="signup"]');
      if (link1) link1.textContent = texts.link1;
      const link2 = viewEl.querySelector('[data-member-route="reset"]');
      if (link2) link2.textContent = texts.link2;
    }
    if (view === 'signup' || view === 'reset') {
      const footnote = viewEl.querySelector('.member-footnote');
      if (footnote) {
        const parts = footnote.textContent.split(' ');
        const btn = footnote.querySelector('button');
        footnote.childNodes[0].textContent = texts.footnote + ' ';
        if (btn) btn.textContent = texts.link;
      }
    }
  });

  // Form field labels in member modal
  const memberFieldLabels = {
    'member-login-email': isZh ? '電子郵件' : 'Email',
    'member-login-password': isZh ? '密碼' : 'Password',
    'member-signup-email': isZh ? '電子郵件' : 'Email',
    'member-signup-password': isZh ? '密碼' : 'Password',
    'member-signup-confirm': isZh ? '確認密碼' : 'Confirm Password'
  };
  Object.entries(memberFieldLabels).forEach(([id, text]) => {
    const label = document.querySelector(`[for="${id}"] span`);
    if (label) label.textContent = text;
  });

  // Password placeholders
  const pwPlaceholders = {
    'member-login-password': isZh ? '至少 6 碼' : 'At least 6 characters',
    'member-signup-password': isZh ? '至少 6 碼' : 'At least 6 characters',
    'member-signup-confirm': isZh ? '再次輸入' : 'Enter again'
  };
  Object.entries(pwPlaceholders).forEach(([id, text]) => {
    const el = document.querySelector(`#${id}`);
    if (el) el.placeholder = text;
  });

  // Remember email checkbox label
  const rememberLabel = document.querySelector('.member-checkbox > span');
  if (rememberLabel) rememberLabel.textContent = isZh ? '記住 Email' : 'Remember Email';

  // Logout button in modal header
  const logoutBtn = document.querySelector('[data-member-logout]');
  if (logoutBtn) logoutBtn.textContent = isZh ? '登出帳號' : 'Logout';

  // Image modal
  const imageModalClose = document.querySelector('.image-modal-close');
  if (imageModalClose) imageModalClose.textContent = '×';
  const imageModalPrev = document.querySelector('.image-modal-prev');
  if (imageModalPrev) imageModalPrev.textContent = '‹';
  const imageModalNext = document.querySelector('.image-modal-next');
  if (imageModalNext) imageModalNext.textContent = '›';

  // Document title
  document.title = isZh ? '票券交易交流站' : 'Ticket Exchange';

  // Detail page
  const detailBack = document.querySelector('.detail-back');
  if (detailBack) detailBack.textContent = isZh ? '← 返回列表' : '← Back to List';

  const detailH1 = document.querySelector('[data-detail-root] h1');
  if (detailH1) detailH1.textContent = isZh ? '刊登標題' : 'Listing Title';

  const detailDtMap = {
    '刊登類型': isZh ? '刊登類型' : 'Listing Type',
    '類別': isZh ? '類別' : 'Category',
    '數量': isZh ? '數量' : 'Quantity',
    '交付方式': isZh ? '交付方式' : 'Delivery',
    '交易地點': isZh ? '交易地點' : 'Location',
    '截止時間': isZh ? '截止時間' : 'Expires',
    '原價': isZh ? '原價' : 'Face Value',
    '價格': isZh ? '價格' : 'Price',
    '發佈時間': isZh ? '發佈時間' : 'Published',
    '賣家': isZh ? '賣家' : 'Seller'
  };
  document.querySelectorAll('[data-detail-root] dt').forEach(dt => {
    const text = dt.textContent.trim();
    if (detailDtMap[text]) dt.textContent = detailDtMap[text];
  });

  const detailContactP = document.querySelector('.detail-contact p');
  if (detailContactP) detailContactP.innerHTML = isZh ? '聯絡方式：' : 'Contact: ';

  const detailInquiryH2 = document.querySelector('.detail-inquiry h2');
  if (detailInquiryH2) detailInquiryH2.textContent = isZh ? '詢問賣家' : 'Contact Seller';

  const detailMsgLabel = document.querySelector('label[for="inquiry-message"]');
  if (detailMsgLabel) detailMsgLabel.textContent = isZh ? '您的訊息' : 'Your Message';

  const detailTextarea = document.querySelector('#inquiry-message');
  if (detailTextarea) detailTextarea.placeholder = isZh ? '你好，我對這張票有興趣...' : 'Hi, I am interested in this ticket...';

  const detailSubmitBtn = document.querySelector('#inquiry-form button[type="submit"]');
  if (detailSubmitBtn) detailSubmitBtn.textContent = isZh ? '送出' : 'Send';

  // Profile page
  const profileTitle = document.querySelector('.detail-content h1');
  if (profileTitle) profileTitle.textContent = isZh ? '會員資料' : 'Profile';

  const profileFields = {
    '電子郵件': isZh ? '電子郵件' : 'Email',
    '顯示名稱': isZh ? '顯示名稱' : 'Display Name',
    '電話號碼（選填）': isZh ? '電話號碼（選填）' : 'Phone (optional)',
    '目前密碼': isZh ? '目前密碼' : 'Current Password',
    '新密碼': isZh ? '新密碼' : 'New Password',
    '確認新密碼': isZh ? '確認新密碼' : 'Confirm New Password'
  };
  document.querySelectorAll('.profile-form label').forEach(label => {
    const text = label.textContent.trim();
    if (profileFields[text]) label.textContent = profileFields[text];
  });

  const saveChangesBtn = document.querySelector('#profile-form button[type="submit"]');
  if (saveChangesBtn) saveChangesBtn.textContent = isZh ? '儲存修改' : 'Save Changes';

  const passwordSectionTitle = document.querySelector('.detail-content h2');
  if (passwordSectionTitle) passwordSectionTitle.textContent = isZh ? '修改密碼' : 'Change Password';

  const updatePasswordBtn = document.querySelector('#password-form button[type="submit"]');
  if (updatePasswordBtn) updatePasswordBtn.textContent = isZh ? '更新密碼' : 'Update Password';

  // Reset password page
  const resetTitle = document.querySelector('.detail-content h1');
  if (resetTitle && resetTitle.textContent.includes('重設')) resetTitle.textContent = isZh ? '重設密碼' : 'Reset Password';

  const resetSubmitBtn = document.querySelector('#reset-password-form button[type="submit"]');
  if (resetSubmitBtn) resetSubmitBtn.textContent = isZh ? '重設密碼' : 'Reset Password';

  const backToHomeLink = document.querySelector('#reset-success-container a');
  if (backToHomeLink) backToHomeLink.textContent = isZh ? '返回首頁' : 'Back to Home';
}

export { SUPPORTED };