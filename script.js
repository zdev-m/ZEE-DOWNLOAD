/* ============================================================
   YouTube Downloader — Vanilla JS
   NOTE: Real YouTube downloading requires a backend (yt-dlp etc.)
   due to CORS + ToS. The fetchVideoInfo() function is a clearly
   marked placeholder you can wire to your own API endpoint.
   ============================================================ */

document.getElementById('yr').textContent = new Date().getFullYear();

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ---------- Ripple effect ---------- */
function attachRipple(el) {
  el.addEventListener('click', (e) => {
    const rect = el.getBoundingClientRect();
    const r = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    r.className = 'ripple';
    r.style.width = r.style.height = size + 'px';
    r.style.left = (e.clientX - rect.left - size / 2) + 'px';
    r.style.top = (e.clientY - rect.top - size / 2) + 'px';
    el.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
}
$$('.btn, .dl-btn, .nav-cta').forEach(attachRipple);

/* ---------- Toast ---------- */
const toast = $('#toast');
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---------- URL helpers ---------- */
function extractVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/* ---------- Paste button ---------- */
$('#pasteBtn').addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    $('#urlInput').value = text;
    showToast('Pasted from clipboard');
  } catch {
    showToast('Clipboard access denied');
  }
});

/* ---------- Sample / placeholder API ---------- */
async function fetchVideoInfo(videoId) {
  let title = '';
  let channel = '';
  let channelInitial = 'Y';

  try {
    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && !data.error) {
        title = data.title || '';
        channel = data.author_name || '';
        channelInitial = channel ? channel.charAt(0).toUpperCase() : 'Y';
      }
    }
  } catch (e) {}

  if (!title) title = 'YouTube Video';
  if (!channel) channel = 'YouTube Channel';

  return {
    id: videoId,
    title,
    channel,
    channelInitial,
    verified: false,
    duration: '—',
    views: '—',
    published: '—',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    fallbackThumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    formats: {
      video: [
        { quality: '144p',  ext: 'MP4', size: '8.2 MB',   tag: '' },
        { quality: '240p',  ext: 'MP4', size: '14.6 MB',  tag: '' },
        { quality: '360p',  ext: 'MP4', size: '28.4 MB',  tag: '' },
        { quality: '480p',  ext: 'MP4', size: '48.1 MB',  tag: '' },
        { quality: '720p',  ext: 'MP4', size: '94.7 MB',  tag: 'HD' },
        { quality: '1080p', ext: 'MP4', size: '186.3 MB', tag: 'Full HD' },
      ],
      audio: [
        { quality: '128 kbps', ext: 'MP3', size: '11.8 MB' },
        { quality: '192 kbps', ext: 'MP3', size: '17.6 MB' },
        { quality: '320 kbps', ext: 'MP3', size: '29.3 MB' },
      ],
    },
  };
}

/* ---------- Render preview ---------- */
const previewSection = $('#previewSection');
const downloadSection = $('#downloadSection');

function renderSkeleton() {
  previewSection.hidden = false;
  previewSection.innerHTML = `
    <div class="thumb skeleton" style="border-radius:20px"></div>
    <div class="video-meta">
      <div class="skeleton" style="height:24px;width:90%"></div>
      <div class="skeleton" style="height:18px;width:60%;margin-top:14px"></div>
      <div class="skeleton" style="height:18px;width:75%;margin-top:14px"></div>
      <div class="skeleton" style="height:18px;width:40%;margin-top:14px"></div>
    </div>`;
  previewSection.classList.add('preview', 'glass');
  previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPreview(info) {
  previewSection.innerHTML = `
    <div class="thumb" id="thumbWrap" style="cursor:pointer" title="Click to play">
      <img id="thumbImg" src="${info.thumbnail}" alt="${info.title}" loading="lazy"
           onerror="this.onerror=null;this.src='${info.fallbackThumb}'" />
      <div class="play-glow"><div class="pulse">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </div></div>
      <div class="duration-badge">${info.duration}</div>
    </div>
    <div class="video-meta">
      <h3>${info.title}</h3>
      <div class="channel">
        <div class="avatar">${info.channelInitial}</div>
        <div>
          <div class="name">${info.channel}${info.verified ? `
            <span class="verified" title="Verified">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.5 2.2 3.3-.4.9 3.2 3 1.4-1.1 3.2 1.1 3.2-3 1.4-.9 3.2-3.3-.4L12 22l-2.5-2.2-3.3.4-.9-3.2-3-1.4 1.1-3.2L2.3 9l3-1.4.9-3.2 3.3.4L12 2zm-1 13l6-6-1.4-1.4L11 12.2 8.4 9.6 7 11l4 4z"/></svg>
            </span>` : ''}
          </div>
          <div style="color:#6b7385;font-size:13px;margin-top:2px">${info.published}</div>
        </div>
      </div>
      <div class="stats">
        <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg> ${info.views} views</span>
        <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> ${info.duration}</span>
        <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Ready</span>
      </div>
    </div>`;

  // Thumb click = inline YouTube player
  document.getElementById('thumbWrap').addEventListener('click', () => {
    const wrap = document.getElementById('thumbWrap');
    wrap.innerHTML = `<iframe
      src="https://www.youtube.com/embed/${info.id}?autoplay=1&rel=0"
      allow="autoplay; encrypted-media; fullscreen"
      allowfullscreen
      style="position:absolute;inset:0;width:100%;height:100%;border:none;border-radius:20px"
    ></iframe>`;
    wrap.style.cursor = 'default';
  });
}

function renderFormats(info) {
  downloadSection.hidden = false;
  const videoCards = info.formats.video.map(f => formatCard(f, 'video')).join('');
  const audioCards = info.formats.audio.map(f => formatCard(f, 'audio')).join('');
  downloadSection.innerHTML = `
    <div class="container">
      <h2>Choose Your Download</h2>
      <p class="lead">Pick the perfect quality and format. All downloads are processed at lightning speed.</p>
      <div class="tabs glass" role="tablist">
        <button class="tab active" data-tab="video">Video</button>
        <button class="tab" data-tab="audio">Audio</button>
      </div>
      <div id="videoGrid" class="format-grid">${videoCards}</div>
      <div id="audioGrid" class="format-grid" hidden>${audioCards}</div>
    </div>`;

  // tab switching
  $$('.tab', downloadSection).forEach(t => {
    t.addEventListener('click', () => {
      $$('.tab', downloadSection).forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const isVideo = t.dataset.tab === 'video';
      $('#videoGrid').hidden = !isVideo;
      $('#audioGrid').hidden = isVideo;
    });
  });

  // download buttons
  $$('.dl-btn', downloadSection).forEach(btn => {
    attachRipple(btn);
    btn.addEventListener('click', () => startDownload(btn.dataset));
  });

  // reveal animation
  $$('.format-card', downloadSection).forEach((el, i) => {
    el.style.transitionDelay = (i * 40) + 'ms';
    el.classList.add('reveal');
    requestAnimationFrame(() => el.classList.add('in'));
  });
}

function formatCard(f, kind) {
  const tag = kind === 'audio'
    ? `<span class="tag audio">MP3</span>`
    : (f.tag ? `<span class="tag ${/HD/.test(f.tag) ? 'hd' : ''}">${f.tag}</span>` : '');
  const icon = kind === 'audio'
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4V8z"/></svg>`;
  return `
    <div class="format-card glass">
      <div class="format-head">
        <div class="quality-badge">${icon}${f.quality}</div>
        ${tag}
      </div>
      <div class="format-meta">
        <span>${f.ext}</span>
        <span>${f.size}</span>
      </div>
      <button class="dl-btn" data-quality="${f.quality}" data-ext="${f.ext}" data-size="${f.size}">
        Download
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>
      </button>
    </div>`;
}

/* ---------- Analyze flow ---------- */
async function analyze() {
  const url = $('#urlInput').value.trim();
  const id = extractVideoId(url);
  if (!id) {
    showToast('Please enter a valid YouTube URL');
    $('#urlInput').focus();
    return;
  }
  const btn = $('#analyzeBtn');
  btn.disabled = true;
  btn.innerHTML = `<span style="width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;display:inline-block;animation:spin .7s linear infinite"></span> Analyzing...`;
  renderSkeleton();
  try {
    const info = await fetchVideoInfo(id);
    renderPreview(info);
    renderFormats(info);
    showToast('Video ready');
  } catch (e) {
    showToast('Could not fetch video info');
    previewSection.hidden = true;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `Analyze Video
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>`;
  }
}

$('#analyzeBtn').addEventListener('click', analyze);
$('#urlInput').addEventListener('keydown', e => { if (e.key === 'Enter') analyze(); });

/* ---------- Download progress modal ---------- */
const modal = $('#progressModal');
const ring = $('.progress-ring .bar');
const pctEl = $('#progressPct');
const speedEl = $('#progressSpeed');
const sizeEl = $('#progressSize');
const titleEl = $('#progressTitle');
const subEl = $('#progressSub');
const CIRC = 471; // 2 * pi * 75

let dlTimer = null;
function startDownload({ quality, ext, size }) {
  titleEl.textContent = `Downloading ${quality}`;
  subEl.textContent = `${ext} • ${size}`;
  sizeEl.innerHTML = `${size}<strong>Total</strong>`;
  modal.classList.add('show');
  let p = 0;
  setRing(0);
  pctEl.textContent = '0%';
  dlTimer = setInterval(() => {
    p += Math.random() * 6 + 2;
    if (p >= 100) { p = 100; clearInterval(dlTimer); dlTimer = null;
      setTimeout(() => { modal.classList.remove('show'); showToast(`${quality} ${ext} ready`); }, 600);
    }
    setRing(p);
    pctEl.textContent = Math.floor(p) + '%';
    const speed = (2 + Math.random() * 6).toFixed(1);
    speedEl.innerHTML = `${speed} MB/s<strong>Speed</strong>`;
  }, 220);
}
function setRing(p) {
  ring.style.strokeDashoffset = CIRC - (CIRC * p / 100);
}
$('#cancelBtn').addEventListener('click', () => {
  if (dlTimer) clearInterval(dlTimer);
  modal.classList.remove('show');
  showToast('Download cancelled');
});

/* ---------- FAQ accordion ---------- */
$$('.faq-item').forEach(item => {
  item.querySelector('.faq-q').addEventListener('click', () => {
    item.classList.toggle('open');
  });
});

/* ---------- Reveal on scroll ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }});
}, { threshold: 0.12 });
$$('.reveal').forEach(el => io.observe(el));

/* ---------- Smooth scroll for nav ---------- */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const el = $(id);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }
  });
});

/* ---------- Spinner keyframe ---------- */
const style = document.createElement('style');
style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
document.head.appendChild(style);
