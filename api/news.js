/**
 * Vercel 服务端函数：直连权威媒体 RSS，返回「最近 N 天」的新闻 JSON。
 * 关键修复：
 *  - 只保留最近 MAX_AGE_DAYS 天内的条目，自动剔除置顶/缓存的旧稿（如 6 月 5 日那条）
 *  - 兼容多种日期格式（RFC822 与 "YYYY-MM-DD HH:MM:SS"）
 *  - 按发布时间倒序（最新在前）
 *  - 统一把 pubDate 格式化为 "YYYY-MM-DD HH:MM"
 *
 * 使用 CommonJS（与 package.json 的 "type":"commonjs" 一致），Vercel 才能正确加载。
 */
const FEEDS = [
  { source: '人民网', url: 'http://www.people.com.cn/rss/politics.xml' },
  { source: '新华网', url: 'http://www.xinhuanet.com/politics/news_politics.xml' },
  { source: '中国新闻网', url: 'https://www.chinanews.com.cn/rss/scroll-news.xml' },
];

// 只展示最近 3 天内的新闻（自动剔除旧稿）
const MAX_AGE_DAYS = 3;

function clean(s) {
  return String(s == null ? '' : s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/<[^>]+>/g, '')
    .trim();
}

function parseDate(s) {
  if (!s) return 0;
  const str = String(s).trim();
  // 1) RFC822：Mon, 11 Oct 2026 03:26:00 +0000
  let t = Date.parse(str);
  if (!isNaN(t)) return t;
  // 2) "YYYY-MM-DD HH:MM:SS" 或 "YYYY-MM-DD"
  const m = str.match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const y = +m[1], mo = +m[2], d = +m[3], h = +(m[4] || 0), mi = +(m[5] || 0), se = +(m[6] || 0);
    const dt = new Date(y, mo - 1, d, h, mi, se);
    if (!isNaN(dt.getTime())) return dt.getTime();
  }
  return 0;
}

function fmt(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function grab(block, tag) {
  const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'));
  return m ? m[1] : '';
}

function extractItems(xml, source, minTs) {
  const out = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) && out.length < 40) {
    const b = m[1];
    let link = grab(b, 'link');
    if (!link) {
      const lm = b.match(/<link[^>]*href="([^"]+)"/i);
      if (lm) link = lm[1];
    }
    const title = grab(b, 'title');
    const raw = grab(b, 'pubDate') || grab(b, 'dc:date') || grab(b, 'published');
    const ts = parseDate(raw);
    // 必须有合法日期，且落在最近 N 天内；无日期或过期旧稿一律丢弃
    if (!ts || ts < minTs) continue;
    if (title && link && /^https?:\/\//.test(link)) {
      out.push({ title: clean(title), link: clean(link), source, pubDate: fmt(ts), pubTs: ts });
    }
  }
  return out;
}

async function fetchFeed(f, minTs) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(f.url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(t);
    if (!r.ok) return [];
    const xml = await r.text();
    return extractItems(xml, f.source, minTs);
  } catch (e) { return []; }
}

module.exports = async function handler(req, res) {
  try {
    const now = Date.now();
    const minTs = now - MAX_AGE_DAYS * 24 * 3600 * 1000;
    const results = await Promise.all(FEEDS.map((f) => fetchFeed(f, minTs)));

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

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      updated: now,
      sources: FEEDS.map((f) => f.source),
      windowDays: MAX_AGE_DAYS,
      items: top,
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
