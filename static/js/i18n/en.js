export default {
  // Common
  appName: 'TikSwap',
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',
  cancel: 'Cancel',
  confirm: 'Confirm',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  close: 'Close',
  back: 'Back',
  submit: 'Submit',
  search: 'Search',
  clear: 'Clear',
  apply: 'Apply',

  // Navigation
  home: 'Home',
  allTickets: 'All Tickets',
  myListings: 'My Listings',
  myFavorites: 'My Favorites',
  myMessages: 'My Messages',
  memberProfile: 'Profile',
  logout: 'Logout',
  loginRegister: 'Login / Register',

  // Categories
  category: {
    all: 'All Tickets',
    concert: 'Concert',
    sports: 'Sports',
    theater: 'Theater',
    show: 'Show / Event',
    exhibition: 'Exhibition / Market',
    collectibles: 'Collectibles / Merchandise',
    other: 'Other'
  },

  // Listing types
  listingType: {
    auction: 'For Sale',
    transfer: 'Transfer',
    swap: 'Swap',
    request: 'Request'
  },

  // Delivery methods
  delivery: {
    meetup: 'Meetup',
    shipping: 'Shipping'
  },

  // Listing form
  listingForm: {
    title: 'Listing Title',
    titlePlaceholder: 'e.g., Taylor Swift VIP Seat',
    type: 'Listing Type',
    category: 'Category',
    quantity: 'Quantity',
    price: 'Price (optional)',
    pricePlaceholder: 'e.g., 2200',
    deliveryMethod: 'Delivery Method',
    urgency: 'Urgency',
    urgencyNormal: 'Normal',
    urgencyUrgent: 'Urgent',
    deadline: 'Deadline',
    location: 'Location',
    swapPreferences: 'Swap Preferences (if listing type is Swap)',
    description: 'Additional Info (optional)',
    descriptionPlaceholder: 'Seat information',
    images: 'Upload Images (max 6)',
    publish: 'Publish Listing',
    cancelEdit: 'Cancel Edit',
    created: 'Listing published successfully!',
    updated: 'Listing updated!',
    deleted: 'Listing deleted',
    deleteConfirm: 'Are you sure you want to delete this listing?'
  },

  // Listing card
  listingCard: {
    viewDetails: 'View Details',
    noDescription: 'No additional information.',
    published: 'Published: ',
    priceNegotiable: 'Negotiable',
    priceLabel: 'Price'
  },

  // Filters
  filters: {
    listingType: 'Listing Type',
    deliveryMethod: 'Delivery Method',
    quantity: 'Quantity',
    quantityMin: 'Min',
    publishDate: 'Publish Date',
    expiresDate: 'Expires Date',
    searchPlaceholder: 'Search...',
    quickClear: 'Quick Clear',
    all: 'All'
  },

  // Messages
  messages: {
    title: 'My Messages',
    subtitle: 'View inquiries from buyers on your listings.',
    noMessages: 'No messages yet.',
    about: 'About: ',
    reply: 'Reply',
    sent: 'Message sent',
    sendFailed: 'Failed to send message, please try again',
    cantReplyOwn: 'Cannot reply to your own inquiry',
    inquirySent: 'Inquiry sent'
  },

  // Chat
  chat: {
    placeholder: 'Type a message...',
    send: 'Send',
    close: 'Close'
  },

  // Detail page
  detail: {
    listingTitle: 'Listing Title',
    description: 'Additional Info',
    noDescription: 'No additional information.',
    listingType: 'Listing Type',
    category: 'Category',
    quantity: 'Quantity',
    delivery: 'Delivery Method',
    location: 'Location',
    expires: 'Expires',
    faceValue: 'Face Value',
    price: 'Price',
    seller: 'Seller',
    contact: 'Contact: ',
    contactSeller: 'Contact Seller',
    messagePlaceholder: 'Hi, I am interested in this ticket...',
    sendMessage: 'Send'
  },

  // Auth
  auth: {
    login: 'Login',
    signup: 'Sign Up',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Enter again',
    displayName: 'Display Name',
    rememberEmail: 'Remember Email',
    loginButton: 'Login',
    signupButton: 'Create Account',
    forgotPassword: 'Forgot Password?',
    registerLink: 'Create Account',
    backToLogin: 'Back to Login',
    alreadyHaveAccount: 'Already have an account?',
    logout: 'Logout',
    registerSuccess: 'Registration successful!',
    loginSuccess: 'Login successful!',
    logoutSuccess: 'Logged out',
    passwordMismatch: 'Passwords do not match',
    loginFailed: 'Login failed',
    registerFailed: 'Registration failed'
  },

  // Password reset
  passwordReset: {
    title: 'Reset Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    resetButton: 'Reset Password',
    success: 'Password reset successfully!',
    backToHome: 'Back to Home',
    invalidToken: 'Invalid reset link'
  },

  // Profile
  profile: {
    title: 'Profile',
    email: 'Email',
    displayName: 'Display Name',
    displayNamePlaceholder: 'Your display name',
    phone: 'Phone (optional)',
    phonePlaceholder: '0912345678',
    saveChanges: 'Save Changes',
    profileUpdated: 'Profile updated',
    passwordSection: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    updatePassword: 'Update Password',
    passwordUpdated: 'Password updated'
  },

  // Favorites
  favorites: {
    added: 'Added to favorites',
    removed: 'Removed from favorites',
    addFailed: 'Operation failed'
  },

  // Theme
  theme: {
    switchToLight: 'Switch to Light Mode',
    switchToDark: 'Switch to Dark Mode'
  },

  // Pagination
  pagination: {
    showing: 'Showing {start}-{end} of {total}',
    page: 'Page {current} of {total}',
    prev: 'Previous',
    next: 'Next'
  },

  // Empty states
  empty: {
    noListings: 'No listings found.',
    noFavorites: 'No favorites yet.',
    noMessages: 'No messages yet.'
  },

  // Auth prompts
  authPrompts: {
    loginRequired: 'Please login first',
    toPublish: 'Please login to publish listings',
    toFavorite: 'Please login to add favorites',
    toViewMessages: 'Please login to view messages',
    toViewFavorites: 'Please login to view favorites',
    toViewMyListings: 'Please login to view my listings'
  },

  // Load errors
  errors: {
    loadFailed: 'Failed to load, please try again',
    saveFailed: 'Failed to save, please try again',
    deleteFailed: 'Failed to delete',
    sendFailed: 'Failed to send'
  }
};
