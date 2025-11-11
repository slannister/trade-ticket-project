const TYPE_LABELS = { auction: '出價', transfer: '讓票', swap: '交換' };

const formatDeliveryMethod = value => {
  if (!value) return '—';
  return value === 'meetup' ? '面交' : value === 'shipping' ? '寄件' : value;
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

  const images = Array.isArray(listing.images) ? listing.images.slice() : [];
  if (listing.imageUrl && !images.length) {
    images.push({ url: listing.imageUrl, name: listing.title || 'listing-image' });
  }
  const validImages = images.filter(image => image && image.url);

  const background = listing.__detailBackground || 'linear-gradient(160deg, rgba(91, 140, 255, 0.24), rgba(127, 91, 255, 0.18))';
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

      scrollToIndex = newIndex => {
        const clamped = Math.max(0, Math.min(validImages.length - 1, newIndex));
        currentSlideIndex = clamped;
        const targetLeft = mediaSlider.clientWidth * clamped;
        if (typeof mediaSlider.scrollTo === 'function') {
          mediaSlider.scrollTo({
            left: targetLeft,
            behavior: 'smooth'
          });
        } else {
          mediaSlider.scrollLeft = targetLeft;
        }
        updateNavState();
      };

      mediaSlider.scrollLeft = 0;
      updateNavState();

      mediaSlider.onscroll = () => {
        if (!validImages.length) return;
        const index = Math.round(mediaSlider.scrollLeft / Math.max(mediaSlider.clientWidth, 1));
        if (index !== currentSlideIndex) {
          currentSlideIndex = Math.max(0, Math.min(validImages.length - 1, index));
          updateNavState();
        }
      };

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

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-detail-root]');
  const emptyState = document.querySelector('[data-empty]');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const listingId = params.get('id');

  let listing = null;
  try {
    const stored = localStorage.getItem('selectedListing');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!listingId || (parsed && parsed.id && parsed.id.toString() === listingId)) {
        listing = parsed;
      }
    }
  } catch (error) {
    console.warn('無法解析快取的刊登資料', error);
  }

  if (!listing && listingId) {
    try {
      const cache = JSON.parse(localStorage.getItem('listingCache') || '{}');
      if (cache && cache[listingId]) {
        listing = cache[listingId];
      }
    } catch (error) {
      console.warn('無法從快取中讀取刊登資料', error);
    }
  }

  if (!listing) {
    if (emptyState) emptyState.hidden = false;
    root.innerHTML = '';
    return;
  }

  renderListing(listing, root);

  if (imageModalClose) imageModalClose.addEventListener('click', closeImageModal);
  if (imageModalBackdrop) imageModalBackdrop.addEventListener('click', closeImageModal);
  if (imageModalPrev) imageModalPrev.addEventListener('click', () => changeModalImage(-1));
  if (imageModalNext) imageModalNext.addEventListener('click', () => changeModalImage(1));
  document.addEventListener('keydown', handleModalKeydown);
});
