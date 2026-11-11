document.documentElement.classList.add('js');

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* Menu móvel */
const menuToggle = document.getElementById('menu-toggle');
const mobileNav = document.getElementById('mobile-nav');

function closeMenu() {
  mobileNav.classList.remove('active');
  menuToggle.classList.remove('active');
  menuToggle.setAttribute('aria-expanded', 'false');
}

menuToggle.addEventListener('click', () => {
  const isActive = mobileNav.classList.toggle('active');
  menuToggle.classList.toggle('active', isActive);
  menuToggle.setAttribute('aria-expanded', String(isActive));
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

/* Header com borda ao rolar */
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* Destaque do link da seção atual */
const navLinks = [...document.querySelectorAll('.nav a')];
const sections = navLinks
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window) {
  const navObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => navObs.observe(s));

}

/* Status aberto/fechado (horário de Itabuna, UTC-3) */
const statusEl = document.getElementById('open-status');
if (statusEl) {
  const now = new Date();
  const local = new Date(now.getTime() + now.getTimezoneOffset() * 60000 - 3 * 3600000);
  const day = local.getDay();
  const hour = local.getHours() + local.getMinutes() / 60;
  const open = day >= 1 && day <= 6 && hour >= 8 && hour < 18;
  statusEl.textContent = open ? 'Aberto agora' : 'Fechado agora';
  statusEl.classList.add(open ? 'is-open' : 'is-closed');
}

/* Galeria com lightbox */
const items = [...document.querySelectorAll('.gallery-item')];
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lightbox-img');
const lbCap = document.getElementById('lightbox-cap');
let current = 0;
let lastFocus = null;

function show(i) {
  current = (i + items.length) % items.length;
  const img = items[current].querySelector('img');
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  lbCap.textContent = items[current].querySelector('.gallery-cap')?.textContent || '';
}

function openLightbox(i) {
  lastFocus = document.activeElement;
  show(i);
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('lb-close').focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  lbImg.src = '';
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}

items.forEach((item, i) => item.addEventListener('click', () => openLightbox(i)));
document.getElementById('lb-close').addEventListener('click', closeLightbox);
document.getElementById('lb-prev').addEventListener('click', e => { e.stopPropagation(); show(current - 1); });
document.getElementById('lb-next').addEventListener('click', e => { e.stopPropagation(); show(current + 1); });
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (lightbox.hidden) {
    if (e.key === 'Escape' && mobileNav.classList.contains('active')) closeMenu();
    return;
  }
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') show(current - 1);
  if (e.key === 'ArrowRight') show(current + 1);
});

/* Swipe no celular */
let touchX = null;
lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  touchX = null;
});
