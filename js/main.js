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
