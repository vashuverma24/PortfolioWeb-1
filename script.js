const revealItems = Array.from(document.querySelectorAll('.reveal'));
const navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));
const sections = Array.from(document.querySelectorAll('section[id]'));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = document.querySelector('.hero');
const heroDot = document.querySelector('.hero-dot');
const globalCursor = document.querySelector('.global-cursor');
const modalButtons = Array.from(document.querySelectorAll('[data-modal-open]'));
const modals = Array.from(document.querySelectorAll('[data-modal]'));
const askAiOpenButtons = Array.from(document.querySelectorAll('[data-ask-ai-open]'));
const askAiDrawer = document.querySelector('[data-ask-ai-drawer]');
const askAiCloseButtons = Array.from(document.querySelectorAll('[data-ask-ai-close]'));
const askAiForm = document.querySelector('[data-ask-ai-form]');
const askAiInput = document.querySelector('[data-ask-ai-input]');
const askAiLog = document.querySelector('[data-ask-ai-log]');
const askAiSubmit = document.querySelector('.ask-ai-submit');
const askAiHistory = [];
const GROQ_API_KEY = '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';

const markActiveLink = (id) => {
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    const isActive = href === `#${id}`;
    link.classList.toggle('is-active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

// Scroll to section when clicking nav links
navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href').substring(1);
    markActiveLink(targetId);
  });
});

const setAskAiPending = (isPending) => {
  if (askAiInput) askAiInput.disabled = isPending;
  if (askAiSubmit) askAiSubmit.disabled = isPending;
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
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are Sachin Tarkar's portfolio assistant. Keep responses SHORT and CONCISE - 1-2 sentences max.

ABOUT SACHIN:
- iOS App Developer & UI/UX Designer
- B.Tech Computer Science & Engineering, Galgotias University (2022-2026), CGPA: 8.29
- Selected iOS Developer at iOS Development Center (Powered by Apple & Infosys)
- iOS App Developer Intern at Infosys Ltd., Mysore

PROJECTS:
- LeoLingo: Speech therapy iPad app for children using SwiftUI, Firebase, UI/UX design
- PrePlus: AI study companion with SwiftUI, AI integration, Supabase
- MediOps: Healthcare management app with Swift, UIKit, Supabase, role-based access
- Gravity: Swift Student Challenge 2025 - planet gravity simulation with SwiftUI, SceneKit
- HeyMadhav: Bhagavad Gita learning app with SwiftUI, AI integration

SKILLS:
Languages: Swift, SwiftUI, UIKit, Java, Python
Tools: Xcode, VS Code, Git, GitHub, Figma
Frameworks: Firebase, Supabase, SceneKit
Concepts: Data Structures, Algorithms, OOP, DBMS

EXPERIENCE:
- Scrum Master & team facilitator at Infosys
- Built SwiftUI modules for hospital management systems
- Worked with designers and backend engineers on production apps

CONTACT:
- Email: tarkarsachin842@gmail.com
- Phone: +91 9568635207
- LinkedIn: /in/sachin-tarkar
- GitHub: /SachinTarkar842
- Instagram: @sachinarjunsingh

Answer questions accurately based on this information. Be helpful and direct.`
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || 'API request failed');
    }

    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('No response from API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'API request failed';
    return `Sorry, I couldn't process that. ${message}`;
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
    'Hi. Ask me anything about Sachin’s work.'
  );
};

const setAskAiState = (isOpen) => {
  if (!askAiDrawer) return;

  askAiDrawer.hidden = !isOpen;

  if (isOpen) {
    initAskAi();
    if (askAiInput) {
      window.requestAnimationFrame(() => askAiInput.focus());
    }
  }
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

if (!('IntersectionObserver' in window) && sections.length && navLinks.length) {
  window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      
      if (window.pageYOffset >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });
    
    if (current) {
      markActiveLink(current);
    }
  }, { passive: true });
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

if (askAiOpenButtons.length && askAiDrawer) {
  askAiOpenButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setAskAiState(true);
    });
  });
}

if (askAiCloseButtons.length) {
  askAiCloseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setAskAiState(false);
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

if (globalCursor && !prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
  let cursorX = 0;
  let cursorY = 0;
  let frameId = 0;
  let targetX = 0;
  let targetY = 0;
  let cursorAngle = 0;
  let prevX = 0;
  let prevY = 0;
  let lastSparkleTime = 0;
  let isAnimating = false;
  let animationStartTime = 0;
  const animationDuration = 6000; // 6 seconds

  // Get text element for animation
  const textElement = document.querySelector('.hero h1');
  const heroSection = document.querySelector('.hero');
  let currentMouseX = window.innerWidth / 2;
  let currentMouseY = window.innerHeight / 2;
  
  // Start animation on page load
  const startDrawingAnimation = () => {
    if (!textElement || !heroSection) return;
    
    isAnimating = true;
    animationStartTime = Date.now();
    
    // Get hero bounds
    const heroBounds = heroSection.getBoundingClientRect();
    const textBounds = textElement.getBoundingClientRect();
    
    // Start from left edge of text, middle height
    const startX = textBounds.left;
    const startY = textBounds.top + textBounds.height / 2;
    
    // End at right edge of text
    const endX = textBounds.right;
    const endY = textBounds.top + textBounds.height / 2;
    
    cursorX = startX;
    cursorY = startY;
    targetX = startX;
    targetY = startY;
    prevX = startX;
    prevY = startY;
    
    // Responsive cursor size based on screen width
    let cursorSize = '3.8rem';
    if (window.innerWidth < 768) {
      cursorSize = '2.8rem';
    }
    if (window.innerWidth < 480) {
      cursorSize = '2.2rem';
    }
    
    globalCursor.style.width = cursorSize;
    globalCursor.style.height = cursorSize;
    
    // Animate plane across text
    const animateAcrossText = () => {
      const elapsed = Date.now() - animationStartTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Phase 1: Move across text (0-0.70)
      if (progress < 0.70) {
        const textProgress = progress / 0.70;
        // Smoother easing curve for movement
        const easeProgress = textProgress < 0.5 
          ? 2 * textProgress * textProgress 
          : -1 + (4 - 2 * textProgress) * textProgress;
        
        // Linear path across entire text width
        targetX = startX + (endX - startX) * easeProgress;
        // Slight wave motion
        targetY = startY + Math.sin(easeProgress * Math.PI) * 50;
        
        // Calculate rotation angle based on movement direction
        cursorAngle = calculateAngle(prevX, prevY, targetX, targetY);
        prevX = targetX;
        prevY = targetY;
        
        // Create more sparkles during animation
        createAnimationSparkles(cursorX, cursorY);
      }
      // Phase 2: Move away to current mouse position (0.70-1)
      else if (progress < 1) {
        const transitionProgress = (progress - 0.70) / 0.30;
        // Smooth easing for transition
        const easeTransition = transitionProgress < 0.5
          ? 2 * transitionProgress * transitionProgress
          : -1 + (4 - 2 * transitionProgress) * transitionProgress;
        
        targetX = endX + (currentMouseX - endX) * easeTransition;
        targetY = endY + (currentMouseY - endY) * easeTransition;
        
        // Calculate rotation angle based on movement direction
        cursorAngle = calculateAngle(prevX, prevY, targetX, targetY);
        prevX = targetX;
        prevY = targetY;
        
        // Gradually decrease cursor size back to normal
        const sizeProgress = transitionProgress;
        const normalSize = window.innerWidth < 768 ? 1.5 : 1.8;
        const maxSize = window.innerWidth < 768 ? 2.8 : (window.innerWidth < 480 ? 2.2 : 3.8);
        const currentSize = maxSize - (maxSize - normalSize) * sizeProgress;
        globalCursor.style.width = currentSize + 'rem';
        globalCursor.style.height = currentSize + 'rem';
        
        createAnimationSparkles(cursorX, cursorY);
      } else {
        isAnimating = false;
        // Reset cursor size
        const normalSize = window.innerWidth < 768 ? 1.5 : 1.8;
        globalCursor.style.width = normalSize + 'rem';
        globalCursor.style.height = normalSize + 'rem';
      }
      
      if (isAnimating) {
        requestAnimationFrame(animateAcrossText);
      }
    };
    
    animateAcrossText();
  };

  const createAnimationSparkles = (x, y) => {
    // Create more sparkles during animation (5-8 per frame for bigger effect)
    const sparkleCount = 5 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'cursor-sparkle';
      sparkle.style.left = x + 'px';
      sparkle.style.top = y + 'px';
      
      // Random sparkle direction
      const angle = Math.random() * Math.PI * 2;
      const distance = 10 + Math.random() * 32;
      const sparkleX = Math.cos(angle) * distance;
      const sparkleY = Math.sin(angle) * distance;
      
      sparkle.style.setProperty('--sparkle-x', `${sparkleX}px`);
      sparkle.style.setProperty('--sparkle-y', `${sparkleY}px`);
      document.body.appendChild(sparkle);
      
      setTimeout(() => sparkle.remove(), 500);
    }
  };

  const updateCursorPosition = () => {
    // Use cubic easing for smoother movement
    const dx = targetX - cursorX;
    const dy = targetY - cursorY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Adaptive easing based on distance
    let easeAmount = 0.15;
    if (distance < 5) {
      easeAmount = 0.2;
    } else if (distance > 100) {
      easeAmount = 0.12;
    }
    
    cursorX += dx * easeAmount;
    cursorY += dy * easeAmount;

    globalCursor.style.setProperty('--cursor-x', `${cursorX}px`);
    globalCursor.style.setProperty('--cursor-y', `${cursorY}px`);
    globalCursor.style.setProperty('--cursor-angle', `${cursorAngle}deg`);
    frameId = window.requestAnimationFrame(updateCursorPosition);
  };

  const calculateAngle = (fromX, fromY, toX, toY) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return angle;
  };

  const createSparkles = (x, y) => {
    const now = Date.now();
    if (now - lastSparkleTime < 20) return;
    lastSparkleTime = now;

    const sparkleCount = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'cursor-sparkle';
      sparkle.style.left = x + 'px';
      sparkle.style.top = y + 'px';
      
      const tailAngle = cursorAngle + 180;
      const distance = 6 + Math.random() * 18;
      const sparkleX = Math.cos((tailAngle * Math.PI) / 180) * distance;
      const sparkleY = Math.sin((tailAngle * Math.PI) / 180) * distance;
      
      sparkle.style.setProperty('--sparkle-x', `${sparkleX}px`);
      sparkle.style.setProperty('--sparkle-y', `${sparkleY}px`);
      document.body.appendChild(sparkle);
      
      setTimeout(() => sparkle.remove(), 500);
    }
  };

  const showCursor = () => {
    globalCursor.style.opacity = '1';
  };

  const hideCursor = () => {
    globalCursor.style.opacity = '0';
  };

  // Start animation when page loads
  const initAnimation = () => {
    startDrawingAnimation();
    // Start the update loop
    if (!frameId) {
      frameId = window.requestAnimationFrame(updateCursorPosition);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimation);
  } else {
    initAnimation();
  }

  document.addEventListener('mousemove', (event) => {
    // Always track current mouse position for animation destination
    currentMouseX = event.clientX;
    currentMouseY = event.clientY;
    
    if (isAnimating) return;
    
    targetX = event.clientX;
    targetY = event.clientY;
    
    if (Math.abs(prevX - targetX) > 0.5 || Math.abs(prevY - targetY) > 0.5) {
      cursorAngle = calculateAngle(prevX, prevY, targetX, targetY);
    }
    prevX = targetX;
    prevY = targetY;
    
    showCursor();
    createSparkles(cursorX, cursorY);

    if (!frameId) {
      frameId = window.requestAnimationFrame(updateCursorPosition);
    }
  }, { passive: true });

  document.addEventListener('mouseenter', () => {
    showCursor();
  });

  document.addEventListener('mouseleave', () => {
    hideCursor();
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  });

  // Scroll-based plane animation
  let lastScrollSparkleTime = 0;
  const scrollSparkleDelay = 50; // milliseconds between sparkles during scroll

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrolled / docHeight;

    if (!isAnimating) {
      // Move cursor based on scroll position
      const maxX = window.innerWidth * 0.8;
      const startX = window.innerWidth * 0.1;
      targetX = startX + (maxX - startX) * scrollPercent;
      targetY = window.innerHeight * (0.2 + scrollPercent * 0.3);

      // Calculate angle based on scroll direction
      cursorAngle = calculateAngle(prevX, prevY, targetX, targetY);
      prevX = targetX;
      prevY = targetY;

      // Add scroll sparkles
      const now = Date.now();
      if (now - lastScrollSparkleTime > scrollSparkleDelay && scrollPercent > 0 && scrollPercent < 1) {
        lastScrollSparkleTime = now;
        createScrollSparkles(cursorX, cursorY);
      }
    }
  }, { passive: true });
}

// Skills Cylinder Rotation
const skillsCylinder = document.getElementById('skillsCylinder');
const skillsCylinderStage = document.getElementById('skillsCylinderStage');
if (skillsCylinder && skillsCylinderStage) {
  const cylinderFaces = Array.from(skillsCylinder.querySelectorAll('.cylinder-face'));
  const faceButtons = Array.from(document.querySelectorAll('[data-cylinder-face]'));
  const skillsStageLabel = document.getElementById('skillsStageLabel');
  const skillsStageCurrent = document.getElementById('skillsStageCurrent');
  const faceCount = cylinderFaces.length || 1;
  const snapAngle = 360 / faceCount;

  let cylinderRotation = 0;
  let isDragging = false;
  let isTwisting = false;
  let lastX = 0;
  let velocity = 0;
  let animationFrame = null;
  let touchStartAngle = 0;
  let touchStartMidX = 0;
  let twistStartRotation = 0;
  let lastGestureRotation = 0;

  const setCylinderInteracting = (isInteracting) => {
    skillsCylinder.classList.toggle('is-interacting', isInteracting);
  };

  const stopAnimation = () => {
    if (!animationFrame) return;
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  };

  const applyCylinderTransform = () => {
    skillsCylinder.style.transform =
      `translateZ(calc(var(--cylinder-radius) * -1)) rotateY(${cylinderRotation}deg)`;
  };

  const getActiveFaceIndex = () => (
    ((-Math.round(cylinderRotation / snapAngle)) % faceCount + faceCount) % faceCount
  );

  const updateActiveFaceUI = () => {
    const activeIndex = getActiveFaceIndex();
    const activeLabel = cylinderFaces[activeIndex]?.dataset.faceLabel || '';

    if (skillsStageLabel) {
      skillsStageLabel.textContent = activeLabel;
    }

    if (skillsStageCurrent) {
      skillsStageCurrent.textContent = String(activeIndex + 1).padStart(2, '0');
    }

    faceButtons.forEach((button, index) => {
      const isActive = index === activeIndex;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });
  };

  const rotateCylinder = (angle) => {
    cylinderRotation = angle;
    applyCylinderTransform();
    updateActiveFaceUI();
  };

  const snapToNearestFace = () => {
    const snapped = Math.round(cylinderRotation / snapAngle) * snapAngle;
    setCylinderInteracting(false);
    velocity = 0;
    rotateCylinder(snapped);
  };

  const updateCylinderGeometry = () => {
    if (faceCount < 3) return;

    const faceWidth = skillsCylinder.offsetWidth;
    if (!faceWidth) return;

    const radius = Math.max(118, Math.min(faceWidth * 0.36, 168));
    skillsCylinder.style.setProperty('--cylinder-radius', `${radius}px`);
    applyCylinderTransform();
  };

  const goToFace = (targetIndex) => {
    const normalizedIndex = ((targetIndex % faceCount) + faceCount) % faceCount;
    stopAnimation();
    setCylinderInteracting(false);
    velocity = 0;
    rotateCylinder(normalizedIndex * -snapAngle);
  };

  const nextFace = () => {
    goToFace(getActiveFaceIndex() + 1);
  };

  const prevFace = () => {
    goToFace(getActiveFaceIndex() - 1);
  };

  const animate = () => {
    if (Math.abs(velocity) > 0.1) {
      cylinderRotation += velocity;
      velocity *= 0.92;
      rotateCylinder(cylinderRotation);
      animationFrame = requestAnimationFrame(animate);
    } else {
      animationFrame = null;
      snapToNearestFace();
    }
  };

  const startDrag = (clientX) => {
    isDragging = true;
    isTwisting = false;
    lastX = clientX;
    velocity = 0;
    stopAnimation();
    setCylinderInteracting(true);
  };

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    animate();
  };

  const getTouchAngle = (touch1, touch2) => (
    Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX)
  );

  const getTouchMidX = (touch1, touch2) => (
    (touch1.clientX + touch2.clientX) / 2
  );

  const normalizeAngleDelta = (angle) => {
    if (angle > 180) return angle - 360;
    if (angle < -180) return angle + 360;
    return angle;
  };

  const startTwist = (touch1, touch2) => {
    isTwisting = true;
    isDragging = false;
    touchStartAngle = getTouchAngle(touch1, touch2);
    touchStartMidX = getTouchMidX(touch1, touch2);
    twistStartRotation = cylinderRotation;
    lastGestureRotation = cylinderRotation;
    velocity = 0;
    stopAnimation();
    setCylinderInteracting(true);
  };

  // Button controls
  const prevBtn = document.querySelector('.cylinder-nav-prev');
  const nextBtn = document.querySelector('.cylinder-nav-next');

  if (prevBtn) prevBtn.addEventListener('click', prevFace);
  if (nextBtn) nextBtn.addEventListener('click', nextFace);
  faceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetIndex = Number(button.dataset.cylinderFace);
      if (!Number.isNaN(targetIndex)) {
        goToFace(targetIndex);
      }
    });
  });

  // Mouse drag
  skillsCylinderStage.tabIndex = 0;
  skillsCylinderStage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevFace();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextFace();
    }
  });

  skillsCylinderStage.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startDrag(e.clientX);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastX;
    velocity = deltaX * 0.5;
    cylinderRotation += velocity;
    rotateCylinder(cylinderRotation);
    lastX = e.clientX;
  });

  document.addEventListener('mouseup', () => {
    endDrag();
  });

  skillsCylinderStage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      startTwist(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
      e.preventDefault();
      startDrag(e.touches[0].clientX);
    }
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && isTwisting) {
      e.preventDefault();
      const currentAngle = getTouchAngle(e.touches[0], e.touches[1]);
      const currentMidX = getTouchMidX(e.touches[0], e.touches[1]);
      const angleDelta = normalizeAngleDelta(
        (currentAngle - touchStartAngle) * (180 / Math.PI)
      );
      const midXDelta = currentMidX - touchStartMidX;
      const nextRotation = twistStartRotation + angleDelta * 1.45 + midXDelta * 0.42;

      velocity = nextRotation - lastGestureRotation;
      lastGestureRotation = nextRotation;
      rotateCylinder(nextRotation);
    } else if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      const deltaX = e.touches[0].clientX - lastX;
      velocity = deltaX * 0.45;
      cylinderRotation += velocity;
      rotateCylinder(cylinderRotation);
      lastX = e.touches[0].clientX;
    }
  }, { passive: false });

  const handleTouchRelease = (e) => {
    if (isTwisting) {
      e.preventDefault();
      if (e.touches.length === 2) {
        touchStartAngle = getTouchAngle(e.touches[0], e.touches[1]);
        touchStartMidX = getTouchMidX(e.touches[0], e.touches[1]);
        twistStartRotation = cylinderRotation;
        lastGestureRotation = cylinderRotation;
        return;
      }

      isTwisting = false;

      if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX);
        return;
      }

      animate();
    } else if (isDragging && e.touches.length === 0) {
      e.preventDefault();
      endDrag();
    }
  };

  document.addEventListener('touchend', handleTouchRelease, { passive: false });
  document.addEventListener('touchcancel', handleTouchRelease, { passive: false });

  ['gesturestart', 'gesturechange', 'gestureend'].forEach((eventName) => {
    skillsCylinderStage.addEventListener(eventName, (event) => {
      event.preventDefault();
    }, { passive: false });
  });

  window.addEventListener('resize', updateCylinderGeometry, { passive: true });
  updateCylinderGeometry();
  goToFace(0);
}

const createScrollSparkles = (x, y) => {
  // Create fewer sparkles for scroll (2-3 per event)
  const sparkleCount = 2 + Math.floor(Math.random() * 2);
  
  for (let i = 0; i < sparkleCount; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'cursor-sparkle';
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';
    
    // Random sparkle direction
    const angle = Math.random() * Math.PI * 2;
    const distance = 8 + Math.random() * 20;
    const sparkleX = Math.cos(angle) * distance;
    const sparkleY = Math.sin(angle) * distance;
    
    sparkle.style.setProperty('--sparkle-x', `${sparkleX}px`);
    sparkle.style.setProperty('--sparkle-y', `${sparkleY}px`);
    document.body.appendChild(sparkle);
    
    setTimeout(() => sparkle.remove(), 400);
  }
};

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setAskAiState(false);
  }
});
