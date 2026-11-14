(() => {
  const username = 'KyleAxity_';
  const api = 'https://api.jikan.moe/v4/users/' + encodeURIComponent(username);
  const content = document.querySelector('#mal-content');
  const select = document.querySelector('#mal-category');
  const sync = document.querySelector('#mal-sync-status');
  const refresh = document.querySelector('#mal-refresh');
  let data, snapshot, mode = 'stats', page = 0, initialized = false, syncing = false, apiState = 'snapshot';
  const number = value => Number(value || 0).toLocaleString('en-US');
  function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
  function safeLink(url) { try { const u = new URL(url, 'https://myanimelist.net'); return u.protocol === 'https:' && (u.hostname === 'myanimelist.net' || u.hostname === 'www.myanimelist.net') ? u.href : 'https://myanimelist.net/profile/KyleAxity_'; } catch { return 'https://myanimelist.net/profile/KyleAxity_'; } }
  function picture(entry) { const img = el('img'); img.alt = ''; img.loading = 'lazy'; img.src = entry.image || 'assets/slime-icon.svg'; img.addEventListener('error', () => { if (!img.src.endsWith('/assets/slime-icon.svg')) img.src = 'assets/slime-icon.svg'; }, { once: true }); return img; }
  function profileDate(value) { return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }); }
  function updateStatus() { if (!data) return; const saved = 'MAL profile snapshot · ' + profileDate(snapshot.fetched_at); sync.textContent = (mode === 'shelves' || (mode === 'favorites' && select.value === 'studios')) ? saved : apiState === 'live' ? 'Synced via Jikan · ' + profileDate(data.synced_at) : apiState === 'loading' ? saved + ' · syncing…' : apiState === 'offline' ? saved + ' · API unavailable' : saved; }
  function setOptions() {
    const options = mode === 'stats' ? [['anime', 'Anime'], ['manga', 'Manga']] : mode === 'favorites' ? [['anime', 'Anime'], ['manga', 'Manga'], ['characters', 'Characters'], ['people', 'People'], ['studios', 'Studios']] : Object.keys(data.shelves).map(key => [key, key]);
    const previous = select.value; select.replaceChildren();
    options.forEach(([value, label]) => { const option = el('option', '', label); option.value = value; select.append(option); });
    if (options.some(([value]) => value === previous)) select.value = previous;
  }
  function stats() {
    const kind = select.value, s = data.statistics[kind]; const layout=el('div','mal-stats-layout'),left=el('div'),right=el('div');layout.append(left,right);content.append(layout);
    if (!s) { content.append(el('p', 'mal-empty', 'Open MyAnimeList to see the full list.')); return; }
    const metrics = [['Total Entries', 'Entries'], ['Completed', 'Completed'], [kind === 'anime' ? 'Episodes' : 'Chapters', kind === 'anime' ? 'Episodes' : 'Chapters'], ['Mean Score', 'Mean score'], ['Days', kind === 'anime' ? 'Days watched' : 'Days read'], [kind === 'anime' ? 'Rewatched' : 'Reread', kind === 'anime' ? 'Rewatched' : 'Reread']];
    const grid = el('div', 'mal-metrics');
    metrics.forEach(([key, label]) => { const metric = el('div', 'mal-metric'); metric.append(el('strong', '', number(s[key])), el('span', '', label)); grid.append(metric); });
    left.append(grid);
    const list = el('div', 'mal-status-list');
    [kind === 'anime' ? 'Watching' : 'Reading', 'Completed', 'On-Hold', 'Dropped', kind === 'anime' ? 'Plan to Watch' : 'Plan to Read'].forEach(label => list.append(el('span', '', label + ' ' + number(s[label]))));
    left.append(list);
    const heading = el('div', 'mal-recent-heading'); const history = el('a', '', 'History ↗'); history.href = 'https://myanimelist.net/history/' + username + '/' + kind; history.target = '_blank'; history.rel = 'noopener noreferrer'; heading.append(el('h3', '', kind === 'anime' ? 'Recent anime updates' : 'Recent manga updates'), history); right.append(heading);
    const count = matchMedia('(max-width: 700px)').matches ? 2 : 3;
    (data.updates[kind] || []).slice(0, count).forEach(entry => { const link = el('a', 'mal-update'); link.href = safeLink(entry.url); link.target = '_blank'; link.rel = 'noopener noreferrer'; const info = el('div'); info.style.minWidth = '0'; info.append(el('strong', '', entry.title), el('p', '', entry.detail)); link.append(picture(entry), info); right.append(link); });
  }
  function covers() {
    const category = select.value;
    const entries = mode === 'favorites' ? data.favorites[category] || [] : data.shelves[category] || [];
    const labels = { anime: 'Favorite anime', manga: 'Favorite manga', characters: 'Favorite characters', people: 'Favorite people', studios: 'Favorite studios' };
    content.append(el('h3', 'mal-cover-title', mode === 'favorites' ? labels[category] : category));
    if (!entries.length) { content.append(el('p', 'mal-empty', 'No public entries in this category.')); return; }
    const size = matchMedia('(min-width: 1001px)').matches ? 8 : 4; const pages = Math.ceil(entries.length / size); page = Math.min(page, pages - 1);
    const grid = el('div', 'mal-cover-grid');
    entries.slice(page * size, page * size + size).forEach(entry => { const link = el('a', 'mal-cover-card'); link.href = safeLink(entry.url); link.target = '_blank'; link.rel = 'noopener noreferrer'; link.title = entry.title; link.append(picture(entry), el('strong', '', entry.title)); grid.append(link); });
    content.append(grid);
    if (pages > 1) { const pager = el('div', 'pager'); const prev = el('button', '', '←'), next = el('button', '', '→'); prev.setAttribute('aria-label', 'Previous MAL page'); next.setAttribute('aria-label', 'Next MAL page'); prev.disabled = page === 0; next.disabled = page === pages - 1; prev.addEventListener('click', () => { page--; render(); }); next.addEventListener('click', () => { page++; render(); }); pager.append(prev, el('span', '', (page + 1) + ' / ' + pages), next); content.append(pager); }
  }
  function render() { if (!data) return; document.querySelector('#view-anime').dataset.malView=mode; content.replaceChildren(); if (mode === 'stats') stats(); else covers(); updateStatus(); }
  async function json(url, timeout = 6000) { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeout); try { const response = await fetch(url, { signal: controller.signal }); if (!response.ok) throw new Error('Service unavailable'); return await response.json(); } finally { clearTimeout(timer); } }
  function normalizeEntry(entry) { const image = entry.images?.jpg?.large_image_url || entry.images?.jpg?.image_url || entry.images?.webp?.image_url; return { title: entry.title || entry.name || 'MyAnimeList entry', url: entry.url, image }; }
  function convertStats(s, kind) { return { 'Total Entries': s.total_entries, Completed: s.completed, 'Mean Score': s.mean_score, Days: kind === 'anime' ? s.days_watched : s.days_read, 'On-Hold': s.on_hold, Dropped: s.dropped, ...(kind === 'anime' ? { Watching: s.watching, 'Plan to Watch': s.plan_to_watch, Rewatched: s.rewatched, Episodes: s.episodes_watched } : { Reading: s.reading, 'Plan to Read': s.plan_to_read, Reread: s.reread, Chapters: s.chapters_read, Volumes: s.volumes_read }) }; }
  async function syncLive() {
    if (syncing || !data) return; syncing = true; refresh.disabled = true; apiState = 'loading'; updateStatus();
    try {
      const statistics = (await json(api + '/statistics')).data;
      await new Promise(resolve => setTimeout(resolve, 600));
      const favorites = (await json(api + '/favorites')).data;
      await new Promise(resolve => setTimeout(resolve, 600));
      const updates = (await json(api + '/userupdates')).data;
      if (!statistics?.anime || !statistics?.manga || !favorites || !updates) throw new Error('Incomplete profile');
      const result = { ...snapshot, statistics: { anime: convertStats(statistics.anime, 'anime'), manga: convertStats(statistics.manga, 'manga') }, favorites: { ...snapshot.favorites }, updates: {}, synced_at: new Date().toISOString() };
      ['anime', 'manga', 'characters', 'people'].forEach(kind => { if (Array.isArray(favorites[kind])) result.favorites[kind] = favorites[kind].map(normalizeEntry); });
      ['anime', 'manga'].forEach(kind => { result.updates[kind] = (updates[kind] || []).map(item => ({ ...normalizeEntry(item.entry), detail: item.status + (kind === 'anime' && item.episodes_seen != null ? ' ' + item.episodes_seen + '/' + (item.episodes_total || '?') : kind === 'manga' && item.chapters_read != null ? ' · Chapter ' + item.chapters_read : '') + (item.score ? ' · Scored ' + item.score : '') })); });
      data = result; apiState = 'live'; try { localStorage.setItem('kyle-mal-cache-v1', JSON.stringify({ saved: Date.now(), data })); } catch {}
    } catch { apiState = data.synced_at ? 'live' : 'offline'; } finally { syncing = false; refresh.disabled = false; render(); }
  }
  async function initialize() { if (initialized) return; initialized = true; try { snapshot = await json('mal-snapshot.json'); data = snapshot; try { const cached = JSON.parse(localStorage.getItem('kyle-mal-cache-v1')); if (cached?.data?.statistics?.anime && Date.now() - cached.saved < 6 * 60 * 60 * 1000) { data = cached.data; apiState = 'live'; } } catch {} setOptions(); render(); if (apiState !== 'live') syncLive(); } catch { content.replaceChildren(el('p', 'mal-empty', 'The MAL preview is unavailable. Open MyAnimeList using the link above.')); } }
  document.querySelectorAll('[data-mal-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.malMode; page = 0; document.querySelectorAll('[data-mal-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); if (data) { setOptions(); render(); } }));
  select.addEventListener('change', () => { page = 0; render(); }); refresh.addEventListener('click', syncLive);
  document.querySelector('[data-view="anime"]').addEventListener('click', initialize);
  addEventListener('hashchange', () => { if (location.hash === '#anime') initialize(); });
  addEventListener('profile:view',event=>{if(event.detail==='anime')initialize()}); if (location.hash === '#anime') initialize();
})();




