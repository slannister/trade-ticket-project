document.addEventListener('DOMContentLoaded', () => {
  // DOM 元素
  const listingForm = document.getElementById('listing-form');
  const listingsContainer = document.getElementById('listings-container');
  const listingTemplate = document.getElementById('listing-template');
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
  let modalState = { images: [], index: 0 };

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
    if (!dateStr && timeStr) {
      const fallback = `1970-01-01T${timeStr.length === 5 ? `${timeStr}:00` : timeStr}`;
      const dt = new Date(fallback);
      return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
    }
    const safeTime = timeStr && timeStr.length === 5 ? `${timeStr}:00` : (timeStr || '00:00:00');
    const combined = `${dateStr}T${safeTime}`;
    const result = new Date(combined);
    return Number.isNaN(result.getTime()) ? null : result.toISOString();
  };

  const persistListing = async data => {
    if (!isSupabaseEnabled) {
      return { ...data };
    }

    const payload = {
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
      created_at: data.createdAt ?? new Date().toISOString()
    };

    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) delete payload[key];
    });

    const { data: inserted, error } = await supabaseClient
      .from(listingsTableName)
      .insert(payload)
      .select()
      .single();

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
    const card = listingTemplate.content.cloneNode(true).querySelector('.listing-card');

    // 1. 填寫主要資訊
    card.querySelector('.listing-title').textContent = data.title;
    const descriptionBlock = card.querySelector('.listing-description');
    if (descriptionBlock) {
      const descriptionTextEl = descriptionBlock.querySelector('.listing-description-text');
      if (descriptionTextEl) {
        if (data.description && data.description.trim()) {
          descriptionTextEl.textContent = data.description.trim();
          descriptionBlock.classList.remove('is-empty');
        } else {
          descriptionTextEl.textContent = '暫無詳細資訊。';
          descriptionBlock.classList.add('is-empty');
        }
      }
    }

    const mediaContainer = card.querySelector('.listing-media');
    if (mediaContainer) {
      mediaContainer.innerHTML = '';
      const imageList = (() => {
        const images = parseImages(data.images);
        if (images.length) return images;
        if (data.imageUrl) return [{ url: data.imageUrl, name: data.imageName || 'image' }];
        return [];
      })();

      if (imageList.length) {
        const grid = document.createElement('div');
        grid.className = 'listing-media-grid';
        imageList.forEach((img, index) => {
          if (!img || !img.url) return;
          const imageEl = document.createElement('img');
          imageEl.src = img.url;
          imageEl.alt = img.name || data.title || '刊登圖片';
          imageEl.loading = 'lazy';
          imageEl.addEventListener('click', () => openImageModal(imageList, index));
          grid.appendChild(imageEl);
        });
        mediaContainer.appendChild(grid);
      } else {
        mediaContainer.remove();
      }
    }

    // 2. 組合 Meta 字串
    const meta = [];
    if (data.sellerName) meta.push(`刊登人：${data.sellerName}`);
    if (data.location) meta.push(`地點：${data.location}`);
    if (data.createdAt) meta.push(`發佈時間：${formatDateTimeValue(data.createdAt || data.id)}`);
    card.querySelector('.listing-meta').textContent = meta.join('・');

    // 3. 處理徽章 (Badges)
    const badgesContainer = card.querySelector('.badges');
    badgesContainer.innerHTML = '';
    const typeMap = { auction: '出價', transfer: '讓票', swap: '交換' };
    if (data.type) {
      const typeBadge = document.createElement('span');
      typeBadge.className = `badge badge-${typeMap[data.type] || 'default'}`;
      typeBadge.textContent = typeMap[data.type];
      badgesContainer.appendChild(typeBadge);
    }
    if (data.urgency === 'urgent') {
      const urgencyBadge = document.createElement('span');
      urgencyBadge.className = 'badge badge-urgent';
      urgencyBadge.textContent = '超急';
      badgesContainer.appendChild(urgencyBadge);
    }

    // 4. 填寫詳細資訊區塊
    const detailsContainer = card.querySelector('.listing-details');
    detailsContainer.innerHTML = '';
    const addDetail = (label, value) => {
      if (!value || value.trim() === '') return;
      const detailEl = document.createElement('div');
      detailEl.className = 'detail-item';
      detailEl.innerHTML = `<span class="detail-label">${label}</span><span class="detail-value">${value}</span>`;
      detailsContainer.appendChild(detailEl);
    };

    addDetail('票券類型', data.category);
    addDetail('數量', data.quantity ? `${data.quantity}` : '');
    const deadlineLabel = data.expiresAt ? formatDateTimeValue(data.expiresAt) : '';
    if (!deadlineLabel) {
      console.debug('Deadline label empty for listing', data.id, data.expiresAt);
    }
    addDetail('截止時間', deadlineLabel);
    addDetail('交付方式', formatDeliveryMethod(data.deliveryMethod));
    addDetail('交換偏好', data.swapPreferences);
    addDetail('聯絡方式', data.sellerContact);

    // 5. 填寫價格尾註
    const footer = card.querySelector('.listing-footer');
    footer.innerHTML = '';
    const addPrice = (label, value, labelClass = '') => {
      if (!value) return;
      const priceEl = document.createElement('p');
      priceEl.className = 'listing-price';
      priceEl.innerHTML = `<span class="price-label ${labelClass}">${label}</span><strong>NT$ ${Number(value).toLocaleString()}</strong>`;
      footer.appendChild(priceEl);
    };

    addPrice('原價', data.faceValue);
    addPrice('直接成交價', data.buyNow, 'buynow-label');

    return card;
  }

  /**
   * 重設篩選器輸入欄位
   */
  function resetFilters() {
    if (filterType) filterType.value = 'all';
    if (filterCategory) filterCategory.value = 'all';
    if (filterSearch) filterSearch.value = '';
    if (filterQuantityMin) filterQuantityMin.value = '';
    if (filterDelivery) filterDelivery.value = 'all';
    if (filterCreatedStart) filterCreatedStart.value = '';
    if (filterCreatedEnd) filterCreatedEnd.value = '';
    if (filterExpiresStart) filterExpiresStart.value = '';
    if (filterExpiresEnd) filterExpiresEnd.value = '';
    renderListings();
  }

  /**
   * 根據目前的篩選器和搜尋條件，渲染刊登列表
   */
  function renderListings() {
    const typeValue = filterType ? filterType.value : 'all';
    const categoryValue = filterCategory ? filterCategory.value : 'all';
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
      const categoryMatch = categoryValue === 'all' || listing.category === categoryValue;
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

    // 清空目前的列表
    listingsContainer.innerHTML = '';

    // 顯示結果
    if (filteredListings.length === 0) {
      listingsContainer.innerHTML = '<div class="empty-state">沒有找到符合條件的刊登。</div>';
    } else {
      // 從最新到最舊顯示
      filteredListings.slice().reverse().forEach(listingData => {
        const card = createListingCard(listingData);
        listingsContainer.appendChild(card);
      });
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

    const formData = new FormData(listingForm);
    const imageFiles = listingImageInput && listingImageInput.files
      ? Array.from(listingImageInput.files).filter(file => file && file.size > 0)
      : [];

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
    data.id = Date.now().toString();
    data.createdAt = new Date().toISOString();
    data.expiresAt = combineDateTime(data.expiresDate, data.expiresTime);

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

    if (!data.images.length) {
      delete data.images;
    }

    try {
      const storedListing = await persistListing(data);
      upsertListing(storedListing);
      renderListings();
      listingForm.reset();
      if (listingImageInput) listingImageInput.value = '';
      showToast('刊登已成功發布！');
      listingsContainer.parentElement.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to save listing to Supabase', error);
      upsertListing(data);
      renderListings();
      showToast('暫時無法儲存到雲端，資料已存於此頁面。');
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
    // 初始渲染
    renderListings();
    loadInitialListings();

    // 綁定表單和篩選器事件
    listingForm.addEventListener('submit', handleFormSubmit);
    if (filterType) filterType.addEventListener('change', renderListings);
    if (filterCategory) filterCategory.addEventListener('change', renderListings);
    if (filterSearch) filterSearch.addEventListener('input', renderListings);
    if (filterQuantityMin) filterQuantityMin.addEventListener('input', renderListings);
    if (filterDelivery) filterDelivery.addEventListener('change', renderListings);
    if (filterCreatedStart) filterCreatedStart.addEventListener('change', renderListings);
    if (filterCreatedEnd) filterCreatedEnd.addEventListener('change', renderListings);
    if (filterExpiresStart) filterExpiresStart.addEventListener('change', renderListings);
    if (filterExpiresEnd) filterExpiresEnd.addEventListener('change', renderListings);
    if (filterClear) filterClear.addEventListener('click', resetFilters);

    if (imageModalClose) imageModalClose.addEventListener('click', closeImageModal);
    if (imageModalBackdrop) imageModalBackdrop.addEventListener('click', closeImageModal);
    if (imageModalPrev) imageModalPrev.addEventListener('click', () => changeModalImage(-1));
    if (imageModalNext) imageModalNext.addEventListener('click', () => changeModalImage(1));
    document.addEventListener('keydown', handleModalKeydown);

    // 處理手風琴效果
    document.querySelectorAll('.panel-header').forEach(header => {
      header.addEventListener('click', () => {
        const panel = header.closest('.collapsible');
        if (panel) {
          panel.classList.toggle('is-collapsed');
          const toggleBtn = header.querySelector('.panel-toggle');
          const isCollapsed = panel.classList.contains('is-collapsed');
          toggleBtn.textContent = isCollapsed ? '+' : '-';
          toggleBtn.setAttribute('aria-expanded', !isCollapsed);
        }
      });
    });
  }

  // 啟動應用程式
  initialize();
});
