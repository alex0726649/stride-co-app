// Mejoras progresivas: todas las páginas funcionan igual sin este archivo.
// No guarda ni muestra datos del negocio (sin localStorage, sessionStorage ni innerHTML).

// Pide confirmación antes de enviar un formulario marcado con data-confirm="texto".
document.addEventListener('submit', event => {
  const form = event.target;
  const message = form.getAttribute('data-confirm');
  if (message && !window.confirm(message)) event.preventDefault();
});

// Muestra u oculta una contraseña: <button data-toggle-password="idDelInput">.
document.addEventListener('click', event => {
  const button = event.target.closest('[data-toggle-password]');
  if (!button) return;
  const input = document.getElementById(button.getAttribute('data-toggle-password'));
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  const icon = button.querySelector('i');
  if (icon) icon.className = input.type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
});
