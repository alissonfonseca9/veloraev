(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const views = [
    { key: 'frontal', title: 'Dianteira 3/4', eyebrow: 'EXTERIOR', short: 'Dianteira' },
    { key: 'lateral', title: 'Perfil lateral', eyebrow: 'EXTERIOR', short: 'Lateral' },
    { key: 'traseira', title: 'Traseira 3/4', eyebrow: 'EXTERIOR', short: 'Traseira' },
    { key: 'movimento', title: 'Em movimento', eyebrow: 'DINÂMICA', short: 'Movimento' },
    { key: 'interior', title: 'Interior do veículo', eyebrow: 'CABINE', short: 'Interior' },
  ];
  const models = {
    s9: {
      suffix: 'S9', type: 'GRAND TOURER ELÉTRICO', color: 'GRAFITE LUNAR',
      colorCss: 'linear-gradient(145deg,#8b9297,#202a31)',
      description: 'Grand tourer de proporções baixas, superfícies esculturais e uma cabine pensada para uma experiência envolvente.'
    },
    x7: {
      suffix: 'X7', type: 'SUV ELÉTRICO CONCEITUAL', color: 'CINZA MINERAL',
      colorCss: 'linear-gradient(145deg,#a6a7a5,#343a3d)',
      description: 'Um SUV de presença marcante, linhas precisas e interior acolhedor, imaginado para jornadas sem limites.'
    }
  };
  const state = { model: 's9', slide: 0, token: 0, lightboxOpen: false, lastFocus: null };
  const gallery = $('#gallery-panel');
  const mainImage = $('#gallery-image');
  const thumbs = $('#thumb-row');
  const lightbox = $('#lightbox');
  const imagePath = (model, slide) => {
    const view = views[slide].key;
    if (model === 's9' && view === 'interior') return 'assets/s9-interior-realista.jpg';
    if (model === 'x7' && view === 'interior') return 'assets/x7-interior-detalhado.jpg';
    if (view === 'movimento') return `assets/${model}-movimento-novo.png`;
    if (model === 'x7' && (view === 'lateral' || view === 'traseira')) return `assets/x7-${view}-realista.jpg`;
    return `assets/${model}-${view}.webp`;
  };
  const thumbPath = (model, slide) => {
    const view = views[slide].key;
    if (model === 's9' && view === 'interior') return 'assets/s9-interior-realista-thumb.jpg';
    if (model === 'x7' && view === 'interior') return 'assets/x7-interior-detalhado-thumb.jpg';
    if (model === 'x7' && (view === 'lateral' || view === 'traseira')) return `assets/x7-${view}-realista-thumb.jpg`;
    return view === 'movimento'
      ? imagePath(model, slide) : `assets/${model}-${view}-thumb.webp`;
  };
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Preload neighboring photos so taps and swipes feel immediate.
  function preloadAdjacent() {
    [-1, 1].forEach((delta) => {
      const image = new Image();
      image.src = imagePath(state.model, (state.slide + delta + views.length) % views.length);
    });
  }

  function buildThumbnails() {
    const fragment = document.createDocumentFragment();
    views.forEach((view, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thumb';
      button.dataset.slide = String(index);
      button.setAttribute('aria-label', `Ver ${view.title.toLowerCase()} do VELORA ${models[state.model].suffix}`);
      button.innerHTML = `<img decoding="async" src="${thumbPath(state.model, index)}" alt=""><span class="thumb-details"><span class="thumb-name">${view.short}</span></span>`;
      button.addEventListener('click', () => goToSlide(index));
      fragment.appendChild(button);
    });
    thumbs.replaceChildren(fragment);
  }

  function refreshThumbnails(shouldScroll = false) {
    $$('.thumb').forEach((button, index) => {
      const selected = index === state.slide;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-current', selected ? 'true' : 'false');
    });
    const active = thumbs.children[state.slide];
    if (active && shouldScroll && thumbs.scrollWidth > thumbs.clientWidth) {
      const left = active.offsetLeft - Math.max(0, (thumbs.clientWidth - active.clientWidth) / 2);
      thumbs.scrollTo({ left, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  }

  function setPhoto() {
    const token = ++state.token;
    const url = imagePath(state.model, state.slide);
    const alt = `VELORA ${models[state.model].suffix} — ${views[state.slide].title.toLowerCase()}`;
    mainImage.classList.add('changing');
    const temp = new Image();
    temp.onload = () => {
      if (token !== state.token) return;
      mainImage.src = url;
      mainImage.alt = alt;
      requestAnimationFrame(() => requestAnimationFrame(() => mainImage.classList.remove('changing')));
    };
    temp.onerror = () => {
      if (token !== state.token) return;
      mainImage.alt = 'A imagem não pôde ser carregada';
      mainImage.classList.remove('changing');
    };
    temp.src = url;
    if (temp.complete && temp.naturalWidth) temp.onload();
  }

  function updateLightbox() {
    if (!state.lightboxOpen) return;
    $('#lightbox-image').src = imagePath(state.model, state.slide);
    $('#lightbox-image').alt = `VELORA ${models[state.model].suffix} - ${views[state.slide].title.toLowerCase()}`;
    $('#lightbox-caption').textContent = `VELORA ${models[state.model].suffix}  /  ${views[state.slide].title.toUpperCase()}`;
  }

  function updateGallery(announce = true, scrollThumb = true) {
    const m = models[state.model];
    const v = views[state.slide];
    $('#active-type').textContent = m.type;
    $('#active-model').innerHTML = `VELORA <strong>${m.suffix}</strong>`;
    $('#paint-name').textContent = m.color;
    $('#paint-dot').style.background = m.colorCss;
    $('#image-type').textContent = v.eyebrow;
    $('#image-title').textContent = v.title;
    $('#gallery-description').textContent = m.description;
    $$('[data-spec-model]').forEach((specs) => { specs.hidden = specs.dataset.specModel !== state.model; });
    $$('.model-tab').forEach((tab) => {
      const selected = tab.dataset.model === state.model;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    gallery.setAttribute('aria-labelledby', `tab-${state.model}`);
    refreshThumbnails(scrollThumb);
    setPhoto();
    updateLightbox();
    preloadAdjacent();
    if (announce) $('#carousel-announcement').textContent = `VELORA ${m.suffix}. Foto ${state.slide + 1} de 5: ${v.title}.`;
  }

  function goToSlide(slide) {
    state.slide = (slide + views.length) % views.length;
    updateGallery();
  }

  function selectModel(model, focusTab = false, doScroll = false) {
    if (!models[model]) return;
    const different = model !== state.model;
    state.model = model;
    state.slide = 0;
    if (different) {
      buildThumbnails();
      $('#motion-img').src = imagePath(model, 3);
      $('#motion-img').alt = `VELORA ${models[model].suffix} em movimento`;
      $('#interior-img').src = imagePath(model, 4);
      $('#interior-img').alt = `Interior do VELORA ${models[model].suffix}`;
    }
    updateGallery(true, false);
    thumbs.scrollLeft = 0;
    if (focusTab) $(`#tab-${model}`).focus();
    if (doScroll) $('#galeria').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  buildThumbnails();
  updateGallery(false, false);
  $$('.model-tab').forEach((tab) => {
    tab.addEventListener('click', () => selectModel(tab.dataset.model));
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const other = tab.dataset.model === 's9' ? 'x7' : 's9';
      selectModel(other, true);
    });
  });
  $$('[data-select-model]').forEach((button) => {
    button.addEventListener('click', () => selectModel(button.dataset.selectModel, false, true));
  });
  $('#gallery-prev').addEventListener('click', () => goToSlide(state.slide - 1));
  $('#gallery-next').addEventListener('click', () => goToSlide(state.slide + 1));
  $$('[data-open-view]').forEach((button) => button.addEventListener('click', () => {
    goToSlide(Number(button.dataset.openView));
    $('#galeria').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }));

  // Touch swiping on the central stage and enlarged viewer, without blocking vertical scrolling.
  function enableSwipe(element) {
    let startX = 0, startY = 0, tracking = false;
    element.addEventListener('touchstart', (event) => {
      if (event.touches.length !== 1) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      tracking = true;
    }, { passive: true });
    element.addEventListener('touchend', (event) => {
      if (!tracking || event.changedTouches.length !== 1) return;
      tracking = false;
      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.3) goToSlide(state.slide + (dx < 0 ? 1 : -1));
    }, { passive: true });
    element.addEventListener('touchcancel', () => { tracking = false; }, { passive: true });
  }
  enableSwipe($('#gallery-stage'));
  enableSwipe($('#lightbox-stage'));

  function openLightbox() {
    state.lastFocus = document.activeElement;
    state.lightboxOpen = true;
    lightbox.hidden = false;
    document.body.classList.add('no-scroll');
    updateLightbox();
    $('#lightbox-close').focus();
  }
  function closeLightbox() {
    state.lightboxOpen = false;
    lightbox.hidden = true;
    document.body.classList.remove('no-scroll');
    if (state.lastFocus && state.lastFocus.isConnected) state.lastFocus.focus();
  }
  $('#expand-image').addEventListener('click', openLightbox);
  $('#lightbox-close').addEventListener('click', closeLightbox);
  $('#lightbox-prev').addEventListener('click', () => goToSlide(state.slide - 1));
  $('#lightbox-next').addEventListener('click', () => goToSlide(state.slide + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  lightbox.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [$('#lightbox-close'), $('#lightbox-prev'), $('#lightbox-next')];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('keydown', (event) => {
    if (state.lightboxOpen && event.key === 'Escape') { event.preventDefault(); closeLightbox(); return; }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (state.lightboxOpen) { event.preventDefault(); goToSlide(state.slide + (event.key === 'ArrowRight' ? 1 : -1)); return; }
    if (gallery.contains(document.activeElement) && !document.activeElement.classList.contains('model-tab')) {
      event.preventDefault();
      goToSlide(state.slide + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });

  // Mobile navigation and smart translucent header.
  const menuToggle = $('#mobile-menu-toggle'), mobileMenu = $('#mobile-menu');
  function setMenu(open) {
    mobileMenu.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  menuToggle.addEventListener('click', () => setMenu(mobileMenu.hidden));
  $$('#mobile-menu a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (innerWidth > 800) setMenu(false); }, { passive: true });
  const header = $('#site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 0);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Move only the decorative light trails, leaving links and touch scrolling native.
  const vision = $('#filosofia');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  function moveVisionTrails(event) {
    if (motionPreference.matches) return;
    const bounds = vision.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    const y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    vision.style.setProperty('--vision-x', x);
    vision.style.setProperty('--vision-y', y);
  }

  function resetVisionTrails() {
    vision.style.removeProperty('--vision-x');
    vision.style.removeProperty('--vision-y');
  }

  vision.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'touch') moveVisionTrails(event);
  }, { passive: true });
  vision.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') moveVisionTrails(event);
  }, { passive: true });
  vision.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'touch') resetVisionTrails();
  });
  vision.addEventListener('pointercancel', resetVisionTrails);
  motionPreference.addEventListener('change', resetVisionTrails);
})();
