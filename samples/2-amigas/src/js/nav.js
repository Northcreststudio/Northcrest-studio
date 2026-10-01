/**
 * Sticky nav: adds a solid background once you scroll,
 * highlights the section in view, and runs the mobile menu.
 */
import { nav as navItems } from '../config/content.js';

export function initNav() {
  const header = document.getElementById('nav');
  const list = header.querySelector('[data-nav]');
  const burger = header.querySelector('.nav__burger');
  const menu = header.querySelector('.nav__menu');

  list.innerHTML = navItems.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join('');
  const links = [...list.querySelectorAll('a')];

  // Solid background after leaving the very top.
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const setOpen = (open) => {
    header.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', () => setOpen(!header.classList.contains('is-open')));
  links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('is-open')) {
      setOpen(false);
      burger.focus();
    }
  });
  menu.addEventListener('click', (e) => {
    if (e.target === menu) setOpen(false);
  });

  // Highlight the link for the section currently on screen.
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  sections.forEach((s) => io.observe(s));
}
