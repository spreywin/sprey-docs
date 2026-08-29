(() => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'scroll-to-top';
  button.setAttribute('aria-label', 'Scroll to top');
  button.title = 'Back to top';
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>';
  document.body.appendChild(button);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateVisibility = () => {
    button.classList.toggle('is-visible', window.scrollY > 420);
  };

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });

  window.addEventListener('scroll', updateVisibility, { passive: true });
  updateVisibility();
})();
