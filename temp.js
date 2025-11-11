document.addEventListener('DOMContentLoaded', () => {
  // DOM 元素
  const listingForm = document.getElementById('listing-form');
  const listingFormPanel = document.getElementById('listing-form-panel');
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
  const sidebarAction = document.querySelector('.sidebar-action');
  const sidebarCategoryButtons = document.querySelectorAll('.sidebar-nav button[data-category]');
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
  let modalState = { images: [], index: 0 };
  let activeCategory = 'all';

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
    const label = getCategoryLabel(activeCategory);
    categoryPanelSubtitle.textContent = `${label} 的刊登與篩選結果顯示於此。`;
  }

  function setActiveCategory(value, { syncSelect = false, syncNav = false } = {}) {
    const normalized = value && value !== '' ? value : 'all';
    activeCategory = normalized;

    if (syncSelect && filterCategory) {
      filterCategory.value = normalized;
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
        : `${getCategoryLabel(normalized)} 刊登`;
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

  function showCategoryPanel() {
    if (!categoryPanel) return;
    categoryPanel.hidden = false;
    categoryPanel.classList.remove('is-hidden');
    hideListingForm();
    updateCategoryPanelSubtitle();
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
    const card = listingTemplate.content.firstElementChild.cloneNode(true);
    const media = card.querySelector('.listing-card-media');
    const imageEl = card.querySelector('.listing-card-image');
    const fallback = card.querySelector('.listing-card-fallback');
    const fallbackInitial = fallback ? fallback.querySelector('.fallback-initial') : null;
    const badgesContainer = card.querySelector('.listing-card-badges');
    const titleEl = card.querySelector('.listing-card-title');
    const idEl = card.querySelector('.listing-card-id');
    const metaEl = card.querySelector('.listing-card-meta');
    const descriptionEl = card.querySelector('.listing-card-description');
    const priceValueEl = card.querySelector('.price-value');
    const actionBtn = card.querySelector('.listing-card-action');

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

    if (imageList.length && imageEl) {
      imageEl.src = imageList[0].url;
      imageEl.alt = imageList[0].name || data.title || '刊登圖片';
      imageEl.loading = 'lazy';
      card.classList.add('has-image');
      if (media) {
        media.addEventListener('click', () => openImageModal(imageList, 0));
        media.style.cursor = 'pointer';
      }
    } else if (fallbackInitial) {
      const initial = (data.category || data.title || '票').trim().charAt(0);
      fallbackInitial.textContent = initial ? initial.toUpperCase() : '票';
      if (fallback) {
        fallback.style.background = getCategoryBackground(data.category);
      }
    }

    if (titleEl) {
      titleEl.textContent = data.title || '未命名票券';
    }

    if (idEl) {
      const idSuffix = (data.id || '').toString().slice(-6);
      idEl.textContent = idSuffix ? `#${idSuffix}` : '#即時刊登';
    }

    if (metaEl) {
      const metaParts = [];
      if (data.category) metaParts.push(data.category);
      if (data.quantity) metaParts.push(`數量 ${data.quantity}`);
      if (data.deliveryMethod) metaParts.push(formatDeliveryMethod(data.deliveryMethod));
      if (data.location) metaParts.push(data.location);
      if (data.expiresAt) metaParts.push(`截止 ${formatDateValue(data.expiresAt)}`);
      metaEl.textContent = metaParts.join(' ・ ');
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

    if (priceValueEl) {
      if (data.buyNow) {
        priceValueEl.textContent = `NT$ ${Number(data.buyNow).toLocaleString()}`;
      } else if (data.faceValue) {
        priceValueEl.textContent = `原價 NT$ ${Number(data.faceValue).toLocaleString()}`;
      } else {
        priceValueEl.textContent = '面議';
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

    if (actionBtn) {
      const contact = data.sellerContact && data.sellerContact.trim();
      actionBtn.textContent = contact ? '顯示聯絡方式' : '查看更多';
      actionBtn.addEventListener('click', event => {
        event.stopPropagation();
        if (contact) {
          showToast(`聯絡方式：${contact}`);
        } else {
          showToast('此刊登尚未提供聯絡方式。');
        }
      });
    }

    if (card && media && !imageList.length) {
      card.classList.add('is-placeholder');
    }

    return card;
  }

  function scrollToListingForm() {
    if (!listingForm || !listingFormPanel) return;
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

  function createNewListingCallout() {
    const card = document.createElement('article');
    card.className = 'listing-card listing-card--create';
    card.innerHTML = `
      <div class="listing-card-media">
        <div class="listing-card-create-icon">+</div>
      </div>
      <div class="listing-card-body">
        <div class="listing-card-title-row">
          <h3 class="listing-card-title">建立新刊登</h3>
        </div>
        <p class="listing-card-meta">分享你的票券資訊，立即觸及等候的買家與收藏者。</p>
        <p class="listing-card-description">支援圖片上傳、交付方式、截止時間與聯絡資訊，自訂你的刊登細節。</p>
      </div>
      <div class="listing-card-footer">
        <div class="listing-card-price">
          <span class="price-label">開始</span>
          <strong class="price-value">快速建立</strong>
        </div>
        <button class="listing-card-action" type="button">前往表單</button>
      </div>
    `;

    const actionBtn = card.querySelector('.listing-card-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', event => {
        event.stopPropagation();
        scrollToListingForm();
      });
    }
    card.addEventListener('click', scrollToListingForm);
    return card;
  }

  /**
   * 重設篩選器輸入欄位
   */
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
    renderListings();
  }

  /**
   * 根據目前的篩選器和搜尋條件，渲染刊登列表
   */
  function renderListings() {
    if (!listingsContainer) return;
    const typeValue = filterType ? filterType.value : 'all';
    const categoryValue = filterCategory
      ? (filterCategory.value || 'all')
      : activeCategory;
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

    // 清空目前的列表並插入建立刊登卡片
    listingsContainer.innerHTML = '';
    listingsContainer.appendChild(createNewListingCallout());

    // 顯示結果
    if (filteredListings.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = '沒有找到符合條件的刊登。';
      listingsContainer.appendChild(empty);
      return;
    }

    // 從最新到最舊顯示
    filteredListings
      .slice()
      .reverse()
      .forEach(listingData => {
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
      setActiveCategory('all', { syncSelect: true, syncNav: true });
      showCategoryPanel();
      showToast('刊登已成功發布！');
      const target = categoryPanel || listingsContainer.parentElement;
      if (target && target.scrollIntoView) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      console.error('Failed to save listing to Supabase', error);
      upsertListing(data);
      renderListings();
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
    setActiveCategory(initialCategory, { syncSelect: true, syncNav: true });
    showCategoryPanel();
    renderListings();
    loadInitialListings();

    // 綁定表單和篩選器事件
    if (listingForm) {
      listingForm.addEventListener('submit', handleFormSubmit);
    }
    if (filterType) filterType.addEventListener('change', renderListings);
    if (filterSearch) filterSearch.addEventListener('input', renderListings);
    if (filterQuantityMin) filterQuantityMin.addEventListener('input', renderListings);
    if (filterDelivery) filterDelivery.addEventListener('change', renderListings);
    if (filterCreatedStart) filterCreatedStart.addEventListener('change', renderListings);
    if (filterCreatedEnd) filterCreatedEnd.addEventListener('change', renderListings);
    if (filterExpiresStart) filterExpiresStart.addEventListener('change', renderListings);
    if (filterExpiresEnd) filterExpiresEnd.addEventListener('change', renderListings);
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
        setActiveCategory(categoryValue, { syncSelect: true, syncNav: true });
        showCategoryPanel();
        renderListings();
        scrollToCategoryPanel();
      });
    });

    if (imageModalClose) imageModalClose.addEventListener('click', closeImageModal);
    if (imageModalBackdrop) imageModalBackdrop.addEventListener('click', closeImageModal);
    if (imageModalPrev) imageModalPrev.addEventListener('click', () => changeModalImage(-1));
    if (imageModalNext) imageModalNext.addEventListener('click', () => changeModalImage(1));
    document.addEventListener('keydown', handleModalKeydown);
  }

  // 啟動應用程式
  initialize();
});
