const revealItems = document.querySelectorAll('.reveal');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const scrollBar = document.querySelector('.scroll-bar');
const themeToggle = document.querySelector('.theme-toggle');

const prefersLightScheme = window.matchMedia('(prefers-color-scheme: light)');
const storedTheme = localStorage.getItem('theme');

const applyTheme = (theme) => {
  root.setAttribute('data-theme', theme);
  if (!themeToggle) return;
  const isLight = theme === 'light';
  themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
  themeToggle.setAttribute(
    'aria-label',
    isLight ? 'Switch to dark mode' : 'Switch to light mode'
  );
};

const initialTheme = storedTheme || 'dark';
applyTheme(initialTheme);

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  });
}

prefersLightScheme.addEventListener('change', (event) => {
  if (!localStorage.getItem('theme')) {
    applyTheme(event.matches ? 'light' : 'dark');
  }
});

const scrollToTopImmediate = () => {
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
};

const ensureStartAtTop = () => {
  if (!window.location.hash) {
    scrollToTopImmediate();
    window.requestAnimationFrame(scrollToTopImmediate);
    window.setTimeout(scrollToTopImmediate, 60);
  }
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
};

if (introOverlay) {
  const introDelay = prefersReducedMotion ? 600 : 2400;
  window.setTimeout(hideIntro, introDelay);
  introOverlay.addEventListener('click', hideIntro);
  window.addEventListener('keydown', hideIntro, { once: true });
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

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${index * 0.05}s`;
  observer.observe(item);
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

let scrollRafId = null;
const updateScroll = () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? scrollTop / docHeight : 0;
  root.style.setProperty('--scroll', `${scrollTop}px`);

  if (scrollBar) {
    scrollBar.style.transform = `scaleX(${progress})`;
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
  const baseUrl = `https://api.counterapi.dev/v1/${namespace}/${key}`;
  const todayKey = new Date().toISOString().slice(0, 10);
  const storageKey = 'siteViewLastCounted';

  let shouldIncrement = true;
  try {
    shouldIncrement = localStorage.getItem(storageKey) !== todayKey;
  } catch (error) {
    shouldIncrement = true;
  }

  try {
    const url = shouldIncrement ? `${baseUrl}/up` : baseUrl;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('View count fetch failed');
    const data = await response.json();
    const count = data.count ?? data.value ?? data.result ?? data.total;
    viewCountEl.textContent = count ?? '--';

    if (shouldIncrement) {
      try {
        localStorage.setItem(storageKey, todayKey);
      } catch (error) {
        // Ignore storage errors.
      }
    }
  } catch (error) {
    viewCountEl.textContent = '--';
  }
};

updateViewCount();

const ghUser = 'SachinTarkar842';
const lcUser = 'tarkarsachin842';

const setText = (el, value) => {
  if (el) el.textContent = value;
};

const ghRepos = document.querySelector('[data-gh-repos]');
const ghFollowers = document.querySelector('[data-gh-followers]');
const ghFollowing = document.querySelector('[data-gh-following]');
const ghStatus = document.querySelector('[data-gh-status]');

const lcTotal = document.querySelector('[data-lc-total]');
const lcEasy = document.querySelector('[data-lc-easy]');
const lcMedium = document.querySelector('[data-lc-medium]');
const lcHard = document.querySelector('[data-lc-hard]');
const lcRank = document.querySelector('[data-lc-rank]');
const lcAcceptance = document.querySelector('[data-lc-acceptance]');
const lcStatus = document.querySelector('[data-lc-status]');

const ghHeatmap = document.querySelector('[data-gh-heatmap]');
const ghHeatmapStatus = document.querySelector('[data-gh-heatmap-status]');
const lcHeatmap = document.querySelector('[data-lc-heatmap]');
const lcHeatmapStatus = document.querySelector('[data-lc-heatmap-status]');

const fetchGitHubStats = async () => {
  if (!ghRepos && !ghFollowers && !ghFollowing) return;
  try {
    const response = await fetch(`https://api.github.com/users/${ghUser}`);
    if (!response.ok) throw new Error('GitHub fetch failed');
    const data = await response.json();

    setText(ghRepos, data.public_repos ?? '--');
    setText(ghFollowers, data.followers ?? '--');
    setText(ghFollowing, data.following ?? '--');
    setText(ghStatus, 'Updated just now');
  } catch (error) {
    setText(ghStatus, 'Unable to load GitHub stats right now.');
  }
};

const leetCodeEndpoints = [
  `https://leetcode-stats-api.herokuapp.com/${lcUser}`,
  `https://leetcode-api-faisalshohag.vercel.app/${lcUser}`,
];

const fetchLeetCodeStats = async () => {
  if (!lcTotal && !lcEasy && !lcMedium && !lcHard && !lcRank && !lcAcceptance) {
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
    setText(lcStatus, 'Unable to load LeetCode stats right now.');
    return;
  }

  const getPathValue = (obj, path) =>
    path.split('.').reduce((acc, key) => {
      if (acc === null || acc === undefined) return undefined;
      const index = Number(key);
      if (Number.isInteger(index) && Array.isArray(acc)) {
        return acc[index];
      }
      return acc[key];
    }, obj);

  const pickFirst = (paths) => {
    for (const path of paths) {
      for (const source of sources) {
        const value = getPathValue(source, path);
        if (value !== undefined && value !== null && value !== '') return value;
      }
    }
    return undefined;
  };

  const findNestedValue = (targetKeys) => {
    for (const source of sources) {
      const stack = [source];

      while (stack.length) {
        const current = stack.pop();
        if (!current || typeof current !== 'object') continue;

        if (Array.isArray(current)) {
          current.forEach((item) => stack.push(item));
          continue;
        }

        for (const [key, value] of Object.entries(current)) {
          if (
            targetKeys.includes(key) &&
            (typeof value === 'number' || typeof value === 'string')
          ) {
            return value;
          }
          if (value && typeof value === 'object') {
            stack.push(value);
          }
        }
      }
    }

    return undefined;
  };

  const toNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string') return null;
    const cleaned = value.replace(/[,#%\s]/g, '');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatNumber = (value, fallback = '--') => {
    const numeric = toNumber(value);
    if (numeric === null) return fallback;
    return Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(numeric);
  };

  const formatRank = (value) => {
    const numeric = toNumber(value);
    if (numeric === null) return '--';
    return `#${Intl.NumberFormat('en-US').format(Math.round(numeric))}`;
  };

  const formatPercent = (value) => {
    if (typeof value === 'string' && value.includes('%')) {
      const numeric = toNumber(value);
      return numeric === null ? '--' : `${numeric.toFixed(1)}%`;
    }

    const numeric = toNumber(value);
    if (numeric === null) return '--';
    const percentValue = numeric > 1 ? numeric : numeric * 100;
    return `${percentValue.toFixed(1)}%`;
  };

  const total = pickFirst([
    'totalSolved',
    'solved',
    'total_solved',
    'data.matchedUser.submitStats.acSubmissionNum.0.count',
  ]);
  const easy = pickFirst([
    'easySolved',
    'easy',
    'easy_solved',
    'data.matchedUser.submitStats.acSubmissionNum.1.count',
  ]);
  const medium = pickFirst([
    'mediumSolved',
    'medium',
    'medium_solved',
    'data.matchedUser.submitStats.acSubmissionNum.2.count',
  ]);
  const hard = pickFirst([
    'hardSolved',
    'hard',
    'hard_solved',
    'data.matchedUser.submitStats.acSubmissionNum.3.count',
  ]);
  const ranking = pickFirst([
    'ranking',
    'rank',
    'globalRanking',
    'userContestRanking.globalRanking',
  ]);
  const acceptanceDirect = pickFirst([
    'acceptanceRate',
    'acceptance',
    'acceptance_rate',
    'data.acceptanceRate',
    'data.acceptance',
    'profile.acceptanceRate',
    'matchedUser.profile.acceptanceRate',
  ]) ?? findNestedValue(['acceptanceRate', 'acceptance_rate', 'acceptance']);
  const acceptedCount = pickFirst([
    'submitStatsGlobal.acSubmissionNum.0.count',
    'data.matchedUser.submitStatsGlobal.acSubmissionNum.0.count',
    'matchedUser.submitStatsGlobal.acSubmissionNum.0.count',
  ]);
  const submissionsCount = pickFirst([
    'submitStatsGlobal.acSubmissionNum.0.submissions',
    'data.matchedUser.submitStatsGlobal.acSubmissionNum.0.submissions',
    'matchedUser.submitStatsGlobal.acSubmissionNum.0.submissions',
  ]);
  let acceptanceValue = acceptanceDirect;
  if (acceptanceValue === undefined) {
    const acceptedNumeric = toNumber(acceptedCount);
    const submissionsNumeric = toNumber(submissionsCount);
    if (
      acceptedNumeric !== null &&
      submissionsNumeric !== null &&
      submissionsNumeric > 0
    ) {
      acceptanceValue = (acceptedNumeric / submissionsNumeric) * 100;
    }
  }

  setText(lcTotal, formatNumber(total));
  setText(lcEasy, formatNumber(easy));
  setText(lcMedium, formatNumber(medium));
  setText(lcHard, formatNumber(hard));
  setText(lcRank, formatRank(ranking));
  setText(lcAcceptance, formatPercent(acceptanceValue));
  setText(lcStatus, 'Updated just now');
};

fetchGitHubStats();
fetchLeetCodeStats();

const toDateKey = (date) => date.toISOString().slice(0, 10);

const buildHeatmap = (container, countByDate, options = {}) => {
  if (!container) return;
  const days = options.days ?? 182;
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
    cell.title = `${key}: ${count} contributions`;
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

    buildHeatmap(ghHeatmap, map, { days: 240 });
    setText(ghHeatmapStatus, 'Last 8 months of activity');
  } catch (error) {
    if (ghHeatmap) {
      ghHeatmap.classList.add('is-image');
      ghHeatmap.innerHTML = `<img src="https://ghchart.rshah.org/${ghUser}" alt="GitHub contribution heatmap" />`;
    }
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

    buildHeatmap(lcHeatmap, calendarMap, { days: 240 });
    setText(lcHeatmapStatus, 'Last 8 months of activity');
  } catch (error) {
    setText(lcHeatmapStatus, 'Unable to load LeetCode activity grid.');
  }
};

fetchGitHubHeatmap();
fetchLeetCodeHeatmap();
