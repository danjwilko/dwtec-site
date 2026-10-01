const menu = document.querySelector('.menu');
const links = document.querySelector('.nav-links');

function setMenu(open) {
  if (!menu || !links) return;
  links.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}

if (menu && links) {
  menu.addEventListener('click', () => {
    setMenu(!links.classList.contains('open'));
  });

  links.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setMenu(false);
      menu.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) setMenu(false);
  });
}

document.querySelectorAll('[data-year]').forEach(el => {
  el.textContent = new Date().getFullYear();
});
