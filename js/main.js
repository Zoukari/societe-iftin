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
    // Re-render le panneau bétail (textes "Voir la galerie" / "Photo à venir")
    const activeCard = document.querySelector('.g5card.is-active');
    if (activeCard) renderG5Panel(activeCard.getAttribute('data-species'));
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

  /* ---------- Grille 5 cartes (2 lignes, tout visible) ---------- */
  const speciesMap = {
    camel:      { title: 'gallery_camel_title',    desc: 'gallery_camel_desc' },
    cattle:     { title: 'gallery_cattle_title',    desc: 'gallery_cattle_desc' },
    goat:       { title: 'gallery_goat_title',      desc: 'gallery_goat_desc' },
    sheep:      { title: 'gallery_sheep_title',     desc: 'gallery_sheep_desc' },
    logistics:  { title: 'gallery_logistics_title', desc: 'gallery_logistics_desc' }
  };
  const speciesPhotos = {
    camel: ['images/gallery/camel-1.jpg', 'images/gallery/camel-2.jpg', 'images/gallery/camel-3.jpg', 'images/gallery/camel-4.jpg'],
    cattle: ['images/gallery/cattle-1.jpg', 'images/gallery/cattle-2.jpg', 'images/gallery/cattle-3.jpg', 'images/gallery/cattle-4.jpg'],
    goat: ['images/gallery/goat-pen.jpg', 'images/gallery/goat-landscape.jpg', 'images/gallery/goat-closeup.jpg'],
    sheep: ['images/gallery/sheep-1.jpg', 'images/gallery/sheep-2.jpg', 'images/gallery/sheep-3.jpg', 'images/gallery/sheep-4.jpg', 'images/gallery/sheep-5.jpg', 'images/gallery/sheep-6.jpg', 'images/gallery/sheep-7.jpg'],
    logistics: ['images/gallery/hay-bales.jpg']
  };

  function currentLangCode() {
    return document.documentElement.getAttribute('lang') || 'fr';
  }

  const g5Cards = document.querySelectorAll('.g5card');
  const g5Photo = document.getElementById('g5Photo');
  const g5Title = document.getElementById('g5Title');
  const g5Desc = document.getElementById('g5Desc');
  const g5Panel = document.querySelector('.g5panel');
  let g5Carousel = null;

  function stopG5Carousel() {
    if (g5Carousel) { clearInterval(g5Carousel); g5Carousel = null; }
  }

  function setG5ActivePhoto(index) {
    const imgs = g5Photo.querySelectorAll('img.g5panel__img');
    const dots = g5Photo.querySelectorAll('.showcase__dot');
    imgs.forEach((img, i) => img.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  }

  function renderG5Panel(species) {
    stopG5Carousel();
    const photos = speciesPhotos[species] || [];
    // vider sauf le hint qu'on recrée
    g5Photo.innerHTML = '';
    g5Photo.setAttribute('data-species', species);
    g5Photo.classList.remove('has-photos');

    if (photos.length === 0) {
      const span = document.createElement('span');
      span.className = 'g5panel__photo__soon';
      span.setAttribute('data-i18n', 'gallery_photo_soon');
      span.textContent = translations[currentLangCode()].gallery_photo_soon;
      g5Photo.appendChild(span);
      return;
    }

    photos.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      img.className = 'g5panel__img' + (i === 0 ? ' is-active' : '');
      g5Photo.appendChild(img);
    });
    g5Photo.classList.add('has-photos');

    const hint = document.createElement('span');
    hint.className = 'g5panel__photo__hint';
    const dict = translations[currentLangCode()];
    hint.textContent = photos.length > 1
      ? `🔍 ${dict.gallery_view_gallery} (${photos.length})`
      : `🔍 ${dict.gallery_view_zoom}`;
    hint.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(species, 0);
    });
    g5Photo.appendChild(hint);

    if (photos.length > 1) {
      const dotsEl = document.createElement('div');
      dotsEl.className = 'showcase__dots';
      photos.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'showcase__dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', `Photo ${i + 1}`);
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          setG5ActivePhoto(i);
          stopG5Carousel();
        });
        dotsEl.appendChild(dot);
      });
      g5Photo.appendChild(dotsEl);

      // auto-advance
      let cur = 0;
      g5Carousel = setInterval(() => {
        cur = (cur + 1) % photos.length;
        setG5ActivePhoto(cur);
      }, 4200);
    }

    if (!g5Photo.dataset.lightboxBound) {
      g5Photo.addEventListener('click', () => {
        const imgs = g5Photo.querySelectorAll('img.g5panel__img');
        let activeIndex = 0;
        imgs.forEach((img, i) => { if (img.classList.contains('is-active')) activeIndex = i; });
        openLightbox(g5Photo.getAttribute('data-species'), activeIndex);
      });
      g5Photo.dataset.lightboxBound = '1';
    }
  }

  function setG5Species(species) {
    const dict = translations[currentLangCode()];
    const map = speciesMap[species];
    if (!map) return;

    g5Panel.classList.add('is-fading');
    setTimeout(() => {
      g5Title.textContent = dict[map.title];
      g5Title.setAttribute('data-i18n', map.title);
      g5Desc.textContent = dict[map.desc];
      g5Desc.setAttribute('data-i18n', map.desc);
      renderG5Panel(species);
      g5Panel.classList.remove('is-fading');
    }, 180);

    g5Cards.forEach(c => c.classList.toggle('is-active', c.getAttribute('data-species') === species));
  }

  g5Cards.forEach(card => {
    card.addEventListener('click', () => setG5Species(card.getAttribute('data-species')));
  });

  // init avec "camel"
  setG5Species('camel');

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
