/* ============================================================
   R&M Detailing — interakcje
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Rok w stopce ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobilne menu ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Animacje przy przewijaniu ---------- */
  var animated = document.querySelectorAll('.animate-in');
  if ('IntersectionObserver' in window && animated.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    animated.forEach(function (el) { io.observe(el); });
  } else {
    animated.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Opinie (źródło: reviews.json, fallback: dane w HTML) ---------- */
  function initials(name) {
    var parts = (name || '?').trim().split(/\s+/);
    var s = parts[0] ? parts[0][0] : '?';
    if (parts[1]) s += parts[1][0];
    return s.toUpperCase();
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function renderReviews(list) {
    var grid = document.getElementById('reviewsGrid');
    if (!grid || !Array.isArray(list)) return;
    grid.innerHTML = list.map(function (r) {
      var hasText = r.tresc && r.tresc.trim().length;
      var text = hasText
        ? '<p class="review-card__text">' + esc(r.tresc) + '</p>'
        : '<p class="review-card__text review-card__text--empty">Ocena 5/5 bez komentarza.</p>';
      return '' +
        '<article class="review-card">' +
          '<div class="review-card__quote" aria-hidden="true">&#8220;</div>' +
          text +
          '<div class="review-card__foot">' +
            '<div class="review-card__avatar">' + esc(initials(r.autor)) + '</div>' +
            '<div>' +
              '<div class="review-card__name">' + esc(r.autor || 'Klient') + '</div>' +
              '<div class="review-card__meta">' + esc(r.zrodlo || 'Google') + ' · ' + esc(r.czas_publikacji || '') + '</div>' +
            '</div>' +
            '<div class="review-card__stars" aria-label="Ocena 5 na 5">★★★★★</div>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  function loadReviews() {
    // 1) próba pobrania z pliku reviews.json (gdy serwowane przez HTTP)
    fetch('reviews.json')
      .then(function (res) { if (!res.ok) throw new Error('no file'); return res.json(); })
      .then(renderReviews)
      .catch(function () {
        // 2) fallback — dane osadzone w HTML (działa też z file://)
        var el = document.getElementById('reviews-data');
        if (el) {
          try { renderReviews(JSON.parse(el.textContent)); } catch (e) {}
        }
      });
  }
  loadReviews();

  /* ---------- Galeria / karuzela (styl jak na SandSMeble) ---------- */
  var track = document.getElementById('galleryTrack');
  if (track) {
    var viewport = track.parentElement;
    var slides = track.querySelectorAll('.gallery__slide');
    var total = slides.length;
    var thumbsEl = document.getElementById('galleryThumbs');
    var thumbs = thumbsEl.querySelectorAll('.gallery__thumb');
    var counter = document.getElementById('gallCounter');
    var prevBtn = document.getElementById('gallPrev');
    var nextBtn = document.getElementById('gallNext');
    var current = 0;

    counter.textContent = '1 / ' + total;

    function fixSlideWidths() {
      var w = viewport.offsetWidth;
      slides.forEach(function (s) { s.style.width = w + 'px'; s.style.minWidth = w + 'px'; });
    }

    function goTo(idx) {
      current = (idx + total) % total;
      track.style.transform = 'translateX(-' + (current * viewport.offsetWidth) + 'px)';
      counter.textContent = (current + 1) + ' / ' + total;
      thumbs.forEach(function (t, i) { t.classList.toggle('active', i === current); });
      if (thumbs[current]) {
        thumbs[current].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }

    requestAnimationFrame(function () {
      fixSlideWidths();
      track.style.transform = 'translateX(0)';
      counter.textContent = '1 / ' + total;
      thumbs[0].classList.add('active');
    });

    window.addEventListener('resize', function () {
      fixSlideWidths();
      track.style.transition = 'none';
      track.style.transform = 'translateX(-' + (current * viewport.offsetWidth) + 'px)';
      requestAnimationFrame(function () { track.style.transition = ''; });
    }, { passive: true });

    prevBtn.addEventListener('click', function () { goTo(current - 1); });
    nextBtn.addEventListener('click', function () { goTo(current + 1); });
    thumbs.forEach(function (t, i) { t.addEventListener('click', function () { goTo(i); }); });

    // klawiatura
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    });

    // przesuwanie palcem (swipe)
    var startX = 0, moving = false;
    viewport.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; moving = true; }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      if (!moving) return;
      moving = false;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) goTo(current + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }
})();
