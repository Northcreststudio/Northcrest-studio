/**
 * Newsletter signup: front-end only (no data is sent anywhere).
 * To make it real, point the form at Netlify Forms, Mailchimp,
 * etc. and replace the fake "send" below.
 */
import { contact } from '../config/content.js';

export function initSignup() {
  const form = document.querySelector('[data-signup]');
  const input = form.querySelector('[data-signup-input]');
  const msg = form.querySelector('[data-signup-msg]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    input.setAttribute('aria-invalid', String(!valid));
    if (!valid) {
      msg.textContent = 'Enter a full email address, like name@example.com.';
      form.classList.remove('is-success');
      form.classList.add('is-error');
      input.focus();
      return;
    }
    form.classList.remove('is-error');
    form.classList.add('is-success');
    msg.textContent = contact.success;
    input.value = '';
  });
  input.addEventListener('input', () => {
    if (form.classList.contains('is-error')) {
      form.classList.remove('is-error');
      input.removeAttribute('aria-invalid');
      msg.textContent = '';
    }
  });
}
