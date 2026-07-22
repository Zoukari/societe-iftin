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

    // Re-render le contenu de la section bétail immersive (titre/desc/bouton galerie)
    if (typeof refreshBeastActive === 'function' && refreshBeastActive) refreshBeastActive();
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

  const speciesOrder = ['camel', 'cattle', 'goat', 'sheep', 'logistics'];
  const speciesKeys = {
    camel:      { title: 'gallery_camel_title',     desc: 'gallery_camel_desc' },
    cattle:     { title: 'gallery_cattle_title',     desc: 'gallery_cattle_desc' },
    goat:       { title: 'gallery_goat_title',       desc: 'gallery_goat_desc' },
    sheep:      { title: 'gallery_sheep_title',      desc: 'gallery_sheep_desc' },
    logistics:  { title: 'gallery_logistics_title',  desc: 'gallery_logistics_desc' }
  };

  /* ---------- Beast scroller (section immersive à fond animé) ---------- */
  const beastScroller = document.getElementById('beastScroller');
  const beastBg = document.getElementById('beastBg');
  const beastProgress = document.getElementById('beastProgress');
  const beastContent = document.querySelector('.beast-content');
  const beastNum = document.getElementById('beastNum');
  const beastTitle = document.getElementById('beastTitle');
  const beastDesc = document.getElementById('beastDesc');
  const beastViewBtn = document.getElementById('beastViewBtn');
  let beastActive = -1;
  let refreshBeastActive = null;

  if (beastScroller) {
    const bgImgs = Array.from(beastBg.querySelectorAll('img'));
    // charge la première photo dispo de chaque espèce comme fond
    bgImgs.forEach(img => {
      const species = img.getAttribute('data-species');
      const photos = speciesPhotos[species] || [];
      if (photos.length) img.src = photos[0];
    });

    speciesOrder.forEach((species, i) => {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', species);
      if (i === 0) dot.classList.add('is-active');
      dot.addEventListener('click', () => {
        const top = beastScroller.offsetTop + (beastScroller.offsetHeight / speciesOrder.length) * i + 10;
        window.scrollTo({ top, behavior: 'smooth' });
      });
      beastProgress.appendChild(dot);
    });
    const progressDots = Array.from(beastProgress.children);

    function setBeastActive(index, force) {
      if (index === beastActive && !force) return;
      beastActive = index;
      const species = speciesOrder[index];
      const dict = translations[currentLangCode()];
      const map = speciesKeys[species];

      bgImgs.forEach(img => img.classList.toggle('is-active', img.getAttribute('data-species') === species));
      progressDots.forEach((d, i) => d.classList.toggle('is-active', i === index));

      beastContent.classList.remove('is-in');
      setTimeout(() => {
        beastNum.textContent = String(index + 1).padStart(2, '0');
        beastTitle.textContent = dict[map.title];
        beastTitle.setAttribute('data-i18n', map.title);
        beastDesc.textContent = dict[map.desc];
        beastDesc.setAttribute('data-i18n', map.desc);

        const photos = speciesPhotos[species] || [];
        if (photos.length > 1) {
          beastViewBtn.hidden = false;
          beastViewBtn.querySelector('span').textContent = `${dict.gallery_view_gallery} (${photos.length})`;
        } else if (photos.length === 1) {
          beastViewBtn.hidden = false;
          beastViewBtn.querySelector('span').textContent = dict.gallery_view_zoom;
        } else {
          beastViewBtn.hidden = true;
        }
        beastContent.classList.add('is-in');
      }, 120);
    }

    beastViewBtn.addEventListener('click', () => openLightbox(speciesOrder[beastActive], 0));
    refreshBeastActive = () => setBeastActive(beastActive < 0 ? 0 : beastActive, true);

    function onBeastScroll() {
      const rect = beastScroller.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      const index = Math.min(speciesOrder.length - 1, Math.floor(progress * speciesOrder.length));
      setBeastActive(index);
    }

    let beastTicking = false;
    window.addEventListener('scroll', () => {
      if (!beastTicking) {
        beastTicking = true;
        requestAnimationFrame(() => { onBeastScroll(); beastTicking = false; });
      }
    }, { passive: true });

    setBeastActive(0);
    onBeastScroll();
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
