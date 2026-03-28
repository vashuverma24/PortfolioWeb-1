const revealItems = Array.from(document.querySelectorAll('.reveal'));
const navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));
const sections = Array.from(document.querySelectorAll('section[id]'));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = document.querySelector('.hero');
const heroDot = document.querySelector('.hero-dot');
const modalButtons = Array.from(document.querySelectorAll('[data-modal-open]'));
const modals = Array.from(document.querySelectorAll('[data-modal]'));
const askAiOpenButtons = Array.from(document.querySelectorAll('[data-ask-ai-open]'));
const askAiForm = document.querySelector('[data-ask-ai-form]');
const askAiInput = document.querySelector('[data-ask-ai-input]');
const askAiLog = document.querySelector('[data-ask-ai-log]');
const askAiChips = Array.from(document.querySelectorAll('[data-ask-ai-prompt]'));
const askAiSubmit = document.querySelector('.ask-ai-submit');
const askAiHistory = [];

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

const setAskAiPending = (isPending) => {
  if (askAiInput) askAiInput.disabled = isPending;
  if (askAiSubmit) askAiSubmit.disabled = isPending;
  askAiChips.forEach((chip) => {
    chip.disabled = isPending;
  });
};

const appendAskAiMessage = (role, message) => {
  if (!askAiLog) return;

  const bubble = document.createElement('div');
  bubble.className = `ask-ai-message ask-ai-message-${role}`;
  bubble.textContent = message;
  askAiLog.appendChild(bubble);
  askAiLog.scrollTop = askAiLog.scrollHeight;
};

const appendAskAiLoadingMessage = () => {
  if (!askAiLog) return null;

  const bubble = document.createElement('div');
  bubble.className = 'ask-ai-message ask-ai-message-assistant ask-ai-message-loading';
  bubble.textContent = 'Thinking...';
  askAiLog.appendChild(bubble);
  askAiLog.scrollTop = askAiLog.scrollHeight;
  return bubble;
};

const requestAskAiReply = async (question) => {
  try {
    const response = await fetch('/api/ask-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        history: askAiHistory.slice(-8),
        pageTitle: document.title,
        pagePath: window.location.pathname,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.answer) {
      throw new Error(data?.error || 'AI request failed');
    }

    return data.answer;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed';
    return `Ask AI is unavailable right now. ${message}`;
  }
};

const submitAskAiPrompt = async (message) => {
  const prompt = message.trim();
  if (!prompt || !askAiLog) return;

  appendAskAiMessage('user', prompt);
  askAiHistory.push({ role: 'user', content: prompt });

  setAskAiPending(true);
  const loadingBubble = appendAskAiLoadingMessage();
  const answer = await requestAskAiReply(prompt);

  if (loadingBubble) {
    loadingBubble.remove();
  }

  appendAskAiMessage('assistant', answer);
  askAiHistory.push({ role: 'assistant', content: answer });
  setAskAiPending(false);
};

const initAskAi = () => {
  if (!askAiLog || askAiLog.childElementCount) return;

  appendAskAiMessage(
    'assistant',
    'Hi. I can answer questions about Sachin’s projects, skills, experience, education, and contact details.'
  );
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

if (modalButtons.length && modals.length) {
  const syncModalLock = () => {
    const hasBlockingModal = modals.some((modal) => !modal.hidden && !modal.classList.contains('ask-ai-modal'));
    document.body.classList.toggle('modal-open', hasBlockingModal);
  };

  const setModalState = (modal, isOpen) => {
    modal.hidden = !isOpen;
    syncModalLock();
  };

  const closeAllModals = () => {
    modals.forEach((modal) => setModalState(modal, false));
  };

  modalButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetModal = document.getElementById(button.dataset.modalOpen);
      if (!targetModal) return;

      closeAllModals();
      setModalState(targetModal, true);
    });
  });

  modals.forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.closest('[data-modal-close]')) {
        setModalState(modal, false);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllModals();
    }
  });

  syncModalLock();
}

if (askAiOpenButtons.length) {
  askAiOpenButtons.forEach((button) => {
    button.addEventListener('click', initAskAi);
  });
}

if (askAiChips.length) {
  askAiChips.forEach((chip) => {
    chip.addEventListener('click', async () => {
      initAskAi();
      await submitAskAiPrompt(chip.dataset.askAiPrompt || '');
    });
  });
}

if (askAiForm && askAiInput) {
  askAiForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    initAskAi();
    await submitAskAiPrompt(askAiInput.value);
    askAiInput.value = '';
    askAiInput.focus();
  });
}
