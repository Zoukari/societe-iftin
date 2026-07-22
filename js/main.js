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
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
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

  // Langue initiale : mémorisée, sinon celle du navigateur, sinon FR
  (function initLang() {
    const saved = localStorage.getItem('iftin_lang');
    if (saved && translations[saved]) return applyLanguage(saved);

    const browser = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    const supported = ['fr', 'en', 'ar', 'so', 'am'];
    applyLanguage(supported.includes(browser) ? browser : 'fr');
  })();

  /* ---------- Showcase (onglets bétail) ---------- */
  const speciesMap = {
    camel:      { title: 'gallery_camel_title',      desc: 'gallery_camel_desc' },
    cattle:     { title: 'gallery_cattle_title',      desc: 'gallery_cattle_desc' },
    goat:       { title: 'gallery_goat_title',        desc: 'gallery_goat_desc' },
    sheep:      { title: 'gallery_sheep_title',       desc: 'gallery_sheep_desc' },
    logistics:  { title: 'gallery_logistics_title',   desc: 'gallery_logistics_desc' }
  };
  const speciesPhotos = {
    camel: [],
    cattle: [],
    goat: ['images/gallery/goat-pen.jpg', 'images/gallery/goat-landscape.jpg', 'images/gallery/goat-closeup.jpg'],
    sheep: [],
    logistics: ['images/gallery/hay-bales.jpg']
  };
  const showcaseTabs = document.querySelectorAll('.showcase__tab');
  const showcasePhoto = document.getElementById('showcasePhoto');
  const showcaseTitle = document.getElementById('showcaseTitle');
  const showcaseDesc = document.getElementById('showcaseDesc');
  const showcaseTextWrap = document.querySelector('.showcase__text');
  let carouselTimer = null;

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
      span.textContent = translations[document.documentElement.getAttribute('lang') || 'fr'].gallery_photo_soon;
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

    if (photos.length > 1) {
      const dots = document.createElement('div');
      dots.className = 'showcase__dots';
      photos.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'showcase__dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', `Photo ${i + 1}`);
        dot.addEventListener('click', () => { setActivePhoto(i); restartCarousel(species, photos.length); });
        dots.appendChild(dot);
      });
      showcasePhoto.appendChild(dots);
      restartCarousel(species, photos.length);
    }
  }

  function setShowcase(species) {
    const dict = translations[document.documentElement.getAttribute('lang') || 'fr'];
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

  /* ---------- Trade zones map ---------- */
  const tradepins = document.querySelectorAll('.tradepin[data-country]');
  tradepins.forEach(pin => {
    const country = pin.getAttribute('data-country');
    const line = document.querySelector(`.tradeline[data-target="${country}"]`);
    if (!line) return;
    pin.addEventListener('mouseenter', () => line.classList.add('is-active'));
    pin.addEventListener('mouseleave', () => line.classList.remove('is-active'));
    pin.addEventListener('focus', () => line.classList.add('is-active'));
    pin.addEventListener('blur', () => line.classList.remove('is-active'));
  });

  /* ---------- Hero parallax (subtle) ---------- */
  const heroArt = document.querySelector('.hero__artimg');
  if (heroArt && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < 700) heroArt.style.transform = `translateY(${y * 0.08}px)`;
    }, { passive: true });
  }

  /* ---------- Intro / opening screen ---------- */
  const introScreen = document.getElementById('introScreen');
  const introLangButtons = introScreen.querySelectorAll('.intro__langgrid button');

  function closeIntro() {
    introScreen.classList.add('is-leaving');
    document.body.classList.remove('intro-lock');
    sessionStorage.setItem('iftin_intro_seen', '1');
    setTimeout(() => { introScreen.style.display = 'none'; }, 550);
  }

  if (sessionStorage.getItem('iftin_intro_seen')) {
    introScreen.style.display = 'none';
    document.body.classList.remove('intro-lock');
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

})();
