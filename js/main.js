/* =========================================================
   Société Iftin — comportements du site
   ========================================================= */
(function(){
  "use strict";

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

    localStorage.setItem('iftin_lang', lang);

    // Re-render les vignettes filières (textes "Voir la galerie" / "Photo à venir")
    document.querySelectorAll('.slide__photo').forEach(renderFilierePhoto);
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

  /* ---------- Filières (photos + lightbox) ---------- */
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

  function renderFilierePhoto(container) {
    const species = container.getAttribute('data-species');
    const photos = speciesPhotos[species] || [];
    container.innerHTML = '';

    if (photos.length === 0) {
      const span = document.createElement('span');
      span.className = 'slide__soon';
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
    hint.className = 'slide__hint';
    const dict = translations[currentLangCode()];
    hint.textContent = photos.length > 1
      ? `🔍 ${dict.gallery_view_gallery} (${photos.length})`
      : `🔍 ${dict.gallery_view_zoom}`;
    container.appendChild(hint);

    if (!container.dataset.lightboxBound) {
      container.addEventListener('click', () => openLightbox(species, 0));
      container.dataset.lightboxBound = '1';
    }
  }

  document.querySelectorAll('.slide__photo').forEach(renderFilierePhoto);

  /* ---------- Filmstrip (défilement horizontal + dots) ---------- */
  const filmstrip = document.getElementById('filmstrip');
  const filmstripDots = document.getElementById('filmstripDots');
  const filmstripPrev = document.getElementById('filmstripPrev');
  const filmstripNext = document.getElementById('filmstripNext');

  if (filmstrip) {
    const slides = Array.from(filmstrip.querySelectorAll('.slide'));
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      if (i === 0) dot.classList.add('is-active');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => {
        slides[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      });
      filmstripDots.appendChild(dot);
    });
    const dots = Array.from(filmstripDots.children);

    function updateActiveDot() {
      const scrollLeft = filmstrip.scrollLeft;
      let closest = 0;
      let minDist = Infinity;
      slides.forEach((s, i) => {
        const dist = Math.abs(s.offsetLeft - filmstrip.offsetLeft - scrollLeft);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      dots.forEach((d, i) => d.classList.toggle('is-active', i === closest));
    }
    filmstrip.addEventListener('scroll', () => {
      window.clearTimeout(filmstrip._t);
      filmstrip._t = window.setTimeout(updateActiveDot, 80);
    }, { passive: true });

    filmstripPrev && filmstripPrev.addEventListener('click', () => {
      filmstrip.scrollBy({ left: -(slides[0].offsetWidth + 20), behavior: 'smooth' });
    });
    filmstripNext && filmstripNext.addEventListener('click', () => {
      filmstrip.scrollBy({ left: slides[0].offsetWidth + 20, behavior: 'smooth' });
    });
  }

  /* ---------- Lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxClose = document.getElementById('lightboxClose');
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
    lightboxPrev.style.display = multi ? 'flex' : 'none';
    lightboxNext.style.display = multi ? 'flex' : 'none';
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
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lbStep(-1);
    if (e.key === 'ArrowRight') lbStep(1);
  });

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
    sessionStorage.setItem('iftin_intro_seen', '1');
    setTimeout(() => { introScreen.style.display = 'none'; }, 550);
    showKlikFloat();
  }

  if (sessionStorage.getItem('iftin_intro_seen')) {
    introScreen.style.display = 'none';
    document.body.classList.remove('intro-lock');
    showKlikFloat();
  } else {
    introLangButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        applyLanguage(btn.getAttribute('data-lang'));
        closeIntro();
      });
    });
  }

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
    const action = e.submitter ? e.submitter.getAttribute('data-action') : 'email';

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
    const saved = localStorage.getItem('iftin_lang');
    if (saved && translations[saved]) return applyLanguage(saved);

    const browser = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    const supported = ['fr', 'en', 'ar', 'so', 'am'];
    applyLanguage(supported.includes(browser) ? browser : 'fr');
  })();

})();
