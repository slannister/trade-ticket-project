export default {
  // Common
  appName: 'TikSwap',
  loading: '載入中...',
  error: '錯誤',
  success: '成功',
  cancel: '取消',
  confirm: '確認',
  save: '儲存',
  delete: '刪除',
  edit: '編輯',
  close: '關閉',
  back: '返回',
  backToList: '← 返回列表',
  submit: '送出',
  search: '搜尋',
  clear: '清除',
  apply: '套用',

  // Navigation
  home: '首頁',
  allTickets: '全部票券',
  myListings: '我的刊登',
  myFavorites: '我的最愛',
  myMessages: '我的訊息',
  nav: {
    messages: '我的訊息',
    myListings: '我的刊登',
    myFavorites: '我的最愛'
  },
  memberProfile: '會員資料',
  logout: '會員登出',
  loginRegister: '登入 / 註冊',

  // Categories
  category: {
    all: '全部票券',
    concert: '演唱會',
    sports: '體育賽事',
    theater: '戲劇舞台',
    show: '綜藝活動',
    exhibition: '展覽 / 市集',
    collectibles: '收藏品 / 周邊',
    other: '其他'
  },

  // Listing types
  listingType: {
    auction: '出售',
    transfer: '讓票',
    swap: '交換',
    request: '求票'
  },

  // Delivery methods
  delivery: {
    meetup: '面交',
    shipping: '寄件'
  },

  // Listing form
  listingForm: {
    title: '刊登標題',
    titlePlaceholder: '例如：Taylor Swift VIP席位',
    type: '刊登類型',
    category: '票券類型',
    quantity: '數量',
    price: '商品價格（選填）',
    pricePlaceholder: '例如：2200',
    deliveryMethod: '交付方式',
    urgency: '急迫程度',
    urgencyNormal: '一般',
    urgencyUrgent: '超急',
    deadline: '截止日期',
    location: '交易地點',
    swapPreferences: '交換偏好（若刊登類型為交換）',
    description: '其他資訊（選填）',
    descriptionPlaceholder: '座位資訊',
    images: '上傳圖片（最多 6 張）',
    publish: '發布刊登',
    cancelEdit: '取消編輯',
    created: '刊登已成功發布！',
    updated: '刊登已更新！',
    deleted: '刊登已刪除',
    deleteConfirm: '確定要刪除此刊登嗎？',
    markAsSold: '標記為已售出',
    markAsSoldConfirm: '確定要將此刊登標記為已售出嗎？',
    reopenConfirm: '確定要重新上架此刊登嗎？',
    statusUpdated: '狀態已更新'
  },

  // Listing card
  listingCard: {
    viewDetails: '查看詳情',
    noDescription: '暫無補充資訊。',
    published: '發佈時間：',
    priceNegotiable: '面議',
    priceLabel: '價格',
    sold: '已售出'
  },

  // Filters
  filters: {
    listingType: '刊登類型',
    deliveryMethod: '交付方式',
    quantity: '數量',
    quantityMin: '至少',
    publishDate: '發佈日期',
    expiresDate: '截止日期',
    searchPlaceholder: '搜尋...',
    quickClear: '快速清除',
    all: '全部'
  },

  // Messages
  messages: {
    title: '我的訊息',
    subtitle: '查看買家對您刊登的詢問。',
    noMessages: '目前沒有收到任何訊息。',
    about: '關於：',
    reply: '回覆',
    sent: '訊息已送出',
    sendFailed: '訊息傳送失敗，請稍後再試',
    cantReplyOwn: '無法回覆自己的詢問',
    inquirySent: 'Inquiry sent'
  },

  // Chat
  chat: {
    placeholder: '輸入訊息...',
    send: '發送',
    close: '關閉'
  },

  // Detail page
  detail: {
    listingTitle: '刊登標題',
    description: '補充資訊',
    noDescription: '暫無補充資訊。',
    listingType: '刊登類型',
    category: '類別',
    quantity: '數量',
    delivery: '交付方式',
    location: '交易地點',
    expires: '截止時間',
    faceValue: '原價',
    price: '價格',
    seller: '賣家',
    contact: '聯絡方式：',
    contactSeller: '詢問賣家',
    messagePlaceholder: '你好，我對這張票有興趣...',
    sendMessage: '送出'
  },

  // Auth
  auth: {
    login: '登入',
    signup: '建立帳號',
    email: '電子郵件',
    emailPlaceholder: 'you@example.com',
    password: '密碼',
    passwordPlaceholder: '至少 6 碼',
    confirmPassword: '確認密碼',
    confirmPasswordPlaceholder: '再次輸入',
    displayName: '顯示名稱',
    rememberEmail: '記住 Email',
    loginButton: '登入帳號',
    signupButton: '建立會員',
    forgotPassword: '忘記密碼？',
    registerLink: '我要註冊',
    backToLogin: '返回登入',
    alreadyHaveAccount: '已經有帳號？',
    logout: '登出帳號',
    registerSuccess: '註冊成功！',
    loginSuccess: '登入成功！',
    logoutSuccess: '已登出',
    passwordMismatch: '兩次輸入的密碼不一致',
    loginFailed: '登入失敗',
    registerFailed: '註冊失敗'
  },

  // Password reset
  passwordReset: {
    title: '重設密碼',
    newPassword: '新密碼',
    confirmPassword: '確認密碼',
    resetButton: '重設密碼',
    success: '密碼已成功重設！',
    backToHome: '返回首頁',
    invalidToken: '無效的重設連結'
  },

  // Profile
  profile: {
    pageTitle: '會員資料 - TikSwap',
    title: '會員資料',
    email: '電子郵件',
    displayName: '顯示名稱',
    displayNamePlaceholder: '你的顯示名稱',
    phone: '電話號碼（選填）',
    phonePlaceholder: '0912345678',
    saveChanges: '儲存修改',
    profileUpdated: '會員資料已更新',
    passwordSection: '修改密碼',
    currentPassword: '目前密碼',
    newPassword: '新密碼',
    newPasswordPlaceholder: '至少 6 碼',
    confirmPassword: '確認新密碼',
    confirmPasswordPlaceholder: '再次輸入新密碼',
    updatePassword: '更新密碼',
    passwordUpdated: '密碼已更新',
    passwordMismatch: '兩次輸入的密碼不一致',
    loadFailed: '載入會員資料失敗',
    updateFailed: '更新失敗'
  },

  // Favorites
  favorites: {
    added: '已加入我的最愛',
    removed: '已移除我的最愛',
    addFailed: '操作失敗'
  },

  // Theme
  theme: {
    switchToLight: '切換為亮色模式',
    switchToDark: '切換為暗色模式'
  },

  // Pagination
  pagination: {
    showing: '第 {start}-{end} 筆，共 {total} 筆',
    page: '第 {current} / {total} 頁',
    prev: '上一頁',
    next: '下一頁'
  },

  // Empty states
  empty: {
    noListings: '沒有找到符合條件的刊登。',
    noFavorites: '還沒有收藏任何刊登。',
    noMessages: '目前沒有收到任何訊息。'
  },

  // Auth prompts
  authPrompts: {
    loginRequired: '請先登入',
    toPublish: '請先登入才能發布刊登',
    toFavorite: '請先登入才能收藏',
    toViewMessages: '請先登入以查看訊息',
    toViewFavorites: '請先登入以查看我的最愛',
    toViewMyListings: '請先登入以查看我的刊登'
  },

  // Load errors
  errors: {
    loadFailed: '載入失敗，請稍後再試',
    saveFailed: '儲存失敗，請稍後再試',
    deleteFailed: '刪除失敗',
    updateFailed: '更新失敗',
    sendFailed: '發送失敗'
  }
};