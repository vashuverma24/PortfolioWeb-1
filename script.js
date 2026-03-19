const revealItems = document.querySelectorAll('.reveal');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const scrollBar = document.querySelector('.scroll-bar');
const storySections = [...document.querySelectorAll('main .section[id]')];
const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const clearInitialHash = () => {
  if (!window.location.hash) return;
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
};

const scrollToTopImmediate = () => {
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
};

const ensureStartAtTop = () => {
  clearInitialHash();
  scrollToTopImmediate();
  window.requestAnimationFrame(scrollToTopImmediate);
  window.setTimeout(scrollToTopImmediate, 60);
  window.setTimeout(scrollToTopImmediate, 180);
};

window.addEventListener('DOMContentLoaded', ensureStartAtTop);
window.addEventListener('load', ensureStartAtTop);
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    ensureStartAtTop();
  }
});

const introOverlay = document.querySelector('.intro-overlay');
const hideIntro = () => {
  if (!introOverlay || introOverlay.classList.contains('is-hidden')) return;
  introOverlay.classList.add('is-hidden');
  document.body.classList.remove('intro-active');
  document.body.classList.add('story-entered');
  scrollToTopImmediate();
};

if (introOverlay) {
  const introDelay = prefersReducedMotion ? 600 : 2400;
  window.setTimeout(hideIntro, introDelay);
  introOverlay.addEventListener('click', hideIntro);
  window.addEventListener('keydown', hideIntro, { once: true });
} else {
  document.body.classList.remove('intro-active');
  document.body.classList.add('story-entered');
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
  }
);

const revealGroups = new Map();

revealItems.forEach((item) => {
  const group = item.closest('.hero-stage, .section, .footer') || document.body;
  if (!revealGroups.has(group)) {
    revealGroups.set(group, []);
  }
  revealGroups.get(group).push(item);
});

revealGroups.forEach((items) => {
  items.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index, 5) * 0.08}s`;
    observer.observe(item);
  });
});

const tiltCards = document.querySelectorAll('.tilt');

if (!prefersReducedMotion) {
  tiltCards.forEach((card) => {
    card.addEventListener('pointerenter', () => {
      card.classList.add('is-hovered');
    });

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rx = ((y / rect.height) - 0.5) * -10;
      const ry = ((x / rect.width) - 0.5) * 10;

      card.style.setProperty('--rx', `${rx}deg`);
      card.style.setProperty('--ry', `${ry}deg`);
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
    });

    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-hovered');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '50%');
    });
  });

  let rafId = null;
  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;

  const updateCursor = () => {
    root.style.setProperty('--cursor-x', `${cursorX}px`);
    root.style.setProperty('--cursor-y', `${cursorY}px`);
    rafId = null;
  };

  window.addEventListener('pointermove', (event) => {
    cursorX = event.clientX;
    cursorY = event.clientY;
    if (!rafId) {
      rafId = window.requestAnimationFrame(updateCursor);
    }
  });
}

const heroStage = document.querySelector('[data-hero-stage]');
let activeStoryId = '';

const setActiveStorySection = (id) => {
  if (activeStoryId === id) return;
  activeStoryId = id;

  storySections.forEach((section) => {
    section.classList.toggle('is-story-active', section.id === id);
  });

  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('is-active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

let scrollRafId = null;
const updateScroll = () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? scrollTop / docHeight : 0;
  root.style.setProperty('--scroll', `${scrollTop}px`);

  if (scrollBar) {
    scrollBar.style.transform = `scaleX(${progress})`;
  }

  if (heroStage) {
    const heroProgress = Math.min(scrollTop / (window.innerHeight * 0.9), 1);
    heroStage.style.setProperty('--hero-bg-lift', `${heroProgress * 30}px`);
    heroStage.style.setProperty('--hero-scale', `${1.05 + (heroProgress * 0.04)}`);
    heroStage.style.setProperty('--hero-content-shift', `${heroProgress * -54}px`);
    heroStage.style.setProperty('--hero-content-opacity', `${1 - (heroProgress * 0.92)}`);
  }

  if (storySections.length) {
    const storyMarker = scrollTop + (window.innerHeight * 0.48);
    let currentStoryId = '';

    storySections.forEach((section) => {
      if (storyMarker >= section.offsetTop) {
        currentStoryId = section.id;
      }
    });

    setActiveStorySection(currentStoryId);
  }

  scrollRafId = null;
};

const onScroll = () => {
  if (!scrollRafId) {
    scrollRafId = window.requestAnimationFrame(updateScroll);
  }
};

window.addEventListener('scroll', onScroll);
window.addEventListener('resize', updateScroll);
updateScroll();

const labTitle = document.querySelector('[data-lab-title]');
const labDesc = document.querySelector('[data-lab-desc]');
const labChips = document.querySelectorAll('.chip[data-mode]');
const labIcon = document.querySelector('[data-lab-icon]');
const labMetricTitles = document.querySelectorAll('[data-lab-metric]');
const labMetricLabels = document.querySelectorAll('[data-lab-metric-label]');
const semesterList = document.querySelector('[data-semester-list]');
const reportModal = document.querySelector('[data-report-modal]');
const reportTitle = document.querySelector('[data-report-title]');
const reportImage = document.querySelector('[data-report-image]');
const reportPlaceholder = document.querySelector('[data-report-placeholder]');
const reportNumber = document.querySelector('[data-report-number]');
const reportMessage = document.querySelector('[data-report-message]');
const reportCloseButtons = document.querySelectorAll('[data-report-close]');
const skillRails = document.querySelectorAll('[data-skill-rail]');
const viewCountEl = document.querySelector('[data-view-count]');

const semesterContent = [
  {
    number: '01',
    chipLabel: 'Sem 1',
    label: 'Semester 1',
    title: 'Semester 1',
    message: 'Semester 1 report card',
    src: 'ReportCard1.jpg',
  },
  {
    number: '02',
    chipLabel: 'Sem 2',
    label: 'Semester 2',
    title: 'Semester 2',
    message: 'Semester 2 report card',
    src: 'ReportCard2.jpg',
  },
  {
    number: '03',
    chipLabel: 'Sem 3',
    label: 'Semester 3',
    title: 'Semester 3',
    message: 'Semester 3 report card',
    src: 'ReportCard3.jpg',
  },
  {
    number: '04',
    chipLabel: 'Sem 4',
    label: 'Semester 4',
    title: 'Semester 4',
    message: 'Semester 4 report card',
    src: 'ReportCard4.jpg',
  },
  {
    number: '05',
    chipLabel: 'Sem 5',
    label: 'Semester 5',
    title: 'Semester 5',
    message: 'Semester 5 report card',
    src: 'ReportCard5.jpg',
  },
  {
    number: '06',
    chipLabel: 'Sem 6',
    label: 'Semester 6',
    title: 'Semester 6',
    message: 'Semester 6 report card',
    src: 'ReportCard6.jpg',
  },
  {
    number: '07',
    chipLabel: 'Sem 7',
    label: 'Semester 7',
    title: 'Semester 7',
    message: 'Semester 7 report card',
    src: 'ReportCard7.jpg',
  },
  {
    number: '08',
    chipLabel: 'Sem 8',
    label: 'Semester 8',
    title: 'Semester 8',
    message: 'Semester 8 is currently in progress. The report card will be added once results are available.',
    src: '',
  },
];


const labContent = {
  LeoLingo: {
    title: 'LeoLingo - Speech Therapy iPad App',
    desc: 'Interactive games and real-time vocal feedback for kids, with progress tracking for parents and therapists.',
    icon: { src: 'leolingo.png', alt: 'LeoLingo app icon' },
    metrics: [
      { title: 'Domain', label: 'Speech therapy + learning' },
      { title: 'Platform', label: 'iPadOS (SwiftUI)' },
      { title: 'Stack', label: 'SwiftUI + Firebase' },
    ],
  },
  PrePlus: {
    title: 'PrePlus - AI Smart Study Companion',
    desc: 'AI tutor, smart notes, and quiz generation to personalize study plans and revision.',
    icon: { src: 'preplus.png', alt: 'PrePlus app icon' },
    metrics: [
      { title: 'Domain', label: 'EdTech + AI' },
      { title: 'Platform', label: 'iOS (SwiftUI)' },
      { title: 'Stack', label: 'SwiftUI + Supabase' },
    ],
  },
  MediOps: {
    title: 'MediOps - Hospital Management',
    desc: 'Role-based dashboards for patients, doctors, and admins to streamline hospital operations.',
    icon: { src: 'mediops.png', alt: 'MediOps app icon' },
    metrics: [
      { title: 'Domain', label: 'Healthcare ops' },
      { title: 'Platform', label: 'iOS (UIKit)' },
      { title: 'Stack', label: 'Swift + Supabase' },
    ],
  },
  HeyMadhav: {
    title: 'HeyMadhav - Gita Learning App',
    desc: 'Daily verses, reflections, and AI Q&A in a calm, guided experience.',
    icon: { src: 'heymadhav.png', alt: 'HeyMadhav app icon' },
    metrics: [
      { title: 'Domain', label: 'Wellness + learning' },
      { title: 'Platform', label: 'iOS (SwiftUI)' },
      { title: 'Stack', label: 'SwiftUI + AI' },
    ],
  },
};

if (labTitle && labDesc && labChips.length) {
  labChips.forEach((chip) => {
    chip.setAttribute('aria-pressed', chip.classList.contains('active'));

    chip.addEventListener('click', () => {
      const mode = chip.dataset.mode;
      const content = labContent[mode];
      if (!content) return;

      labChips.forEach((btn) => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });

      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      labTitle.textContent = content.title;
      labDesc.textContent = content.desc;

      if (labIcon && content.icon) {
        labIcon.classList.add('swap');
        labIcon.src = content.icon.src;
        labIcon.alt = content.icon.alt;
        window.setTimeout(() => labIcon.classList.remove('swap'), 180);
      }

      if (content.metrics && labMetricTitles.length && labMetricLabels.length) {
        content.metrics.forEach((metric, index) => {
          if (labMetricTitles[index]) {
            labMetricTitles[index].textContent = metric.title;
          }
          if (labMetricLabels[index]) {
            labMetricLabels[index].textContent = metric.label;
          }
        });
      }
    });
  });
}

if (
  semesterList &&
  reportModal &&
  reportTitle &&
  reportImage &&
  reportPlaceholder &&
  reportNumber &&
  reportMessage
) {
  semesterList.innerHTML = semesterContent
    .map(
      (semester) => `
        <button
          class="semester-card${semester.src ? '' : ' is-pending'}"
          type="button"
          aria-label="${semester.src ? `Open ${semester.label} report card` : `${semester.label} is in progress`}"
          data-semester-card
          data-semester-number="${semester.number}"
          data-semester-title="${semester.title}"
          data-semester-message="${semester.message}"
          data-semester-src="${semester.src}"
        >
          <span class="semester-card-label">${semester.chipLabel}</span>
        </button>
      `
    )
    .join('');

  const semesterCards = semesterList.querySelectorAll('[data-semester-card]');
  const semesterImageCache = new Map();
  let lastFocusedSemester = null;

  const probeSemesterImage = (src) => {
    if (!src) return Promise.resolve(false);
    if (semesterImageCache.has(src)) {
      return Promise.resolve(semesterImageCache.get(src));
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        semesterImageCache.set(src, true);
        resolve(true);
      };
      img.onerror = () => {
        semesterImageCache.set(src, false);
        resolve(false);
      };
      img.src = src;
    });
  };

  const closeReportModal = () => {
    reportModal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocusedSemester) {
      lastFocusedSemester.focus();
    }
  };

  const openReportModal = async (card) => {
    const {
      semesterTitle: title,
      semesterMessage: message,
      semesterSrc: src,
      semesterNumber: number,
    } = card.dataset;

    semesterCards.forEach((item) => item.classList.remove('is-active'));
    card.classList.add('is-active');
    lastFocusedSemester = card;

    reportTitle.textContent = title;
    reportNumber.textContent = number;
    reportImage.hidden = true;
    reportImage.removeAttribute('src');
    reportPlaceholder.hidden = false;
    reportMessage.textContent = src ? 'Loading report card...' : message;
    reportModal.hidden = false;
    document.body.classList.add('modal-open');

    const hasImage = await probeSemesterImage(src);

    if (!card.classList.contains('is-active')) return;

    if (hasImage) {
      reportImage.src = src;
      reportImage.alt = `${title} report card`;
      reportImage.hidden = false;
      reportPlaceholder.hidden = true;
    } else {
      reportPlaceholder.hidden = false;
      reportMessage.textContent = message;
    }
  };

  semesterCards.forEach((card) => {
    card.addEventListener('click', () => {
      openReportModal(card);
    });
  });

  reportCloseButtons.forEach((button) => {
    button.addEventListener('click', closeReportModal);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !reportModal.hidden) {
      closeReportModal();
    }
  });
}

if (skillRails.length) {
  skillRails.forEach((rail) => {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    rail.addEventListener('pointerdown', (event) => {
      isDown = true;
      rail.setPointerCapture(event.pointerId);
      rail.classList.add('is-dragging');
      startX = event.clientX;
      scrollLeft = rail.scrollLeft;
    });

    rail.addEventListener('pointermove', (event) => {
      if (!isDown) return;
      const delta = event.clientX - startX;
      rail.scrollLeft = scrollLeft - delta;
    });

    const stopDrag = () => {
      isDown = false;
      rail.classList.remove('is-dragging');
    };

    rail.addEventListener('pointerup', stopDrag);
    rail.addEventListener('pointerleave', stopDrag);
    rail.addEventListener('pointercancel', stopDrag);
  });
}

const updateViewCount = async () => {
  if (!viewCountEl) return;
  const namespace = 'sachin-portfolio';
  const key = 'site-views';
  const providers = [
    {
      get: `https://api.counterapi.dev/v1/${namespace}/${key}`,
      up: `https://api.counterapi.dev/v1/${namespace}/${key}/up`,
      parse: (data) => data.count ?? data.value ?? data.result ?? data.total,
    },
    {
      get: `https://api.countapi.xyz/get/${namespace}/${key}`,
      up: `https://api.countapi.xyz/hit/${namespace}/${key}`,
      parse: (data) => data.value ?? data.count ?? data.result ?? data.total,
    },
  ];
  const todayKey = new Date().toISOString().slice(0, 10);
  const storageKey = 'siteViewLastCounted';
  const localFallbackKey = 'siteViewLocalCount';
  const lastKnownKey = 'siteViewLastKnown';
  const formatCount = (value) => Intl.NumberFormat('en-US').format(value);
  const parseCounterValue = (raw) => {
    if (typeof raw === 'number') {
      return Number.isFinite(raw) && raw >= 0 ? raw : null;
    }
    if (typeof raw === 'string') {
      const cleaned = raw.replace(/[^\d.-]/g, '');
      if (!cleaned) return null;
      const parsed = Number(cleaned);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    }
    return null;
  };
  const readStoredCount = (keyName) => {
    try {
      const stored = Number(localStorage.getItem(keyName));
      return Number.isFinite(stored) && stored >= 0 ? stored : null;
    } catch (error) {
      return null;
    }
  };
  const writeStoredCount = (keyName, value) => {
    try {
      if (Number.isFinite(value) && value >= 0) {
        localStorage.setItem(keyName, String(value));
      }
    } catch (error) {
      // Ignore storage errors.
    }
  };

  let shouldIncrement = true;
  try {
    shouldIncrement = localStorage.getItem(storageKey) !== todayKey;
  } catch (error) {
    shouldIncrement = true;
  }

  try {
    let count = null;
    let resolvedFromProvider = false;

    for (const provider of providers) {
      try {
        const url = shouldIncrement ? provider.up : provider.get;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error('View count fetch failed');
        const data = await response.json();
        const parsedCount = parseCounterValue(provider.parse(data));
        if (parsedCount !== null) {
          count = parsedCount;
          resolvedFromProvider = true;
          break;
        }
      } catch (error) {
        // Try next provider.
      }
    }

    if (count === null) {
      const storedLocal = readStoredCount(localFallbackKey) ?? 0;
      const storedKnown = readStoredCount(lastKnownKey) ?? 0;
      const baseline = Math.max(storedLocal, storedKnown);

      if (baseline > 0) {
        count = shouldIncrement ? baseline + 1 : baseline;
      } else if (shouldIncrement) {
        count = 1;
      }
    }

    if (count !== null && count >= 0) {
      viewCountEl.textContent = formatCount(count);
      writeStoredCount(localFallbackKey, count);
      if (resolvedFromProvider || count > 0) {
        writeStoredCount(lastKnownKey, count);
      }
    } else {
      const fallbackKnown = readStoredCount(lastKnownKey);
      viewCountEl.textContent =
        fallbackKnown !== null && fallbackKnown > 0 ? formatCount(fallbackKnown) : '--';
    }

    if (shouldIncrement) {
      try {
        localStorage.setItem(storageKey, todayKey);
      } catch (error) {
        // Ignore storage errors.
      }
    }
  } catch (error) {
    const fallbackKnown = readStoredCount(lastKnownKey);
    viewCountEl.textContent =
      fallbackKnown !== null && fallbackKnown > 0 ? formatCount(fallbackKnown) : '--';
  }
};

updateViewCount();

const ghUser = 'SachinTarkar842';
const lcUser = 'tarkarsachin842';

const setText = (el, value) => {
  if (el) el.textContent = value;
};

const toNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[,#%\s]/g, '');
  if (!cleaned || cleaned === '--') return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeNumber = (value) => {
  const numeric = toNumber(value);
  return numeric !== null && numeric >= 0 ? numeric : null;
};

const formatInteger = (value, fallback = '--') => {
  const numeric = normalizeNumber(value);
  if (numeric === null) return fallback;
  return Intl.NumberFormat('en-US').format(Math.round(numeric));
};

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return '--%';
  if (value >= 99.95) return '100%';
  const decimals = value >= 10 ? 0 : 1;
  return `${value.toFixed(decimals)}%`;
};

const getPathValue = (obj, path) =>
  path.split('.').reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    const index = Number(key);
    if (Number.isInteger(index) && Array.isArray(acc)) {
      return acc[index];
    }
    return acc[key];
  }, obj);

const pickFirstFromSources = (sources, paths) => {
  for (const path of paths) {
    for (const source of sources) {
      const value = getPathValue(source, path);
      if (value !== undefined && value !== null && value !== '') return value;
    }
  }
  return undefined;
};

const setSegmentDistribution = (segments, order, values) => {
  const normalized = order.map((key) => {
    const value = Number(values[key]);
    return Number.isFinite(value) && value > 0 ? value : 0;
  });

  const total = normalized.reduce((sum, value) => sum + value, 0);
  const activeCount = normalized.filter((value) => value > 0).length;
  const gap = activeCount > 1 ? 1.4 : 0;
  const usableArc = Math.max(0, 100 - gap * activeCount);
  let start = 0;

  order.forEach((key, index) => {
    const segment = segments[key];
    if (!segment) return;
    const value = normalized[index];

    if (!total || !value || !usableArc) {
      segment.style.strokeDasharray = '0 100';
      segment.style.strokeDashoffset = '0';
      return;
    }

    const arcLength = (value / total) * usableArc;
    segment.style.strokeDasharray = `${arcLength} ${100 - arcLength}`;
    segment.style.strokeDashoffset = `${-start}`;
    start += arcLength + gap;
  });
};

const setCardFocusState = (cards, key, attrName) => {
  cards.forEach((card) => {
    const isActive = card.dataset[attrName] === key;
    card.classList.toggle('is-active', isActive);
    card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
};

const ghRepos = document.querySelector('[data-gh-repos]');
const ghFollowers = document.querySelector('[data-gh-followers]');
const ghStatus = document.querySelector('[data-gh-status]');
const ghTotalStars = document.querySelector('[data-gh-total-stars]');
const ghTopRepo = document.querySelector('[data-gh-top-repo]');
const ghActiveRepos = document.querySelector('[data-gh-active-repos]');
const ghLanguageCount = document.querySelector('[data-gh-language-count]');
const ghLanguages = document.querySelector('[data-gh-languages]');
const ghActiveDays = document.querySelector('[data-gh-active-days]');
const ghLongestStreak = document.querySelector('[data-gh-longest-streak]');
const ghYearSubmissions = document.querySelector('[data-gh-year-submissions]');

const lcTotal = document.querySelector('[data-lc-total]');
const lcTotalQuestions = document.querySelector('[data-lc-total-questions]');
const lcEasy = document.querySelector('[data-lc-easy]');
const lcEasyTotal = document.querySelector('[data-lc-easy-total]');
const lcMedium = document.querySelector('[data-lc-medium]');
const lcMediumTotal = document.querySelector('[data-lc-medium-total]');
const lcHard = document.querySelector('[data-lc-hard]');
const lcHardTotal = document.querySelector('[data-lc-hard-total]');
const lcRank = document.querySelector('[data-lc-rank]');
const lcRankMeta = document.querySelector('[data-lc-rank-meta]');
const lcStatus = document.querySelector('[data-lc-status]');
const lcRing = document.querySelector('[data-lc-ring]');
const lcSegments = {
  easy: document.querySelector('[data-lc-segment="easy"]'),
  medium: document.querySelector('[data-lc-segment="medium"]'),
  hard: document.querySelector('[data-lc-segment="hard"]'),
};
const lcCards = Array.from(document.querySelectorAll('[data-lc-focus]'));
const lcShareTotal = document.querySelector('[data-lc-share-total]');
const lcShareEasy = document.querySelector('[data-lc-share-easy]');
const lcShareMedium = document.querySelector('[data-lc-share-medium]');
const lcShareHard = document.querySelector('[data-lc-share-hard]');
const lcHighlightValue = document.querySelector('[data-lc-highlight-value]');
const lcHighlightTotal = document.querySelector('[data-lc-highlight-total]');
const lcHighlightLabel = document.querySelector('[data-lc-highlight-label]');
const lcHighlightShare = document.querySelector('[data-lc-highlight-share]');
const lcYearSubmissions = document.querySelector('[data-lc-year-submissions]');
const lcCurrentStreak = document.querySelector('[data-lc-current-streak]');
const lcLongestStreak = document.querySelector('[data-lc-longest-streak]');
const lcDifficultyScore = document.querySelector('[data-lc-difficulty-score]');

const ghHeatmap = document.querySelector('[data-gh-heatmap]');
const ghHeatmapStatus = document.querySelector('[data-gh-heatmap-status]');
const lcHeatmap = document.querySelector('[data-lc-heatmap]');
const lcHeatmapStatus = document.querySelector('[data-lc-heatmap-status]');

const renderGitHubLanguageMix = (languageMap) => {
  const entries = [...languageMap.entries()].sort((a, b) => b[1] - a[1]);

  if (ghLanguageCount) {
    ghLanguageCount.textContent = entries.length ? `${entries.length} langs` : '-- langs';
  }

  if (!ghLanguages) return;
  ghLanguages.innerHTML = '';

  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'gh-language-empty';
    empty.textContent = 'No primary language data available.';
    ghLanguages.appendChild(empty);
    return;
  }

  const top = entries[0][1] || 1;
  entries.slice(0, 4).forEach(([language, count], index) => {
    const row = document.createElement('div');
    row.className = 'gh-lang-row';

    const name = document.createElement('span');
    name.className = 'gh-lang-name';
    name.textContent = language;

    const track = document.createElement('span');
    track.className = 'gh-lang-track';

    const fill = document.createElement('span');
    fill.className = `gh-lang-fill${index ? ` is-${index + 1}` : ''}`;
    fill.style.setProperty('--pct', `${Math.max(8, Math.round((count / top) * 100))}%`);
    track.appendChild(fill);

    const countEl = document.createElement('span');
    countEl.className = 'gh-lang-count';
    countEl.textContent = formatInteger(count);

    row.appendChild(name);
    row.appendChild(track);
    row.appendChild(countEl);
    ghLanguages.appendChild(row);
  });
};

const lcMetricConfig = {
  total: { label: 'Solved', valueKey: 'total', totalKey: 'totalQuestions' },
  easy: { label: 'Easy', valueKey: 'easy', totalKey: 'totalEasy' },
  medium: { label: 'Medium', valueKey: 'medium', totalKey: 'totalMedium' },
  hard: { label: 'Hard', valueKey: 'hard', totalKey: 'totalHard' },
};

let lcActive = 'total';
let lcSnapshot = {
  total: null,
  totalQuestions: null,
  easy: null,
  totalEasy: null,
  medium: null,
  totalMedium: null,
  hard: null,
  totalHard: null,
};

const updateLeetCodeFocus = (metric) => {
  if (!lcMetricConfig[metric]) return;
  lcActive = metric;
  if (lcRing) {
    lcRing.setAttribute('data-active', metric);
  }
  setCardFocusState(lcCards, metric, 'lcFocus');

  const config = lcMetricConfig[metric];
  const value = normalizeNumber(lcSnapshot[config.valueKey]);
  const total = normalizeNumber(lcSnapshot[config.totalKey]);

  const ratio =
    value !== null && total !== null && total > 0
      ? (value / total) * 100
      : null;

  setText(lcHighlightValue, formatInteger(value));
  setText(lcHighlightTotal, formatInteger(total));
  setText(lcHighlightLabel, config.label);
  setText(
    lcHighlightShare,
    ratio !== null ? `${formatPercent(ratio)} solved` : 'Hover a tier to inspect solve ratio'
  );
};

const refreshLeetCodeVisuals = () => {
  const easySolved = normalizeNumber(lcSnapshot.easy) ?? 0;
  const mediumSolved = normalizeNumber(lcSnapshot.medium) ?? 0;
  const hardSolved = normalizeNumber(lcSnapshot.hard) ?? 0;

  setSegmentDistribution(
    lcSegments,
    ['easy', 'medium', 'hard'],
    { easy: easySolved, medium: mediumSolved, hard: hardSolved }
  );

  const totalSolved = normalizeNumber(lcSnapshot.total);
  const totalQuestions = normalizeNumber(lcSnapshot.totalQuestions);
  const easySolvedRaw = normalizeNumber(lcSnapshot.easy);
  const mediumSolvedRaw = normalizeNumber(lcSnapshot.medium);
  const hardSolvedRaw = normalizeNumber(lcSnapshot.hard);
  const easyTotal = normalizeNumber(lcSnapshot.totalEasy);
  const mediumTotal = normalizeNumber(lcSnapshot.totalMedium);
  const hardTotal = normalizeNumber(lcSnapshot.totalHard);

  setText(
    lcShareTotal,
    totalSolved !== null && totalQuestions && totalQuestions > 0
      ? formatPercent((totalSolved / totalQuestions) * 100)
      : '--%'
  );
  setText(
    lcShareEasy,
    easySolvedRaw !== null && easyTotal && easyTotal > 0
      ? formatPercent((easySolvedRaw / easyTotal) * 100)
      : '--%'
  );
  setText(
    lcShareMedium,
    mediumSolvedRaw !== null && mediumTotal && mediumTotal > 0
      ? formatPercent((mediumSolvedRaw / mediumTotal) * 100)
      : '--%'
  );
  setText(
    lcShareHard,
    hardSolvedRaw !== null && hardTotal && hardTotal > 0
      ? formatPercent((hardSolvedRaw / hardTotal) * 100)
      : '--%'
  );

  updateLeetCodeFocus(lcActive);
};

lcCards.forEach((card) => {
  const metric = card.dataset.lcFocus;
  if (!metric || !lcMetricConfig[metric]) return;
  card.addEventListener('click', () => updateLeetCodeFocus(metric));
  card.addEventListener('pointerenter', () => updateLeetCodeFocus(metric));
  card.addEventListener('focus', () => updateLeetCodeFocus(metric));
});

const fetchGitHubStats = async () => {
  if (!ghRepos && !ghFollowers) return;
  try {
    console.log('Fetching GitHub stats for user:', ghUser);
    const userResponse = await fetch(`https://api.github.com/users/${ghUser}`, { cache: 'no-store' });
    if (!userResponse.ok) {
      console.error('GitHub user fetch failed:', userResponse.status, userResponse.statusText);
      throw new Error('GitHub user fetch failed');
    }

    const user = await userResponse.json();
    console.log('GitHub user data:', user);
    setText(ghRepos, formatInteger(user.public_repos));
    setText(ghFollowers, formatInteger(user.followers));

    // Try to fetch repos (may fail due to rate limiting)
    let repositories = [];
    let hasRepoData = false;
    try {
      const repoResponse = await fetchGitHubRepos(ghUser);
      if (repoResponse && Array.isArray(repoResponse) && repoResponse.length > 0) {
        repositories = repoResponse;
        hasRepoData = true;
        console.log('Fetched repositories:', repositories.length);
      } else {
        console.warn('No repositories found or repos fetch returned null');
      }
    } catch (repoError) {
      console.error('Failed to fetch repos:', repoError);
    }

    if (hasRepoData) {
      const nonForkRepos = repositories.filter((repo) => !repo.fork);
      const languageMap = new Map();
      let totalStars = 0;
      let mostStarredRepo = null;

      nonForkRepos.forEach((repo) => {
        const stars = normalizeNumber(repo.stargazers_count) ?? 0;
        totalStars += stars;
        if (!mostStarredRepo || stars > (normalizeNumber(mostStarredRepo.stargazers_count) ?? -1)) {
          mostStarredRepo = repo;
        }

        if (typeof repo.language === 'string' && repo.language.trim()) {
          const language = repo.language.trim();
          languageMap.set(language, (languageMap.get(language) ?? 0) + 1);
        }
      });

      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const activeRepos = nonForkRepos.filter((repo) => {
        const pushed = new Date(repo.pushed_at || 0).getTime();
        return Number.isFinite(pushed) && pushed >= ninetyDaysAgo;
      }).length;

      setText(ghTotalStars, formatInteger(totalStars));
      setText(ghActiveRepos, formatInteger(activeRepos));
      setText(
        ghTopRepo,
        mostStarredRepo
          ? `${mostStarredRepo.name} (${formatInteger(mostStarredRepo.stargazers_count)} stars)`
          : '--'
      );
      renderGitHubLanguageMix(languageMap);
      setText(ghStatus, 'Updated just now');
    } else {
      setText(ghTotalStars, '--');
      setText(ghActiveRepos, '--');
      setText(ghTopRepo, '--');
      setText(ghLanguageCount, '-- langs');
      if (ghLanguages) {
        ghLanguages.innerHTML = '<p class="gh-language-empty">Repo data temporarily unavailable (check rate limit).</p>';
      }
      setText(ghStatus, 'Profile loaded • repo insights unavailable');
    }
  } catch (error) {
    console.error('Error fetching GitHub stats:', error);
    setText(ghRepos, '--');
    setText(ghFollowers, '--');
    setText(ghTotalStars, '--');
    setText(ghActiveRepos, '--');
    setText(ghTopRepo, '--');
    setText(ghLanguageCount, '-- langs');
    if (ghLanguages) {
      ghLanguages.innerHTML = '<p class="gh-language-empty">Unable to load GitHub profile at this time.</p>';
    }
    setText(ghStatus, 'Unable to load GitHub stats. Try refreshing.');
  }
};

const fetchGitHubRepos = async (user) => {
  const repos = [];
  let page = 1;
  const perPage = 100;
  const timeout = 8000;
  
  while (page <= 5) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(
        `https://api.github.com/users/${user}/repos?per_page=${perPage}&page=${page}&sort=updated`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      if (response.status === 403) {
        console.warn('GitHub API rate limit reached');
        break;
      }
      if (!response.ok) {
        console.error(`Failed to fetch repos page ${page}:`, response.status);
        break;
      }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        break;
      }
      repos.push(...data);
      if (data.length < perPage) {
        break;
      }
      page++;
    } catch (error) {
      console.error(`Error fetching repos page ${page}:`, error.message);
      if (page === 1) return null;
      break;
    }
  }
  return repos.length > 0 ? repos : null;
};

const leetCodeEndpoints = [
  `https://leetcode-stats-api.herokuapp.com/${lcUser}`,
  `https://leetcode-api-faisalshohag.vercel.app/${lcUser}`,
];

const fetchLeetCodeStats = async () => {
  if (!lcTotal && !lcEasy && !lcMedium && !lcHard && !lcRank) {
    return;
  }
  const sources = [];

  for (const endpoint of leetCodeEndpoints) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('LeetCode fetch failed');
      const result = await response.json();
      if (result && typeof result === 'object') {
        sources.push(result);
      }
    } catch (error) {
      // Try the next endpoint.
    }
  }

  if (!sources.length) {
    setText(lcRankMeta, 'Contest rank snapshot');
    setText(lcDifficultyScore, '--');
    setText(lcStatus, 'Unable to load LeetCode stats right now.');
    return;
  }

  const formatRank = (value) => {
    const numeric = toNumber(value);
    if (numeric === null) return '--';
    return `#${Intl.NumberFormat('en-US').format(Math.round(numeric))}`;
  };

  const total = pickFirstFromSources(sources, [
    'totalSolved',
    'solved',
    'total_solved',
    'data.matchedUser.submitStats.acSubmissionNum.0.count',
  ]);
  const easy = pickFirstFromSources(sources, [
    'easySolved',
    'easy',
    'easy_solved',
    'data.matchedUser.submitStats.acSubmissionNum.1.count',
  ]);
  const medium = pickFirstFromSources(sources, [
    'mediumSolved',
    'medium',
    'medium_solved',
    'data.matchedUser.submitStats.acSubmissionNum.2.count',
  ]);
  const hard = pickFirstFromSources(sources, [
    'hardSolved',
    'hard',
    'hard_solved',
    'data.matchedUser.submitStats.acSubmissionNum.3.count',
  ]);
  const totalQuestions = pickFirstFromSources(sources, [
    'totalQuestions',
    'total_questions',
    'totalQuestionsCount',
    'allQuestionsCount.0.count',
    'data.allQuestionsCount.0.count',
  ]);
  const totalEasy = pickFirstFromSources(sources, [
    'totalEasy',
    'easyTotal',
    'easy_total',
    'allQuestionsCount.1.count',
    'data.allQuestionsCount.1.count',
  ]);
  const totalMedium = pickFirstFromSources(sources, [
    'totalMedium',
    'mediumTotal',
    'medium_total',
    'allQuestionsCount.2.count',
    'data.allQuestionsCount.2.count',
  ]);
  const totalHard = pickFirstFromSources(sources, [
    'totalHard',
    'hardTotal',
    'hard_total',
    'allQuestionsCount.3.count',
    'data.allQuestionsCount.3.count',
  ]);
  const ranking = pickFirstFromSources(sources, [
    'ranking',
    'rank',
    'globalRanking',
    'userContestRanking.globalRanking',
  ]);
  const totalParticipants = pickFirstFromSources(sources, [
    'totalParticipants',
    'total_participants',
    'contestTotalParticipants',
    'userContestRanking.totalParticipants',
    'data.userContestRanking.totalParticipants',
    'matchedUser.userContestRanking.totalParticipants',
  ]);

  const easyValue = normalizeNumber(easy);
  const mediumValue = normalizeNumber(medium);
  const hardValue = normalizeNumber(hard);

  const parsedTotal = normalizeNumber(total);
  const computedSolved =
    easyValue !== null && mediumValue !== null && hardValue !== null
      ? easyValue + mediumValue + hardValue
      : null;
  const solvedValue = parsedTotal !== null ? parsedTotal : computedSolved;

  const parsedTotalEasy = normalizeNumber(totalEasy);
  const parsedTotalMedium = normalizeNumber(totalMedium);
  const parsedTotalHard = normalizeNumber(totalHard);

  const parsedTotalQuestions = normalizeNumber(totalQuestions);
  const computedTotalQuestions =
    parsedTotalEasy !== null && parsedTotalMedium !== null && parsedTotalHard !== null
      ? parsedTotalEasy + parsedTotalMedium + parsedTotalHard
      : null;

  lcSnapshot = {
    total: solvedValue,
    totalQuestions: parsedTotalQuestions !== null ? parsedTotalQuestions : computedTotalQuestions,
    easy: easyValue,
    totalEasy: parsedTotalEasy,
    medium: mediumValue,
    totalMedium: parsedTotalMedium,
    hard: hardValue,
    totalHard: parsedTotalHard,
  };

  setText(lcTotal, formatInteger(lcSnapshot.total));
  setText(lcTotalQuestions, formatInteger(lcSnapshot.totalQuestions));
  setText(lcEasy, formatInteger(lcSnapshot.easy));
  setText(lcEasyTotal, formatInteger(lcSnapshot.totalEasy));
  setText(lcMedium, formatInteger(lcSnapshot.medium));
  setText(lcMediumTotal, formatInteger(lcSnapshot.totalMedium));
  setText(lcHard, formatInteger(lcSnapshot.hard));
  setText(lcHardTotal, formatInteger(lcSnapshot.totalHard));
  setText(lcRank, formatRank(ranking));

  const rankingNumber = normalizeNumber(ranking);
  const participantsNumber = normalizeNumber(totalParticipants);
  const topPercent =
    rankingNumber !== null &&
    participantsNumber !== null &&
    participantsNumber > 0
      ? (rankingNumber / participantsNumber) * 100
      : null;
  const safeTopPercent =
    topPercent !== null ? Math.min(100, Math.max(0, topPercent)) : null;

  setText(
    lcRankMeta,
    safeTopPercent !== null
      ? `Top ${safeTopPercent < 10 ? safeTopPercent.toFixed(1) : safeTopPercent.toFixed(0)}%`
      : 'Contest rank snapshot'
  );

  const difficultyScore =
    (normalizeNumber(lcSnapshot.easy) ?? 0) * 1 +
    (normalizeNumber(lcSnapshot.medium) ?? 0) * 2 +
    (normalizeNumber(lcSnapshot.hard) ?? 0) * 3;
  setText(lcDifficultyScore, difficultyScore > 0 ? formatInteger(difficultyScore) : '--');

  refreshLeetCodeVisuals();
  setText(lcStatus, 'Updated just now');
};

refreshLeetCodeVisuals();
fetchGitHubStats();
fetchLeetCodeStats();

const toDateKey = (date) => date.toISOString().slice(0, 10);

const sumRecentActivity = (countByDate, days = 365) => {
  if (!(countByDate instanceof Map) || !countByDate.size) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));

  let sum = 0;
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = toDateKey(date);
    const count = Number(countByDate.get(key) ?? 0);
    if (Number.isFinite(count)) {
      sum += count;
    }
  }

  return sum;
};

const getActivityInsights = (countByDate, days = 365) => {
  if (!(countByDate instanceof Map) || !countByDate.size) {
    return { activeDays: 0, longest: 0, current: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));

  let activeDays = 0;
  let currentRun = 0;
  let longestRun = 0;
  const activeFlags = [];

  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = toDateKey(date);
    const count = Number(countByDate.get(key) ?? 0);
    const active = Number.isFinite(count) && count > 0;
    activeFlags.push(active);

    if (active) {
      activeDays += 1;
      currentRun += 1;
      if (currentRun > longestRun) longestRun = currentRun;
    } else {
      currentRun = 0;
    }
  }

  let currentStreak = 0;
  for (let i = activeFlags.length - 1; i >= 0; i -= 1) {
    if (!activeFlags[i]) break;
    currentStreak += 1;
  }

  return { activeDays, longest: longestRun, current: currentStreak };
};

const buildHeatmap = (container, countByDate, options = {}) => {
  if (!container) return;
  const days = options.days ?? 182;
  const label = options.label ?? 'activity';
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const counts = [];
  let max = 0;

  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = toDateKey(date);
    const count = countByDate.get(key) ?? 0;
    counts.push({ key, count });
    if (count > max) max = count;
  }

  container.classList.remove('is-image');
  container.innerHTML = '';

  counts.forEach(({ key, count }) => {
    const cell = document.createElement('span');
    const intensity =
      max === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4));
    cell.className = `heatmap-cell heat-${intensity}`;
    cell.title = `${key}: ${count} ${label}`;
    container.appendChild(cell);
  });
};

const fetchGitHubHeatmap = async () => {
  if (!ghHeatmap) return;
  try {
    const response = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${ghUser}?y=last`
    );
    if (!response.ok) throw new Error('GitHub heatmap fetch failed');
    const data = await response.json();
    const map = new Map();

    if (Array.isArray(data.contributions)) {
      data.contributions.forEach((entry) => {
        if (entry.date) {
          map.set(entry.date, entry.count ?? 0);
        }
      });
    }

    buildHeatmap(ghHeatmap, map, { days: 365, label: 'contributions' });
    setText(ghYearSubmissions, formatInteger(sumRecentActivity(map, 365)));
    const ghInsights = getActivityInsights(map, 365);
    setText(ghActiveDays, formatInteger(ghInsights.activeDays));
    setText(ghLongestStreak, ghInsights.longest > 0 ? `${formatInteger(ghInsights.longest)}d` : '--');
    setText(ghHeatmapStatus, 'Last 1 year of activity');
  } catch (error) {
    if (ghHeatmap) {
      ghHeatmap.classList.add('is-image');
      ghHeatmap.innerHTML = `<img src="https://ghchart.rshah.org/${ghUser}" alt="GitHub contribution heatmap" />`;
    }
    setText(ghYearSubmissions, '--');
    setText(ghActiveDays, '--');
    setText(ghLongestStreak, '--');
    setText(ghHeatmapStatus, 'Live grid unavailable, showing fallback.');
  }
};

const fetchLeetCodeHeatmap = async () => {
  if (!lcHeatmap) return;
  const toCalendarMap = (payload) => {
    if (!payload || typeof payload !== 'object') return null;

    const pickCalendar = () => {
      const candidates = [
        payload.submissionCalendar,
        payload.submission_calendar,
        payload.calendar,
        payload.data?.submissionCalendar,
        payload.data?.submission_calendar,
        payload.matchedUser?.userCalendar?.submissionCalendar,
      ];

      return candidates.find((value) => value !== undefined && value !== null);
    };

    const rawCalendar = pickCalendar();
    if (!rawCalendar) return null;

    let parsedCalendar = rawCalendar;
    if (typeof parsedCalendar === 'string') {
      try {
        parsedCalendar = JSON.parse(parsedCalendar);
      } catch (error) {
        return null;
      }
    }

    const map = new Map();

    // Supports both timestamp-keyed objects and date-keyed entries across API variants.
    const pushEntry = (rawKey, rawValue) => {
      const value =
        typeof rawValue === 'number'
          ? rawValue
          : Number(rawValue?.count ?? rawValue?.value ?? rawValue);
      if (!Number.isFinite(value)) return;

      if (typeof rawKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawKey)) {
        map.set(rawKey, value);
        return;
      }

      const numericKey = Number(rawKey);
      if (!Number.isFinite(numericKey)) return;

      const timestampMs = numericKey > 1e12 ? numericKey : numericKey * 1000;
      const date = new Date(timestampMs);
      if (Number.isNaN(date.getTime())) return;
      map.set(toDateKey(date), value);
    };

    if (Array.isArray(parsedCalendar)) {
      parsedCalendar.forEach((entry) => {
        if (!entry) return;
        pushEntry(entry.timestamp ?? entry.date ?? entry.time, entry.count ?? entry.value);
      });
      return map.size ? map : null;
    }

    if (typeof parsedCalendar === 'object') {
      Object.entries(parsedCalendar).forEach(([key, value]) => {
        pushEntry(key, value);
      });
      return map.size ? map : null;
    }

    return null;
  };

  try {
    let calendarMap = null;

    for (const endpoint of leetCodeEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('LeetCode heatmap fetch failed');
        const data = await response.json();
        const parsed = toCalendarMap(data);
        if (parsed && parsed.size) {
          calendarMap = parsed;
          break;
        }
      } catch (error) {
        // Try the next endpoint.
      }
    }

    if (!calendarMap || !calendarMap.size) {
      throw new Error('LeetCode calendar missing');
    }

    buildHeatmap(lcHeatmap, calendarMap, { days: 365, label: 'submissions' });
    setText(lcYearSubmissions, formatInteger(sumRecentActivity(calendarMap, 365)));
    const lcInsights = getActivityInsights(calendarMap, 365);
    setText(
      lcCurrentStreak,
      lcInsights.current > 0 ? `${formatInteger(lcInsights.current)}d` : '0d'
    );
    setText(
      lcLongestStreak,
      lcInsights.longest > 0 ? `${formatInteger(lcInsights.longest)}d` : '--'
    );
    setText(lcHeatmapStatus, 'Last 1 year of activity');
  } catch (error) {
    setText(lcYearSubmissions, '--');
    setText(lcCurrentStreak, '--');
    setText(lcLongestStreak, '--');
    setText(lcHeatmapStatus, 'Unable to load LeetCode activity grid.');
  }
};

fetchGitHubHeatmap();
fetchLeetCodeHeatmap();
