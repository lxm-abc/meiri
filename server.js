/**
 * 每日工作台 - 轻量后端
 * 1) 提供静态文件服务（PWA 可安装、可添加到安卓桌面）
 * 2) 代理爬取权威媒体 RSS（人民网 / 新华网 / 中国新闻网），避免浏览器跨域限制
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const ROOT = __dirname;
const PORT = process.env.PORT || 8080;

// 权威媒体 RSS 源（央视无公开 RSS，使用中国新闻网作为权威补充源）
const FEEDS = [
  { source: '人民网', url: 'http://www.people.com.cn/rss/politics.xml' },
  { source: '新华网', url: 'http://www.xinhuanet.com/politics/news_politics.xml' },
  { source: '中国新闻网', url: 'https://www.chinanews.com.cn/rss/scroll-news.xml' },
];

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', trimValues: true });

let cache = { ts: 0, items: [] };
const CACHE_TTL = 30 * 60 * 1000;

function decode(s) {
  if (!s) return '';
  return String(s)
    .replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").trim();
}

const MAX_AGE_DAYS = 3;
function parseDate(s) {
  if (!s) return 0;
  const str = String(s).trim();
  let t = Date.parse(str);
  if (!isNaN(t)) return t;
  const m = str.match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const dt = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    if (!isNaN(dt.getTime())) return dt.getTime();
  }
  return 0;
}
function fmtDate(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function extractItems(xml, source, minTs) {
  try {
    const obj = parser.parse(xml);
    let items = obj?.rss?.channel?.item || obj?.feed?.entry;
    if (!items) return [];
    if (!Array.isArray(items)) items = [items];
    const out = [];
    for (const it of items) {
      let link = it.link;
      if (link && typeof link === 'object') link = link['@_href'] || link['#text'] || '';
      const title = decode(it.title);
      const pub = it.pubDate || it.published || it.updated || '';
      const ts = parseDate(pub);
      // 必须合法日期且落在最近 N 天内；旧稿/无日期一律丢弃
      if (!ts || ts < minTs) continue;
      if (title && link && /^https?:\/\//.test(link)) {
        out.push({ title, link: decode(link), source, pubDate: fmtDate(ts), pubTs: ts });
      }
      if (out.length >= 40) break;
    }
    return out.sort((a, b) => b.pubTs - a.pubTs);
  } catch (e) {
    return [];
  }
}

async function fetchNews() {
  const now = Date.now();
  if (cache.items.length && now - cache.ts < CACHE_TTL) return cache.items;
  const minTs = now - MAX_AGE_DAYS * 24 * 3600 * 1000;
  const results = await Promise.all(FEEDS.map(async (f) => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(f.url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
      clearTimeout(timer);
      if (!res.ok) return [];
      const text = await res.text();
      return extractItems(text, f.source, minTs);
    } catch (e) {
      return [];
    }
  }));
  // 汇总 → 去重 → 按时间倒序 → 取前 40
  const seen = new Set();
  const items = [];
  results.flat().forEach((it) => {
    const k = it.link || it.title;
    if (seen.has(k)) return;
    seen.add(k);
    items.push(it);
  });
  items.sort((a, b) => b.pubTs - a.pubTs);
  const top = items.slice(0, 40);
  cache = { ts: now, items: top, sources: FEEDS.map((f) => f.source) };
  return top;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  // 防目录穿越
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA 兜底
      fs.readFile(path.join(ROOT, 'index.html'), (e2, html) => {
        if (e2) { res.writeHead(404); res.end('Not Found'); }
        else { res.writeHead(200, { 'Content-Type': MIME['.html'] }); res.end(html); }
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];
  if (urlPath === '/api/news') {
    try {
      const items = await fetchNews();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ updated: cache.ts, sources: FEEDS.map((f) => f.source), items }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e) }));
    }
    return;
  }
  if (urlPath === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, time: Date.now() }));
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`每日工作台已启动: http://localhost:${PORT}`);
});
