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
const GEMINI_API_KEY = 'AQ.Ab8RN6J8XoLYY1YT-ttSiiBdVKoSjQq1RDkFGtOFwS7JsIt_6A'; // Your Gemini API key

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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `You are Sachin Tarkar's portfolio assistant. Keep responses SHORT and CONCISE - 1-2 sentences max.

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
          }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: question }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || 'API request failed');
    }

    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('No response from API');
    }

    return data.candidates[0].content.parts[0].text;
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
      threshold: [0.1, 0.2, 0.3, 0.4, 0.5],
      rootMargin: '-10% 0px -30% 0px',
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  // Add a fallback for the very bottom of the page (Contact section)
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 50) {
      markActiveLink('contact');
    }
  }, { passive: true });
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
    
    // Total duration for the expanded sequence
    const totalDuration = 7000; 
    
    // Get text bounds
    const textBounds = textElement.getBoundingClientRect();
    
    // Start from further off-screen left for a longer approach
    const offscreenX = -500;
    const startX = textBounds.left;
    const startY = textBounds.top + textBounds.height / 2;
    
    // End at right edge of text
    const endX = textBounds.right;
    const endY = textBounds.top + textBounds.height / 2;

    // Get fusion stage
    const fusionStage = document.querySelector('.hero-fusion-stage');
    
    // Initial hardware-accel defaults
    cursorX = offscreenX;
    cursorY = startY - 100; // Start slightly higher for an approach arc
    targetX = offscreenX;
    targetY = startY - 100;
    prevX = offscreenX;
    prevY = startY - 100;
    
    // Initialize fusion effect (Blur + Contrast)
    if (fusionStage) {
      fusionStage.style.setProperty('--fusion-blur', '4px');
      fusionStage.style.setProperty('--fusion-contrast', '12'); 
    }
    
    // Reset any existing reveal
    textElement.style.setProperty('--reveal-pos', '0%');
    
    // Responsive cursor size (Scaled up per request)
    let cursorSize = '4.5rem';
    if (window.innerWidth < 768) cursorSize = '3.5rem';
    if (window.innerWidth < 480) cursorSize = '2.8rem';
    
    globalCursor.style.width = cursorSize;
    globalCursor.style.height = cursorSize;
    globalCursor.style.fontSize = cursorSize;
    globalCursor.style.filter = 'none';
    
    const animateAcrossText = () => {
      const elapsed = Date.now() - animationStartTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      
      // Improve smoothing by updating position factor during animation
      const lerp = (start, end, t) => start + (end - start) * t;

      // PHASE 0: Entry (0 - 0.22) - Slightly longer for smoother acceleration
      if (progress < 0.22) {
        const entryProgress = progress / 0.22;
        // High-order Ease-out for silky entry
        const easeEntry = 1 - Math.pow(1 - entryProgress, 5);
        
        targetX = offscreenX + (startX - offscreenX) * easeEntry;
        // Descending arc from (startY - 100) to startY
        targetY = (startY - 100) + (100 * easeEntry);
        
        // Direct catch-up for maximum smoothness during entry
        cursorX = targetX;
        cursorY = targetY;
        
        cursorAngle = calculateAngle(prevX, prevY, targetX, targetY);
        prevX = targetX;
        prevY = targetY;
        createAnimationSparkles(cursorX, cursorY);
      }
      // PHASE 1: Drawing Reveal (0.22 - 0.78)
      else if (progress < 0.78) {
        const drawProgress = (progress - 0.22) / 0.56;
        // Ultra-smooth Ease-in-out
        const easeDraw = drawProgress < 0.5 
          ? 8 * Math.pow(drawProgress, 4) 
          : 1 - Math.pow(-2 * drawProgress + 2, 4) / 2;
        
        targetX = startX + (endX - startX) * easeDraw;
        targetY = startY + Math.sin(drawProgress * Math.PI * 2) * 50;
        
        // Direct catch-up for maximum smoothness during drawing
        cursorX = targetX;
        cursorY = targetY;
        
        // Update text reveal mask sync with plane
        // Added a slight offset (easeDraw - 0.05) to ensure sparkles are ahead of the text reveal
        const revealPercent = Math.max(0, Math.min(100, (easeDraw - 0.04) * 105)); 
        textElement.style.setProperty('--reveal-pos', `${revealPercent}%`);
        
        cursorAngle = calculateAngle(prevX, prevY, targetX, targetY);
        prevX = targetX;
        prevY = targetY;
        
        // High-density sparkles for fusion effect
        createAnimationSparkles(cursorX, cursorY, true);
      }
      // PHASE 2: Transition to Mouse (0.75 - 1.0)
      else if (progress < 1) {
        const transitionProgress = (progress - 0.75) / 0.25;
        
        // Restore text crispness (Disable fusion) early for a snappier feel
        if (fusionStage) {
          fusionStage.style.setProperty('--fusion-blur', '0px');
          fusionStage.style.setProperty('--fusion-contrast', '1');
        }

        const easeTransition = transitionProgress < 0.5
          ? 2 * transitionProgress * transitionProgress
          : -1 + (4 - 2 * transitionProgress) * transitionProgress;
        
        // Ensure text is 100% revealed
        textElement.style.setProperty('--reveal-pos', '100%');
        
        targetX = endX + (currentMouseX - endX) * easeTransition;
        targetY = endY + (currentMouseY - endY) * easeTransition;
        
        // Scale down cursor (Crisply)
        const normalSize = window.innerWidth < 768 ? 1.5 : 1.8;
        const maxSize = parseFloat(cursorSize);
        const currentSize = maxSize - (maxSize - normalSize) * transitionProgress;
        
        globalCursor.style.width = currentSize + 'rem';
        globalCursor.style.height = currentSize + 'rem';
        // Force the text to stay crisp
        globalCursor.style.fontSize = currentSize + 'rem';
        globalCursor.style.filter = 'none';
        
        cursorAngle = calculateAngle(prevX, prevY, targetX, targetY);
        prevX = targetX;
        prevY = targetY;
        createAnimationSparkles(cursorX, cursorY);
      } else {
        isAnimating = false;
        textElement.style.setProperty('--reveal-pos', '100%');
        
        // Restore text crispness (Disable fusion)
        if (fusionStage) {
          fusionStage.style.setProperty('--fusion-blur', '0px');
          fusionStage.style.setProperty('--fusion-contrast', '1');
        }
        
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
;

  const createAnimationSparkles = (x, y, isDrawing = false) => {
    // Increased density during drawing phase
    const sparkleCount = isDrawing 
      ? 20 + Math.floor(Math.random() * 15) 
      : 8 + Math.floor(Math.random() * 6);
    
    const fusionStage = document.querySelector('.hero-fusion-stage');
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'cursor-sparkle';
      
      // Randomly choose between Gold (accent) and White sparkles
      const isGold = Math.random() > 0.45;
      const goldColor = '#c4956a'; // Explicit gold accent
      const whiteColor = '#ffffff';
      
      sparkle.style.background = isGold ? goldColor : whiteColor;
      
      // Enhanced Glow for maximum visibility
      const glowColor = isGold ? 'rgba(196, 149, 106, 0.8)' : 'rgba(255, 255, 255, 0.9)';
      sparkle.style.boxShadow = `0 0 12px ${glowColor}, 0 0 4px ${glowColor}`;
      
      // If drawing, use relative pos within fusion stage
      if (isDrawing && fusionStage) {
        const bounds = fusionStage.getBoundingClientRect();
        sparkle.style.left = (x - bounds.left) + 'px';
        sparkle.style.top = (y - bounds.top) + 'px';
        
        // Larger sparkles during drawing (3px - 7px range)
        const size = (3 + Math.random() * 4) + 'px';
        sparkle.style.width = size;
        sparkle.style.height = size;
        
        fusionStage.appendChild(sparkle);
      } else {
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        document.body.appendChild(sparkle);
      }
      
      // Random sparkle direction
      const angle = Math.random() * Math.PI * 2;
      // More confined dispersal for a 'tighter' path look during drawing
      const distance = isDrawing ? (5 + Math.random() * 35) : (10 + Math.random() * 32);
      const sparkleX = Math.cos(angle) * distance;
      const sparkleY = Math.sin(angle) * distance;
      
      sparkle.style.setProperty('--sparkle-x', `${sparkleX}px`);
      sparkle.style.setProperty('--sparkle-y', `${sparkleY}px`);
      
      // Longer lifespan for drawing sparkles to create a dramatic tail (1.5s)
      setTimeout(() => sparkle.remove(), isDrawing ? 1500 : 500);
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

  const createScrollSparkles = (x, y) => {
    // Fewer sparkles for scroll to keep performance high (1-2 per trigger)
    const sparkleCount = 1 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'cursor-sparkle';
      sparkle.style.left = x + 'px';
      sparkle.style.top = y + 'px';
      
      // Random direction trail
      const angle = (cursorAngle + 180 + (Math.random() * 40 - 20)) * (Math.PI / 180);
      const distance = 8 + Math.random() * 22;
      const sparkleX = Math.cos(angle) * distance;
      const sparkleY = Math.sin(angle) * distance;
      
      sparkle.style.setProperty('--sparkle-x', `${sparkleX}px`);
      sparkle.style.setProperty('--sparkle-y', `${sparkleY}px`);
      document.body.appendChild(sparkle);
      
      setTimeout(() => sparkle.remove(), 600);
    }
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
    const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    const scrollPercent = Math.min(Math.max(scrolled / docHeight, 0), 1);

    if (!isAnimating) {
      // Base diagonal path
      const maxX = window.innerWidth * 0.85;
      const startX = window.innerWidth * 0.15;
      const baseX = startX + (maxX - startX) * scrollPercent;
      const baseY = window.innerHeight * (0.2 + scrollPercent * 0.4);

      // Add "Snake" oscillation (Sine wave based on scroll position)
      // We use scrolled * constant to ensure the wave moves as the user scrolls
      const waveX = Math.sin(scrolled * 0.006) * 60;
      const waveY = Math.cos(scrolled * 0.008) * 25;

      targetX = baseX + waveX;
      targetY = baseY + waveY;

      // Calculate angle based on the new undulating path
      if (Math.abs(prevX - targetX) > 0.1 || Math.abs(prevY - targetY) > 0.1) {
        cursorAngle = calculateAngle(prevX, prevY, targetX, targetY);
      }
      
      prevX = targetX;
      prevY = targetY;

      // Add scroll sparkles consistently
      const now = Date.now();
      if (now - lastScrollSparkleTime > 45) {
        lastScrollSparkleTime = now;
        createScrollSparkles(cursorX, cursorY);
      }
    }
  }, { passive: true });
}
