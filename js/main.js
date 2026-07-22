/* =========================================================
   Société Iftin — comportements du site
   ========================================================= */
(function(){
  "use strict";

  /* ---------- Stockage sécurisé (ne doit jamais faire planter le script) ---------- */
  const safeStorage = {
    get(store, key) {
      try { return store.getItem(key); } catch (e) { return null; }
    },
    set(store, key, value) {
      try { store.setItem(key, value); } catch (e) { /* silencieux */ }
    }
  };

  /* ---------- Navbar scroll + mobile toggle ---------- */
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('is-scrolled', window.scrollY > 12);
  }, { passive: true });

  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  navMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Language bubble ---------- */
  const langBubble = document.getElementById('langBubble');
  const langToggle = document.getElementById('langToggle');
  const langMenu = document.getElementById('langMenu');
  const langCurrent = document.getElementById('langCurrent');

  function applyLanguage(lang) {
    const dict = translations[lang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
    });

    const isRTL = RTL_LANGS.includes(lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');

    langCurrent.textContent = lang.toUpperCase();
    langMenu.querySelectorAll('button').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-lang') === lang);
    });

    safeStorage.set(localStorage, 'iftin_lang', lang);

    // Re-render le contenu de la section bétail immersive (titre/desc/bouton galerie)
    // Re-render le panneau bétail actif (textes "Voir la galerie" / "Photo à venir")
    renderShowcaseMedia(showcasePhoto.getAttribute('data-species') || 'camel');
    document.querySelectorAll('.acc-photo').forEach(renderAccPhoto);
  }

  langToggle.addEventListener('click', () => {
    const open = langBubble.classList.toggle('is-open');
    langToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.addEventListener('click', (e) => {
    if (!langBubble.contains(e.target)) {
      langBubble.classList.remove('is-open');
      langToggle.setAttribute('aria-expanded', 'false');
    }
  });

  langMenu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      applyLanguage(btn.getAttribute('data-lang'));
      langBubble.classList.remove('is-open');
      langToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Showcase (clic sur le nom -> détails + photos) ---------- */
  const speciesMap = {
    camel:      { title: 'gallery_camel_title',      desc: 'gallery_camel_desc' },
    cattle:     { title: 'gallery_cattle_title',      desc: 'gallery_cattle_desc' },
    goat:       { title: 'gallery_goat_title',        desc: 'gallery_goat_desc' },
    sheep:      { title: 'gallery_sheep_title',       desc: 'gallery_sheep_desc' },
    logistics:  { title: 'gallery_logistics_title',   desc: 'gallery_logistics_desc' }
  };
  const speciesPhotos = {
    camel: ['images/gallery/camel-1.jpg', 'images/gallery/camel-2.jpg', 'images/gallery/camel-3.jpg', 'images/gallery/camel-4.jpg'],
    cattle: ['images/gallery/cattle-1.jpg', 'images/gallery/cattle-2.jpg', 'images/gallery/cattle-3.jpg', 'images/gallery/cattle-4.jpg'],
    goat: ['images/gallery/goat-pen.jpg', 'images/gallery/goat-landscape.jpg', 'images/gallery/goat-closeup.jpg'],
    sheep: ['images/gallery/sheep-1.jpg', 'images/gallery/sheep-2.jpg', 'images/gallery/sheep-3.jpg', 'images/gallery/sheep-4.jpg', 'images/gallery/sheep-5.jpg', 'images/gallery/sheep-6.jpg', 'images/gallery/sheep-7.jpg'],
    logistics: ['images/gallery/hay-bales.jpg']
  };
  const showcaseTabs = document.querySelectorAll('.showcase__tab');
  const showcasePhoto = document.getElementById('showcasePhoto');
  const showcaseTitle = document.getElementById('showcaseTitle');
  const showcaseDesc = document.getElementById('showcaseDesc');
  const showcaseTextWrap = document.querySelector('.showcase__text');
  let carouselTimer = null;

  function currentLangCode() {
    return document.documentElement.getAttribute('lang') || 'fr';
  }

  function stopCarousel() {
    if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }
  }

  function setActivePhoto(index) {
    const imgs = showcasePhoto.querySelectorAll('.showcase__img');
    const dots = showcasePhoto.querySelectorAll('.showcase__dot');
    imgs.forEach((img, i) => img.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  }

  function restartCarousel(species, count) {
    stopCarousel();
    let current = 0;
    carouselTimer = setInterval(() => {
      current = (current + 1) % count;
      setActivePhoto(current);
    }, 4200);
  }

  function renderShowcaseMedia(species) {
    stopCarousel();
    const photos = speciesPhotos[species] || [];
    showcasePhoto.innerHTML = '';
    showcasePhoto.setAttribute('data-species', species);

    if (photos.length === 0) {
      const span = document.createElement('span');
      span.className = 'showcase__soon';
      span.setAttribute('data-i18n', 'gallery_photo_soon');
      span.textContent = translations[currentLangCode()].gallery_photo_soon;
      showcasePhoto.appendChild(span);
      return;
    }

    photos.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      img.className = 'showcase__img' + (i === 0 ? ' is-active' : '');
      showcasePhoto.appendChild(img);
    });
    showcasePhoto.classList.add('has-photos');

    const hint = document.createElement('span');
    hint.className = 'showcase__hint';
    const dict = translations[currentLangCode()];
    hint.textContent = photos.length > 1
      ? `🔍 ${dict.gallery_view_gallery} (${photos.length})`
      : `🔍 ${dict.gallery_view_zoom}`;
    showcasePhoto.appendChild(hint);

    if (photos.length > 1) {
      const dots = document.createElement('div');
      dots.className = 'showcase__dots';
      photos.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'showcase__dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', `Photo ${i + 1}`);
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          setActivePhoto(i);
          restartCarousel(species, photos.length);
        });
        dots.appendChild(dot);
      });
      showcasePhoto.appendChild(dots);
      restartCarousel(species, photos.length);
    }

    if (!showcasePhoto.dataset.lightboxBound) {
      showcasePhoto.addEventListener('click', () => {
        const imgs = showcasePhoto.querySelectorAll('.showcase__img');
        let activeIndex = 0;
        imgs.forEach((img, i) => { if (img.classList.contains('is-active')) activeIndex = i; });
        openLightbox(showcasePhoto.getAttribute('data-species'), activeIndex);
      });
      showcasePhoto.dataset.lightboxBound = '1';
    }
  }

  function setShowcase(species) {
    const dict = translations[currentLangCode()];
    const map = speciesMap[species];
    if (!map) return;

    showcaseTextWrap.classList.add('is-fading');
    setTimeout(() => {
      showcaseTitle.textContent = dict[map.title];
      showcaseTitle.setAttribute('data-i18n', map.title);
      showcaseDesc.textContent = dict[map.desc];
      showcaseDesc.setAttribute('data-i18n', map.desc);
      showcaseTextWrap.classList.remove('is-fading');
    }, 180);

    renderShowcaseMedia(species);

    showcaseTabs.forEach(t => {
      const active = t.getAttribute('data-target') === species;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  showcaseTabs.forEach(tab => {
    tab.addEventListener('click', () => setShowcase(tab.getAttribute('data-target')));
    tab.addEventListener('mouseenter', stopCarousel);
  });
  showcasePhoto.parentElement.addEventListener('mouseleave', () => {
    const species = showcasePhoto.getAttribute('data-species');
    const count = (speciesPhotos[species] || []).length;
    if (count > 1) restartCarousel(species, count);
  });

  renderShowcaseMedia('camel');

  /* ---------- Accordéon mobile (même principe, sans scroll horizontal) ---------- */
  function renderAccPhoto(container) {
    const species = container.getAttribute('data-species');
    const photos = speciesPhotos[species] || [];
    container.innerHTML = '';

    if (photos.length === 0) {
      const span = document.createElement('span');
      span.className = 'acc-photo__soon';
      span.setAttribute('data-i18n', 'gallery_photo_soon');
      span.textContent = translations[currentLangCode()].gallery_photo_soon;
      container.appendChild(span);
      return;
    }

    const img = document.createElement('img');
    img.src = photos[0];
    img.alt = '';
    img.loading = 'lazy';
    container.appendChild(img);
    container.classList.add('has-photos');

    const hint = document.createElement('span');
    hint.className = 'acc-photo__hint';
    const dict = translations[currentLangCode()];
    hint.textContent = photos.length > 1
      ? `🔍 ${dict.gallery_view_gallery} (${photos.length})`
      : `🔍 ${dict.gallery_view_zoom}`;
    container.appendChild(hint);

    if (!container.dataset.lightboxBound) {
      container.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(species, 0);
      });
      container.dataset.lightboxBound = '1';
    }
  }

  document.querySelectorAll('.acc-photo').forEach(renderAccPhoto);

  const accItems = document.querySelectorAll('.acc-item');
  accItems.forEach(item => {
    const header = item.querySelector('.acc-header');
    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      accItems.forEach(i => {
        i.classList.remove('is-open');
        i.querySelector('.acc-header').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- Lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxFooter = lightbox.querySelector('.lightbox__footer');
  let lbSpecies = null;
  let lbIndex = 0;

  function openLightbox(species, index) {
    const photos = speciesPhotos[species] || [];
    if (photos.length === 0) return;
    lbSpecies = species;
    lbIndex = index;
    updateLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const multi = photos.length > 1;
    lightboxFooter.style.display = multi ? 'flex' : 'none';
  }

  function updateLightbox() {
    const photos = speciesPhotos[lbSpecies] || [];
    lightboxImg.src = photos[lbIndex];
    lightboxCounter.textContent = photos.length > 1 ? `${lbIndex + 1} / ${photos.length}` : '';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function lbStep(dir) {
    const photos = speciesPhotos[lbSpecies] || [];
    if (photos.length < 2) return;
    lbIndex = (lbIndex + dir + photos.length) % photos.length;
    updateLightbox();
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => lbStep(-1));
  lightboxNext.addEventListener('click', () => lbStep(1));
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lightboxImg.parentElement) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lbStep(-1);
    if (e.key === 'ArrowRight') lbStep(1);
  });

  /* --- Swipe tactile --- */
  let lbTouchX = null;
  lightbox.addEventListener('touchstart', (e) => {
    lbTouchX = e.touches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (lbTouchX === null) return;
    const diff = e.changedTouches[0].clientX - lbTouchX;
    if (Math.abs(diff) > 50) lbStep(diff < 0 ? 1 : -1);
    lbTouchX = null;
  }, { passive: true });

  /* ---------- Hero parallax (subtle) ---------- */
  const heroArt = document.querySelector('.hero__artimg');
  if (heroArt && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < 700) heroArt.style.transform = `translateY(${y * 0.08}px)`;
    }, { passive: true });
  }

  /* ---------- KLIK floating badge -> descends into footer ---------- */
  const klikFloat = document.getElementById('klikFloat');

  function showKlikFloat() {
    if (!klikFloat) return;
    setTimeout(() => {
      klikFloat.classList.add('is-shown');
      setTimeout(() => {
        klikFloat.classList.remove('is-shown');
        klikFloat.classList.add('is-hidden');
      }, 10000);
    }, 400);
  }

  /* ---------- Intro / opening screen ---------- */
  const introScreen = document.getElementById('introScreen');
  const introLangButtons = introScreen.querySelectorAll('.intro__langgrid button');

  function closeIntro() {
    introScreen.classList.add('is-leaving');
    document.body.classList.remove('intro-lock');
    setTimeout(() => { introScreen.style.display = 'none'; }, 550);
    showKlikFloat();
  }

  // L'écran de choix de langue s'affiche systématiquement à chaque chargement de page.
  introLangButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      applyLanguage(btn.getAttribute('data-lang'));
      closeIntro();
    });
  });

  /* ---------- Contact form -> Email / WhatsApp ---------- */
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');

  function currentLang() {
    return document.documentElement.getAttribute('lang') || 'fr';
  }

  function buildMessage() {
    const dict = translations[currentLang()];
    const company = document.getElementById('f_company').value.trim();
    const email = document.getElementById('f_email').value.trim();
    const phone = document.getElementById('f_phone').value.trim();
    const country = document.getElementById('f_country').value.trim();
    const message = document.getElementById('f_message').value.trim();

    const lines = [
      dict.wa_intro,
      '',
      `${dict.wa_company} : ${company}`,
      `${dict.wa_email} : ${email}`,
      `${dict.wa_phone} : ${phone}`,
      `${dict.wa_country} : ${country}`,
      `${dict.wa_message} : ${message}`
    ];
    return lines.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const action = e.submitter ? e.submitter.getAttribute('data-action') : 'whatsapp';

    if (!form.checkValidity()) {
      formNote.hidden = false;
      form.reportValidity();
      return;
    }
    formNote.hidden = true;

    const dict = translations[currentLang()];
    const body = buildMessage();

    if (action === 'whatsapp') {
      const url = `https://wa.me/251911375973?text=${encodeURIComponent(body)}`;
      window.open(url, '_blank');
    } else {
      const subject = encodeURIComponent(dict.email_subject);
      const mailBody = encodeURIComponent(body);
      window.location.href = `mailto:zoukari@hotmail.com?subject=${subject}&body=${mailBody}`;
    }
  });

  // Langue initiale : mémorisée, sinon celle du navigateur, sinon FR
  // (placé en fin de script pour que toutes les fonctions/données utilisées
  // par applyLanguage — filières, lightbox, etc. — soient déjà définies)
  (function initLang() {
    const saved = safeStorage.get(localStorage, 'iftin_lang');
    if (saved && translations[saved]) return applyLanguage(saved);

    const browser = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    const supported = ['fr', 'en', 'ar', 'so', 'am'];
    applyLanguage(supported.includes(browser) ? browser : 'fr');
  })();

})();
