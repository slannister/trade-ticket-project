const TYPE_LABELS = { auction: '出售', transfer: '讓票', swap: '交換', request: '求票' };
const supabaseClient = window.__supabase || null;
const listingsTableName = 'listings';
const isSupabaseEnabled = Boolean(supabaseClient);
let cleanupSliderResize = null;

const formatDeliveryMethod = value => {
  if (!value) return '—';
  return value === 'meetup' ? '面交' : value === 'shipping' ? '寄件' : value;
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
  if (!value) {
    return 'linear-gradient(160deg, rgba(91, 140, 255, 0.24), rgba(127, 91, 255, 0.18))';
  }
  return categoryBackgrounds[value] || 'linear-gradient(160deg, rgba(91, 140, 255, 0.24), rgba(127, 91, 255, 0.18))';
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

const toIsoString = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const normalizeListing = row => {
  if (!row) return null;
  const images = parseImages(row.images ?? row.image_urls ?? null);
  const imageUrl = row.imageUrl ?? row.image_url ?? images[0]?.url ?? null;
  return {
    id: (row.id ?? row.uuid ?? '').toString() || Date.now().toString(),
    title: row.title ?? '',
    description: row.description ?? '',
    type: row.type ?? '',
    category: row.category ?? '',
    quantity: row.quantity ?? '',
    deliveryMethod: row.deliveryMethod ?? row.delivery_method ?? '',
    expiresAt: toIsoString(row.expiresAt ?? row.expires_at) ?? row.expires_at ?? null,
    buyNow: row.buyNow ?? row.buy_now ?? '',
    faceValue: row.faceValue ?? row.face_value ?? '',
    sellerName: row.sellerName ?? row.seller_name ?? '',
    sellerContact: row.sellerContact ?? row.seller_contact ?? '',
    urgency: row.urgency ?? '',
    images,
    imageUrl,
    createdAt: toIsoString(row.createdAt ?? row.created_at) ?? new Date().toISOString()
  };
};

const safeDecodeURIComponent = value => {
  let result = value;
  let attempts = 0;
  while (result && result.includes('%') && attempts < 5) {
    try {
      const decoded = decodeURIComponent(result);
      if (decoded === result) break;
      result = decoded;
      attempts += 1;
    } catch {
      break;
    }
  }
  return result;
};

const tryParseJson = (value, listingId) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (listingId && parsed?.id && parsed.id.toString() !== listingId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const decodeListingPayload = (encodedValue, listingId) => {
  if (!encodedValue && (typeof window === 'undefined' || !window.location.hash)) return null;
  try {
    let encoded = encodedValue;
    if (!encoded && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.hash.slice(1));
      encoded = params.get('data');
    }
    if (!encoded) return null;

    const candidateStrings = [];
    const urlDecoded = safeDecodeURIComponent(encoded);
    if (urlDecoded && urlDecoded !== encoded) {
      candidateStrings.push(urlDecoded);
    }

    const base64Sources = [encoded, urlDecoded].filter(Boolean);
    if (typeof window.atob === 'function') {
      base64Sources.forEach(source => {
        let normalized = source.replace(/-/g, '+').replace(/_/g, '/');
        if (normalized.length % 4 !== 0) {
          normalized += '='.repeat(4 - (normalized.length % 4));
        }
        try {
          const baseDecoded = window.atob(normalized);
          candidateStrings.push(safeDecodeURIComponent(baseDecoded));
        } catch {
          /* ignore base64 decode errors */
        }
      });
    }

    candidateStrings.push(encoded);

    for (const candidate of candidateStrings) {
      const listing = tryParseJson(candidate, listingId);
      if (listing) return listing;
    }
    return null;
  } catch (error) {
    console.warn('無法解析網址中的刊登資料', error);
    return null;
  }
};

const fetchListingById = async id => {
  if (!isSupabaseEnabled || !id) return null;
  try {
    const { data, error } = await supabaseClient
      .from(listingsTableName)
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Failed to fetch listing from Supabase', error);
      return null;
    }
    return normalizeListing(data);
  } catch (error) {
    console.error('Unexpected error when fetching listing', error);
    return null;
  }
};

const formatDateValue = value => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

const imageModalRoot = document.getElementById('image-modal');
const imageModalBackdrop = imageModalRoot ? imageModalRoot.querySelector('.image-modal-backdrop') : null;
const imageModalContent = imageModalRoot ? imageModalRoot.querySelector('.image-modal-content') : null;
const imageModalImage = imageModalRoot ? imageModalRoot.querySelector('.image-modal-image') : null;
const imageModalClose = imageModalRoot ? imageModalRoot.querySelector('.image-modal-close') : null;
const imageModalPrev = imageModalRoot ? imageModalRoot.querySelector('.image-modal-prev') : null;
const imageModalNext = imageModalRoot ? imageModalRoot.querySelector('.image-modal-next') : null;
const imageModalCounter = imageModalRoot ? imageModalRoot.querySelector('.image-modal-counter') : null;
let modalState = { images: [], index: 0 };

const updateModal = () => {
  if (!imageModalRoot || !imageModalImage) return;
  const { images, index } = modalState;
  const current = images[index];
  if (!current) {
    imageModalImage.src = '';
    imageModalImage.alt = '';
    return;
  }
  imageModalImage.src = current.url;
  imageModalImage.alt = current.name || `圖片 ${index + 1}`;
  if (imageModalCounter) {
    imageModalCounter.textContent = `${index + 1} / ${images.length}`;
  }
  const disableNav = images.length <= 1;
  if (imageModalPrev) imageModalPrev.disabled = disableNav;
  if (imageModalNext) imageModalNext.disabled = disableNav;
};

const openImageModal = (images, startIndex = 0) => {
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
  updateModal();
};

const closeImageModal = () => {
  if (!imageModalRoot) return;
  imageModalRoot.classList.remove('is-visible');
  imageModalRoot.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (imageModalImage) {
    imageModalImage.src = '';
    imageModalImage.alt = '';
  }
  modalState = { images: [], index: 0 };
};

const changeModalImage = direction => {
  if (!modalState.images.length) return;
  modalState.index = (modalState.index + direction + modalState.images.length) % modalState.images.length;
  updateModal();
};

const handleModalKeydown = event => {
  if (!imageModalRoot || !imageModalRoot.classList.contains('is-visible')) return;
  if (event.key === 'Escape') {
    closeImageModal();
  } else if (event.key === 'ArrowLeft') {
    changeModalImage(-1);
  } else if (event.key === 'ArrowRight') {
    changeModalImage(1);
  }
};

const renderListing = (listing, root) => {
  const titleEl = root.querySelector('[data-title]');
  const descriptionEl = root.querySelector('[data-description]');
  const typeEl = root.querySelector('[data-type]');
  const categoryEl = root.querySelector('[data-category]');
  const quantityEl = root.querySelector('[data-quantity]');
  const deliveryEl = root.querySelector('[data-delivery]');
  const expiresEl = root.querySelector('[data-expires]');
  const priceEl = root.querySelector('[data-price]');
  const contactEl = root.querySelector('[data-contact]');
  const tagsEl = root.querySelector('[data-tags]');
  const gallerySection = document.querySelector('[data-gallery]');
  const galleryGrid = document.querySelector('[data-gallery-grid]');
  const mediaWrapper = root.querySelector('[data-media]');
  const mediaSlider = mediaWrapper?.querySelector('[data-media-slider]');
  const mediaTrack = mediaWrapper?.querySelector('[data-media-track]');
  const mediaFallback = mediaWrapper?.querySelector('[data-media-initial]');
  const mediaPrev = mediaWrapper?.querySelector('[data-media-prev]');
  const mediaNext = mediaWrapper?.querySelector('[data-media-next]');
  const mediaView = mediaWrapper?.querySelector('[data-media-view]');
  const createdEl = root.querySelector('[data-created]');

  titleEl.textContent = listing.title || '未命名票券';
  descriptionEl.textContent = listing.description?.trim() || '暫無補充資訊。';
  const typeLabel = TYPE_LABELS[listing.type] || listing.type || '—';
  typeEl.textContent = typeLabel;
  categoryEl.textContent = listing.category || '—';
  quantityEl.textContent = listing.quantity || '—';
  deliveryEl.textContent = formatDeliveryMethod(listing.deliveryMethod);
  expiresEl.textContent = listing.expiresAt ? formatDateValue(listing.expiresAt) : '—';

  if (listing.buyNow) {
    priceEl.textContent = `NT$ ${Number(listing.buyNow).toLocaleString()}`;
  } else if (listing.faceValue) {
    priceEl.textContent = `原價 NT$ ${Number(listing.faceValue).toLocaleString()}`;
  } else {
    priceEl.textContent = '面議';
  }

  const contactParts = [];
  if (listing.sellerName) contactParts.push(listing.sellerName);
  if (listing.sellerContact) contactParts.push(listing.sellerContact);
  contactEl.textContent = contactParts.length ? contactParts.join(' / ') : '尚未提供聯絡資訊';

  tagsEl.innerHTML = '';
  if (listing.type) {
    const tag = document.createElement('span');
    tag.className = 'detail-tag';
    tag.textContent = typeLabel;
    tagsEl.appendChild(tag);
  }
  if (listing.urgency === 'urgent') {
    const tag = document.createElement('span');
    tag.className = 'detail-tag detail-tag-urgent';
    tag.textContent = '超急';
    tagsEl.appendChild(tag);
  }

  if (createdEl) {
    const createdValue = listing.createdAt ?? listing.created_at ?? null;
    createdEl.textContent = createdValue ? formatDateValue(createdValue) : '—';
  }

  const images = Array.isArray(listing.images)
    ? listing.images.slice()
    : parseImages(listing.images ?? null);
  if (!Array.isArray(listing.images)) {
    listing.images = images;
  }
  if (listing.imageUrl && !images.length) {
    images.push({ url: listing.imageUrl, name: listing.title || 'listing-image' });
  }
  const validImages = images.filter(image => image && image.url);

  const background = getCategoryBackground(listing.category);
  if (mediaWrapper) {
    mediaWrapper.style.background = background;
  }

  let currentSlideIndex = 0;
  const updateThumbnailState = index => {
    if (!galleryGrid) return;
    Array.from(galleryGrid.children).forEach((child, idx) => {
      child.classList.toggle('is-active', idx === index);
    });
  };

  let scrollToIndex = () => {};

  if (mediaSlider && mediaTrack) {
    if (cleanupSliderResize) {
      cleanupSliderResize();
      cleanupSliderResize = null;
    }

    mediaTrack.innerHTML = '';
    if (validImages.length) {
      mediaSlider.hidden = false;
      mediaTrack.innerHTML = '';
      validImages.forEach((image, index) => {
        const slide = document.createElement('button');
        slide.type = 'button';
        slide.className = 'detail-media-slide';
        slide.setAttribute('aria-label', `預覽圖片 ${index + 1}`);
        const slideImg = document.createElement('img');
        slideImg.src = image.url;
        slideImg.alt = image.name || listing.title || `刊登圖片 ${index + 1}`;
        slideImg.loading = 'lazy';
        slide.appendChild(slideImg);
        slide.addEventListener('click', event => {
          event.stopPropagation();
          openImageModal(validImages, index);
        });
        mediaTrack.appendChild(slide);
      });

      const showNav = validImages.length > 1;
      const updateNavState = () => {
        if (mediaPrev) {
          mediaPrev.hidden = !showNav;
          mediaPrev.disabled = !showNav || currentSlideIndex === 0;
        }
        if (mediaNext) {
          mediaNext.hidden = !showNav;
          mediaNext.disabled = !showNav || currentSlideIndex === validImages.length - 1;
        }
        updateThumbnailState(currentSlideIndex);
      };

      const alignSliderToCurrent = (behavior = 'smooth') => {
        const targetLeft = mediaSlider.clientWidth * currentSlideIndex;
        if (typeof mediaSlider.scrollTo === 'function') {
          mediaSlider.scrollTo({
            left: targetLeft,
            behavior
          });
        } else {
          mediaSlider.scrollLeft = targetLeft;
        }
      };

      scrollToIndex = (newIndex, behavior = 'smooth') => {
        const clamped = Math.max(0, Math.min(validImages.length - 1, newIndex));
        currentSlideIndex = clamped;
        alignSliderToCurrent(behavior);
        updateNavState();
      };

      scrollToIndex(currentSlideIndex, 'auto');

      mediaSlider.onscroll = () => {
        if (!validImages.length) return;
        const index = Math.round(mediaSlider.scrollLeft / Math.max(mediaSlider.clientWidth, 1));
        if (index !== currentSlideIndex) {
          currentSlideIndex = Math.max(0, Math.min(validImages.length - 1, index));
          updateNavState();
        }
      };

      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => {
          scrollToIndex(currentSlideIndex, 'auto');
        });
        observer.observe(mediaSlider);
        cleanupSliderResize = () => observer.disconnect();
      } else {
        const handleResize = () => {
          scrollToIndex(currentSlideIndex, 'auto');
        };
        window.addEventListener('resize', handleResize);
        cleanupSliderResize = () => window.removeEventListener('resize', handleResize);
      }

      if (mediaPrev) {
        mediaPrev.onclick = event => {
          event.stopPropagation();
          scrollToIndex(currentSlideIndex - 1);
        };
      }
      if (mediaNext) {
        mediaNext.onclick = event => {
          event.stopPropagation();
          scrollToIndex(currentSlideIndex + 1);
        };
      }
      if (mediaView) {
        mediaView.hidden = false;
        mediaView.textContent = validImages.length > 1 ? `查看 ${validImages.length} 張` : '查看大圖';
        mediaView.onclick = event => {
          event.stopPropagation();
          openImageModal(validImages, currentSlideIndex);
        };
      }
      if (mediaFallback) {
        mediaFallback.hidden = true;
      }
    } else {
      mediaTrack.innerHTML = '';
      mediaSlider.hidden = true;
      mediaSlider.scrollLeft = 0;
      mediaSlider.onscroll = null;
      if (mediaPrev) {
        mediaPrev.hidden = true;
        mediaPrev.onclick = null;
      }
      if (mediaNext) {
        mediaNext.hidden = true;
        mediaNext.onclick = null;
      }
      if (mediaView) {
        mediaView.hidden = true;
        mediaView.onclick = null;
      }
      if (cleanupSliderResize) {
        cleanupSliderResize();
        cleanupSliderResize = null;
      }
      if (mediaFallback) {
        const initial = (listing.category || listing.title || '票').trim().charAt(0);
        mediaFallback.textContent = initial ? initial.toUpperCase() : '票';
        mediaFallback.hidden = false;
      }
    }
  }

  if (!validImages.length && mediaFallback) {
    const initial = (listing.category || listing.title || '票').trim().charAt(0);
    mediaFallback.textContent = initial ? initial.toUpperCase() : '票';
    mediaFallback.hidden = false;
  }

  if (gallerySection && galleryGrid) {
    galleryGrid.innerHTML = '';
    if (validImages.length > 1) {
      validImages.forEach((image, index) => {
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = image.name || `刊登圖片 ${index + 1}`;
        img.loading = 'lazy';
        img.className = 'detail-gallery-img';
        if (index === currentSlideIndex) {
          img.classList.add('is-active');
        }
        img.addEventListener('click', () => {
          scrollToIndex(index);
        });
        galleryGrid.appendChild(img);
      });
      gallerySection.hidden = false;
      updateThumbnailState(currentSlideIndex);
    } else {
      gallerySection.hidden = true;
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const root = document.querySelector('[data-detail-root]');
  const emptyState = document.querySelector('[data-empty]');
  if (!root) return;

  const toggleEmptyState = (show = false, message = '') => {
    const card = root.querySelector('.detail-card');
    if (card) card.hidden = show;
    if (emptyState) {
      emptyState.hidden = !show;
      if (message) {
        const paragraph = emptyState.querySelector('p');
        if (paragraph) paragraph.textContent = message;
      }
    }
  };

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const listingId = searchParams.get('id') || hashParams.get('id');
  const payloadParam = searchParams.get('payload') || hashParams.get('data');

  if (!listingId && !payloadParam) {
    toggleEmptyState(true, '無法取得刊登資訊，請返回列表重新選擇。');
    return;
  }

  let listing = null;

  if (listingId && isSupabaseEnabled) {
    listing = await fetchListingById(listingId);
  } else if (listingId && !isSupabaseEnabled) {
    console.warn('Supabase 尚未設定，無法從遠端載入刊登資料。');
  }

  if (!listing) {
    listing = decodeListingPayload(payloadParam, listingId);
  }

  if (!listing) {
    toggleEmptyState(true, '找不到這筆刊登，或是您沒有存取權限。');
    return;
  }

  renderListing(listing, root);

  if (imageModalClose) imageModalClose.addEventListener('click', closeImageModal);
  if (imageModalBackdrop) imageModalBackdrop.addEventListener('click', closeImageModal);
  if (imageModalPrev) imageModalPrev.addEventListener('click', () => changeModalImage(-1));
  if (imageModalNext) imageModalNext.addEventListener('click', () => changeModalImage(1));
  document.addEventListener('keydown', handleModalKeydown);
});
