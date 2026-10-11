/**
 * Netlify 服务端函数：直连权威媒体 RSS，返回 JSON。
 * netlify.toml 已将 /api/news 重写到本函数。
 */
const FEEDS = [
  { source: '人民网', url: 'http://www.people.com.cn/rss/politics.xml' },
  { source: '新华网', url: 'http://www.xinhuanet.com/politics/news_politics.xml' },
  { source: '中国新闻网', url: 'https://www.chinanews.com.cn/rss/scroll-news.xml' },
];

function clean(s) {
  return String(s == null ? '' : s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/<[^>]+>/g, '')
    .trim();
}
function grab(block, tag) {
  const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'));
  return m ? m[1] : '';
}
function extractItems(xml, source) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) && items.length < 30) {
    const b = m[1];
    let link = grab(b, 'link');
    if (!link) {
      const lm = b.match(/<link[^>]*href="([^"]+)"/i);
      if (lm) link = lm[1];
    }
    const title = grab(b, 'title');
    const pub = grab(b, 'pubDate') || grab(b, 'dc:date') || grab(b, 'published');
    if (title && link && /^https?:\/\//.test(link)) {
      items.push({ title: clean(title), link: clean(link), source, pubDate: clean(pub) });
    }
  }
  return items;
}
async function fetchFeed(f) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(f.url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(t);
    if (!r.ok) return [];
    const xml = await r.text();
    return extractItems(xml, f.source);
  } catch (e) { return []; }
}

exports.handler = async (event, context) => {
  try {
    const results = await Promise.all(FEEDS.map(fetchFeed));
    const grouped = {};
    results.forEach((arr, i) => { grouped[FEEDS[i].source] = (arr || []).slice(0, 30); });
    const sources = FEEDS.map((f) => f.source);
    const maxLen = Math.max(0, ...sources.map((s) => (grouped[s] || []).length));
    const combined = [];
    for (let i = 0; i < maxLen; i++) {
      for (const s of sources) {
        const it = grouped[s] && grouped[s][i];
        if (it) combined.push(it);
      }
    }
    const seen = new Set();
    const items = combined.filter((i) => {
      const k = i.link || i.title;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ updated: Date.now(), sources, items }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
