const revealItems = Array.from(document.querySelectorAll('.reveal'));
const navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));
const sections = Array.from(document.querySelectorAll('section[id]'));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = document.querySelector('.hero');
const heroDot = document.querySelector('.hero-dot');

const markActiveLink = (id) => {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('is-active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: '0px 0px -6% 0px',
    }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleEntries.length) {
        markActiveLink(visibleEntries[0].target.id);
      }
    },
    {
      threshold: [0.3, 0.5, 0.7],
      rootMargin: '-18% 0px -42% 0px',
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

if (hero && heroDot && !prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
  let heroRect = null;
  let dotX = 0;
  let dotY = 0;
  let frameId = 0;

  const updateHeroRect = () => {
    heroRect = hero.getBoundingClientRect();
  };

  const setHeroDotPosition = (x, y) => {
    hero.style.setProperty('--hero-dot-x', `${x}px`);
    hero.style.setProperty('--hero-dot-y', `${y}px`);
  };

  const renderHeroDot = () => {
    setHeroDotPosition(dotX, dotY);
    frameId = 0;
  };

  const queueHeroDotPosition = (x, y) => {
    dotX = x;
    dotY = y;

    if (!frameId) {
      frameId = window.requestAnimationFrame(renderHeroDot);
    }
  };

  const showHeroDot = () => {
    hero.style.setProperty('--hero-dot-opacity', '1');
  };

  const hideHeroDot = () => {
    hero.style.setProperty('--hero-dot-opacity', '0');
  };

  const resetHeroDot = () => {
    if (!heroRect) updateHeroRect();
    queueHeroDotPosition(heroRect.width * 0.82, heroRect.height * 0.24);
  };

  hero.addEventListener('pointerenter', () => {
    updateHeroRect();
    showHeroDot();
  });

  hero.addEventListener('pointermove', (event) => {
    if (!heroRect) updateHeroRect();
    queueHeroDotPosition(event.clientX - heroRect.left, event.clientY - heroRect.top);
    showHeroDot();
  });

  hero.addEventListener('pointerleave', () => {
    hideHeroDot();
    resetHeroDot();
  });
  window.addEventListener('resize', () => {
    updateHeroRect();
    resetHeroDot();
  });
  window.addEventListener('scroll', updateHeroRect, { passive: true });

  hideHeroDot();
  updateHeroRect();
  resetHeroDot();
}
