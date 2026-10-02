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

window.handleTurnstileError = function () {
  const formMessage = document.querySelector("#form-message");

  if (formMessage) {
    formMessage.textContent =
      "The security check could not be completed. Please refresh the page and try again.";

    formMessage.hidden = false;
  }
};

const params = new URLSearchParams(window.location.search);
const error = params.get("error");
const formMessage = document.querySelector("#form-message");

const errorMessages = {
  missing: "Please complete all required fields and try again.",
  email: "Please enter a valid email address.",
  service: "Please choose a valid service.",
  year: "Please enter the vehicle year using four digits.",
  message: "Please add a little more information about what you need.",
  verification:
    "The security check could not be completed. Please try again.",
  send:
    "Your enquiry could not be sent. Please try again in a moment.",
  server:
    "Something went wrong while sending your enquiry. Please try again."
};

if (error && formMessage) {
  formMessage.textContent =
    errorMessages[error] ||
    "Something went wrong. Please check the form and try again.";

  formMessage.hidden = false;
  formMessage.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}