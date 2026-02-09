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
const skillRails = document.querySelectorAll('[data-skill-rail]');
const viewCountEl = document.querySelector('[data-view-count]');


const labContent = {
  Education: {
    title: 'Education-first journeys',
    desc: 'Designing playful learning loops that keep students motivated and confident.',
  },
  Speech: {
    title: 'Speech therapy support',
    desc: 'Building friendly vocal coaching tools that make practice feel encouraging.',
  },
  AI: {
    title: 'AI learning companions',
    desc: 'Creating smart guidance that adapts to each learner in real time.',
  },
  Simulation: {
    title: 'Interactive simulations',
    desc: 'Crafting immersive controls for gravity, space, and motion exploration.',
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
    });
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
  if (!lcTotal && !lcEasy && !lcMedium && !lcHard) return;
  let data = null;

  for (const endpoint of leetCodeEndpoints) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('LeetCode fetch failed');
      const result = await response.json();
      if (result && (result.totalSolved !== undefined || result.solved !== undefined)) {
        data = result;
        break;
      }
    } catch (error) {
      // Try the next endpoint.
    }
  }

  if (!data) {
    setText(lcStatus, 'Unable to load LeetCode stats right now.');
    return;
  }

  const total = data.totalSolved ?? data.solved ?? '--';
  const easy = data.easySolved ?? data.easy ?? '--';
  const medium = data.mediumSolved ?? data.medium ?? '--';
  const hard = data.hardSolved ?? data.hard ?? '--';

  setText(lcTotal, total);
  setText(lcEasy, easy);
  setText(lcMedium, medium);
  setText(lcHard, hard);
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
  try {
    const response = await fetch(
      `https://leetcode-stats-api.herokuapp.com/${lcUser}`
    );
    if (!response.ok) throw new Error('LeetCode heatmap fetch failed');
    const data = await response.json();
    if (!data || !data.submissionCalendar) {
      throw new Error('LeetCode calendar missing');
    }

    const calendar =
      typeof data.submissionCalendar === 'string'
        ? JSON.parse(data.submissionCalendar)
        : data.submissionCalendar;

    const map = new Map();
    Object.entries(calendar).forEach(([timestamp, count]) => {
      const date = new Date(Number(timestamp) * 1000);
      map.set(toDateKey(date), count);
    });

    buildHeatmap(lcHeatmap, map, { days: 240 });
    setText(lcHeatmapStatus, 'Last 8 months of activity');
  } catch (error) {
    setText(lcHeatmapStatus, 'Unable to load LeetCode activity grid.');
  }
};

fetchGitHubHeatmap();
fetchLeetCodeHeatmap();
