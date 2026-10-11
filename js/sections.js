/* ============ 八大功能区 ============ */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function computeStreak(doneArr) {
    const done = new Set(doneArr || []);
    let d = D.today();
    if (!done.has(d)) {
      d = D.addDays(d, -1);
      if (!done.has(d)) return 0;
    }
    let s = 0;
    while (done.has(d)) { s++; d = D.addDays(d, -1); }
    return s;
  }
  function toggleDate(arr, date) {
    const i = arr.indexOf(date);
    if (i >= 0) arr.splice(i, 1); else arr.push(date);
    return arr;
  }

  /* ---------------- 1. 习惯养成 ---------------- */
  function habits(root) {
    const h = Store.get('habits', { warmWater: { done: [] }, ted: { weeks: [] }, audio: { days: {} }, blog: { days: {} } });
    const today = D.today();
    const wwDone = (h.warmWater.done || []).includes(today);
    const wwStreak = computeStreak(h.warmWater.done);

    const curWeek = D.mondayOf(today);
    const tedDone = (h.ted.weeks || []).includes(curWeek);
    const audioToday = (h.audio.days[today] || []);
    const audioOk = audioToday.some((m) => m >= 3);
    const blogDone = !!h.blog.days[today];

    root.innerHTML = `
      <div class="stats">
        <div class="stat"><div class="num">${wwStreak}</div><div class="lbl">温开水连续天数</div></div>
        <div class="stat"><div class="num">${tedDone ? '✓' : '—'}</div><div class="lbl">本周TED</div></div>
        <div class="stat"><div class="num">${audioOk ? '✓' : (audioToday.length || 0)}</div><div class="lbl">今日音频达标</div></div>
        <div class="stat"><div class="num">${blogDone ? '✓' : '—'}</div><div class="lbl">今日博客</div></div>
      </div>

      <div class="card">
        <div class="card-title">💧 每日晨喝温开水 <span class="sub">养成晨间补水习惯</span></div>
        <div class="item">
          <div class="check ${wwDone ? 'on' : ''}" id="wwChk">${wwDone ? '✓' : ''}</div>
          <div class="grow">
            <div class="title">今天喝了温开水吗？</div>
            <div class="meta">当前连续完成 <b>${wwStreak}</b> 天${wwDone ? '（今日已打卡）' : ''}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🇬🇧 英语学习 <span class="sub">TED / 听力 / 博客</span></div>

        <div style="margin-bottom:14px">
          <div style="font-weight:700;margin-bottom:6px">① 英语 TED 观看 <span class="badge gray">频率 ≥ 1 次/周</span></div>
          <div class="item">
            <div class="grow"><div class="title">本周（${D.pretty(curWeek)} 起）是否已观看</div>
              <div class="meta">状态：${tedDone ? '<span class="badge ok">本周已完成</span>' : '<span class="badge gray">本周未完成</span>'}</div></div>
            <button class="btn sm" id="tedBtn">${tedDone ? '取消本周' : '标记本周已观看'}</button>
          </div>
        </div>

        <div style="margin-bottom:14px">
          <div style="font-weight:700;margin-bottom:6px">② 每日英语音频收听 <span class="badge gray">≥1个 且 单次≥3分钟</span></div>
          <div class="row">
            <div><label class="fld">本次收听时长（分钟）</label><input type="number" id="audMin" min="0" step="0.5" placeholder="如 5"></div>
            <button class="btn" id="audAdd">＋ 记录本次</button>
          </div>
          <div class="meta" style="margin-top:8px">今日已记录 <b>${audioToday.length}</b> 次：${audioToday.map((m) => m + '分').join('、') || '无'}
            ｜ 达标：${audioOk ? '<span class="badge ok">已达标</span>' : '<span class="badge gray">未达标</span>'}</div>
        </div>

        <div>
          <div style="font-weight:700;margin-bottom:6px">③ 博客学习</div>
          <div class="item">
            <div class="check ${blogDone ? 'on' : ''}" id="blogChk">${blogDone ? '✓' : ''}</div>
            <div class="grow"><div class="title">今日完成博客学习？</div>
              <div class="meta">${blogDone ? '今日已记录' + (h.blog.days[today] ? '：' + UI.esc(h.blog.days[today]) : '') : '勾选以记录今日'}</div></div>
          </div>
          <label class="fld">学习笔记（可选）</label>
          <textarea id="blogNote" rows="2" placeholder="今天读了什么博客 / 收获">${blogDone ? UI.esc(h.blog.days[today] || '') : ''}</textarea>
          <button class="btn ghost sm" id="blogSave" style="margin-top:6px">保存笔记</button>
        </div>
      </div>
    `;

    $('#wwChk', root).onclick = () => {
      toggleDate(h.warmWater.done, today); Store.set('habits', h); habits(root);
    };
    $('#tedBtn', root).onclick = () => {
      const w = h.ted.weeks;
      if (w.includes(curWeek)) w.splice(w.indexOf(curWeek), 1); else w.push(curWeek);
      Store.set('habits', h); habits(root);
    };
    $('#audAdd', root).onclick = () => {
      const m = parseFloat($('#audMin', root).value);
      if (!(m > 0)) { UI.toast('请输入有效时长'); return; }
      if (!h.audio.days[today]) h.audio.days[today] = [];
      h.audio.days[today].push(m);
      Store.set('habits', h); habits(root);
    };
    $('#blogChk', root).onclick = () => {
      if (h.blog.days[today]) delete h.blog.days[today];
      else h.blog.days[today] = '';
      Store.set('habits', h); habits(root);
    };
    $('#blogSave', root).onclick = () => {
      const note = $('#blogNote', root).value.trim();
      if (!h.blog.days[today]) h.blog.days[today] = note || '';
      else h.blog.days[today] = note;
      Store.set('habits', h); UI.toast('已保存');
    };
  }

  /* ---------------- 2. 科研 ---------------- */
  function research(root) {
    let list = Store.get('research', []);
    const month = D.thisMonth();
    const monthCount = list.filter((x) => (x.date || '').startsWith(month)).length;
    root.innerHTML = `
      <div class="stats">
        <div class="stat"><div class="num">${list.length}</div><div class="lbl">累计文献</div></div>
        <div class="stat"><div class="num">${monthCount}</div><div class="lbl">本月已读</div></div>
      </div>
      <div class="card">
        <div class="card-title">🔬 文献阅读记录</div>
        <div class="row">
          <div><label class="fld">标题 *</label><input id="rTitle" placeholder="论文 / 报告标题"></div>
          <div><label class="fld">作者</label><input id="rAuthor" placeholder="可选"></div>
        </div>
        <label class="fld">链接</label><input id="rLink" placeholder="https://...">
        <label class="fld">阅读笔记</label><textarea id="rNote" rows="2" placeholder="核心观点 / 启发"></textarea>
        <button class="btn block" id="rAdd" style="margin-top:10px">＋ 添加文献记录</button>
      </div>
      <div class="card">
        <div class="card-title">📖 已读列表 <span class="sub">${list.length} 条</span></div>
        <div class="list" id="rList">
          ${list.length ? '' : '<div class="empty">还没有记录，添加第一篇文献吧</div>'}
        </div>
      </div>
    `;
    const ul = $('#rList', root);
    list.forEach((x) => {
      const el = document.createElement('div');
      el.className = 'item';
      el.innerHTML = `
        <div class="grow">
          <div class="title">${UI.esc(x.title)}</div>
          <div class="meta">${UI.esc(x.author || '')} ｜ ${D.pretty(x.date)}${x.link ? ' ｜ <a href="' + UI.esc(x.link) + '" target="_blank" rel="noopener" style="color:var(--low)">原文↗</a>' : ''}</div>
          ${x.note ? '<div class="meta">' + UI.esc(x.note) + '</div>' : ''}
        </div>
        <button class="btn danger sm" data-del="${x.id}">删除</button>`;
      el.querySelector('[data-del]').onclick = async () => {
        if (await UI.confirm('确定删除这条文献记录？')) {
          list = list.filter((i) => i.id !== x.id); Store.set('research', list); research(root);
        }
      };
      ul.appendChild(el);
    });
    $('#rAdd', root).onclick = () => {
      const title = $('#rTitle', root).value.trim();
      if (!title) { UI.toast('请填写标题'); return; }
      list.unshift({
        id: uid(), title, author: $('#rAuthor', root).value.trim(),
        link: $('#rLink', root).value.trim(), note: $('#rNote', root).value.trim(), date: D.today(),
      });
      Store.set('research', list); research(root);
    };
  }

  /* ---------------- 3. 运动 ---------------- */
  function exercise(root) {
    const ex = Store.get('exercise', { rides: {} });
    const today = D.today();
    const ride = ex.rides[today];
    const doneToday = !!ride;
    const streak = computeStreak(Object.keys(ex.rides));
    const total = Object.keys(ex.rides).length;
    const kmTotal = Object.values(ex.rides).reduce((s, r) => s + (parseFloat(r.km) || 0), 0);

    root.innerHTML = `
      <div class="stats">
        <div class="stat"><div class="num">${streak}</div><div class="lbl">连续骑行(天)</div></div>
        <div class="stat"><div class="num">${total}</div><div class="lbl">累计次数</div></div>
        <div class="stat"><div class="num">${kmTotal.toFixed(1)}</div><div class="lbl">累计公里</div></div>
      </div>
      <div class="card">
        <div class="card-title">🚴 每日骑车</div>
        <div class="item">
          <div class="check ${doneToday ? 'on' : ''}" id="exChk">${doneToday ? '✓' : ''}</div>
          <div class="grow"><div class="title">今天骑了吗？</div>
            <div class="meta">${doneToday ? '今日已记录' : '勾选记录今日骑行'}</div></div>
        </div>
        <div class="row" style="margin-top:12px">
          <div><label class="fld">里程 (km)</label><input type="number" id="exKm" min="0" step="0.1" value="${ride ? ride.km : ''}" placeholder="如 5"></div>
          <div><label class="fld">时长 (分钟)</label><input type="number" id="exMin" min="0" step="1" value="${ride ? ride.min : ''}" placeholder="如 20"></div>
          <button class="btn" id="exSave">保存</button>
        </div>
      </div>
    `;
    $('#exChk', root).onclick = () => {
      if (ex.rides[today]) delete ex.rides[today];
      else ex.rides[today] = { km: '', min: '' };
      Store.set('exercise', ex); exercise(root);
    };
    $('#exSave', root).onclick = () => {
      ex.rides[today] = {
        km: parseFloat($('#exKm', root).value) || 0,
        min: parseFloat($('#exMin', root).value) || 0,
      };
      Store.set('exercise', ex); UI.toast('已保存'); exercise(root);
    };
  }

  /* ---------------- 4. 学习（待办） ---------------- */
  function study(root) {
    let todos = Store.get('todos', []);
    const state = study._tab || 'today';
    const pr = { high: 0, mid: 1, low: 2 };
    const today = D.today();

    function visible() {
      let arr = todos.slice();
      if (state === 'today') {
        arr = arr.filter((t) => !t.done && (t.deadline === today || t.deadline === '' || D.isOverdue(t.deadline)));
      } else if (state === 'active') arr = arr.filter((t) => !t.done);
      else if (state === 'done') arr = arr.filter((t) => t.done);
      arr.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (pr[a.priority] !== pr[b.priority]) return pr[a.priority] - pr[b.priority];
        return (a.deadline || '9999') < (b.deadline || '9999') ? -1 : 1;
      });
      return arr;
    }
    const plabel = { high: '高', mid: '中', low: '低' };
    const pbadge = { high: 'high', mid: 'mid', low: 'low' };

    root.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px">
        <div class="tabs" id="tabs">
          <button data-t="today" class="${state === 'today' ? 'active' : ''}">今日待办</button>
          <button data-t="all" class="${state === 'all' ? 'active' : ''}">全部</button>
          <button data-t="active" class="${state === 'active' ? 'active' : ''}">进行中</button>
          <button data-t="done" class="${state === 'done' ? 'active' : ''}">已完成</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">➕ 新建任务</div>
        <label class="fld">任务内容</label><input id="tText" placeholder="要做什么？">
        <div class="row">
          <div><label class="fld">优先级</label>
            <select id="tPri"><option value="high">高</option><option value="mid" selected>中</option><option value="low">低</option></select></div>
          <div><label class="fld">截止日期</label><input type="date" id="tDue"></div>
          <button class="btn" id="tAdd">添加</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📋 任务清单 <span class="sub">${visible().length} 项</span></div>
        <div class="list" id="tList">
          ${visible().length ? '' : '<div class="empty">这里空空如也</div>'}
        </div>
      </div>
    `;
    const ul = $('#tList', root);
    visible().forEach((t) => {
      const overdue = !t.done && D.isOverdue(t.deadline);
      const el = document.createElement('div');
      el.className = 'item' + (t.done ? ' done' : '');
      el.innerHTML = `
        <div class="check ${t.done ? 'on' : ''}" data-chk="${t.id}">${t.done ? '✓' : ''}</div>
        <div class="grow">
          <div class="title">${UI.esc(t.text)} <span class="badge ${pbadge[t.priority]}">${plabel[t.priority]}</span></div>
          <div class="meta">${t.deadline ? '截止 ' + D.pretty(t.deadline) : '无截止'}${overdue ? ' ｜ <span class="badge high">已逾期</span>' : ''}</div>
        </div>
        <button class="btn danger sm" data-del="${t.id}">删除</button>`;
      el.querySelector('[data-chk]').onclick = () => {
        const x = todos.find((i) => i.id === t.id); x.done = !x.done; Store.set('todos', todos); study(root);
      };
      el.querySelector('[data-del]').onclick = async () => {
        if (await UI.confirm('删除该任务？')) { todos = todos.filter((i) => i.id !== t.id); Store.set('todos', todos); study(root); }
      };
      ul.appendChild(el);
    });
    $$('#tabs button', root).forEach((b) => b.onclick = () => { study._tab = b.dataset.t; study(root); });
    $('#tAdd', root).onclick = () => {
      const text = $('#tText', root).value.trim();
      if (!text) { UI.toast('请填写任务内容'); return; }
      todos.push({ id: uid(), text, priority: $('#tPri', root).value, deadline: $('#tDue', root).value, done: false, createdAt: D.today() });
      Store.set('todos', todos); study(root);
    };
  }

  /* ---------------- 5. 新闻热点 ---------------- */
  function news(root) {
    let cache = Store.get('news', { items: [], updated: 0 });
    let offset = news._off || 0;
    const PER = 10;

    root.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
        <div class="news-rotate-note" id="newsNote">正在加载权威媒体新闻…</div>
        <div style="display:flex;gap:8px">
          <button class="btn ghost sm" id="newsRotate">🔄 换一批</button>
          <button class="btn sm" id="newsRefresh">↻ 刷新</button>
        </div>
      </div>
      <div class="news-grid" id="newsGrid"><div class="empty">加载中…</div></div>
    `;

    function render(items, fromCache) {
      const note = $('#newsNote', root);
      const grid = $('#newsGrid', root);
      if (!items || !items.length) {
        grid.innerHTML = '<div class="empty">暂无可读新闻，请点击「刷新」或检查网络</div>';
        note.textContent = fromCache ? '显示缓存内容' : '暂无新闻';
        return;
      }
      const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      const maxStart = Math.max(0, items.length - PER);
      let start = (offset || (doy % (maxStart + 1)));
      if (start > maxStart) start = 0;
      const slice = items.slice(start, start + PER);
      const upd = cache.updated ? ('｜ 更新于 ' + D.pretty(D.dateStr(new Date(cache.updated)))) : '';
      note.innerHTML = `来源：人民网 · 新华网 · 中国新闻网 ｜ 每日自动更新（第 ${start + 1}-${start + slice.length} 条 / 共 ${items.length}）${upd}`;
      grid.innerHTML = slice.map((n) => `
        <a class="news-card" href="${UI.esc(n.link)}" target="_blank" rel="noopener">
          <div class="nt">${UI.esc(n.title)}</div>
          <div class="nm"><span class="news-src">${UI.esc(n.source || '新闻')}</span>${n.pubDate ? '<span>' + UI.esc(n.pubDate) + '</span>' : ''}<span style="margin-left:auto">查看原文 ↗</span></div>
        </a>`).join('');
    }

    // 纯前端抓取：无需后端，部署到任意静态托管即可使用
    const FEEDS = [
      { source: '人民网', url: 'http://www.people.com.cn/rss/politics.xml' },
      { source: '新华网', url: 'http://www.xinhuanet.com/politics/news_politics.xml' },
      { source: '中国新闻网', url: 'https://www.chinanews.com.cn/rss/scroll-news.xml' }
    ];
    async function parseXml(xml) {
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const items = Array.from(doc.querySelectorAll('item, entry'));
      return items.slice(0, 20).map((it) => {
        const t = it.querySelector('title');
        const l = it.querySelector('link');
        let link = l ? (l.textContent || l.getAttribute('href') || '').trim() : '';
        const pd = it.querySelector('pubDate, published, updated');
        return {
          title: (t ? t.textContent : '').trim(),
          link, source: '',
          pubDate: (pd ? pd.textContent : '').trim().slice(0, 16)
        };
      }).filter((x) => x.title && x.link && /^https?:\/\//.test(x.link));
    }

    async function fetchFeed(feed) {
      const proxies = [
        // 1) rss2json：返回 JSON（最干净）
        async () => {
          const r = await fetch('https://api.rss2json.com/v1/api.json?count=20&rss_url=' + encodeURIComponent(feed.url));
          const j = await r.json();
          if (j && j.status === 'ok' && Array.isArray(j.items) && j.items.length) {
            return j.items.slice(0, 20).map((it) => ({
              title: (it.title || '').trim(),
              link: (it.link || '').trim(),
              pubDate: (it.pubDate || '').slice(0, 16)
            })).filter((x) => x.title && x.link && /^https?:\/\//.test(x.link));
          }
          return null;
        },
        // 2) allorigins：返回原始 XML
        async () => { const r = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(feed.url)); return parseXml(await r.text()); },
        // 3) codetabs：返回原始 XML（免密钥备用）
        async () => { const r = await fetch('https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(feed.url)); return parseXml(await r.text()); }
      ];
      for (const p of proxies) {
        try {
          const items = await p();
          if (items && items.length) return items.map((x) => ({ ...x, source: feed.source }));
        } catch (e) { /* 尝试下一个代理 */ }
      }
      return [];
    }

    // 同源服务端接口（本地 node server / Vercel / Netlify 函数），直连新闻源最可靠
    async function fetchViaApi() {
      try {
        const r = await fetch('/api/news', { cache: 'no-store' });
        if (!r.ok) return null;
        const d = await r.json();
        if (d && Array.isArray(d.items) && d.items.length) {
          return d.items.map((it) => ({
            title: (it.title || '').trim(),
            link: (it.link || '').trim(),
            source: it.source || '新闻',
            pubDate: (it.pubDate || '').slice(0, 16)
          })).filter((x) => x.title && x.link && /^https?:\/\//.test(x.link));
        }
      } catch (e) { /* 走客户端代理回退 */ }
      return null;
    }

    async function load(force) {
      const hasCache = cache.items && cache.items.length;
      // 缓存是否为当日（或 6 小时内）数据：否 → 视为过期，需要刷新
      const stale = !cache.updated || D.dateStr(new Date(cache.updated)) !== D.today() || (Date.now() - cache.updated) > 6 * 3600 * 1000;

      // 有缓存且未过期且非强制：直接秒显，不联网
      if (hasCache && !force && !stale) {
        render(cache.items, true);
        return;
      }

      // 有缓存但需刷新：先秒显旧内容，再后台拉取今日新新闻
      if (hasCache && !force) {
        render(cache.items, true);
        $('#newsNote', root).textContent = '正在更新今日新闻…';
      } else {
        $('#newsNote', root).textContent = '正在抓取人民网 · 新华网 · 中国新闻网…';
      }

      // 1) 优先同源服务端接口（无需第三方代理，最稳定）
      let items = await fetchViaApi();
      // 2) 否则回退到客户端多代理（适用于纯静态托管）
      if (!items) {
        try {
          const all = await Promise.all(FEEDS.map(fetchFeed));
          const merged = [];
          const max = Math.max(1, ...all.map((a) => a.length));
          for (let i = 0; i < max; i++) all.forEach((a) => { if (a[i]) merged.push(a[i]); });
          items = merged.length ? merged.slice(0, 60) : null;
        } catch (e) { items = null; }
      }

      if (items && items.length) {
        cache = { items: items.slice(0, 60), updated: Date.now() };
        Store.set('news', cache);
        render(cache.items, false);
      } else if (hasCache) {
        // 刷新失败但有过期缓存：明确告知，不再“假装更新成功”
        const when = D.pretty(D.dateStr(new Date(cache.updated)));
        $('#newsNote', root).textContent = '⚠️ 更新失败，仍显示旧内容（' + when + '）';
        if (UI.toast) UI.toast('新闻更新失败，请稍后重试或检查网络');
        render(cache.items, true);
      } else {
        $('#newsGrid', root).innerHTML = '<div class="empty">暂未获取到新闻，请点击「刷新」或检查网络</div>';
        $('#newsNote', root).textContent = '离线 / 未连接';
      }
    }

    $('#newsRotate', root).onclick = () => { offset = (offset + PER) % Math.max(1, (cache.items.length || PER)); news._off = offset; render(cache.items, true); };
    $('#newsRefresh', root).onclick = () => { offset = 0; news._off = 0; load(true); };
    load(false);
  }

  /* ---------------- 6. 我的计划 ---------------- */
  function plans(root) {
    let list = Store.get('plans', []);
    const types = ['日', '周', '月', '长期'];
    const tlabel = { 日: '日计划', 周: '周计划', 月: '月计划', 长期: '长期目标' };
    root.innerHTML = `
      <div class="card">
        <div class="card-title">🗂️ 新建计划</div>
        <label class="fld">计划内容</label><input id="pText" placeholder="要达成的目标 / 安排">
        <div class="row">
          <div><label class="fld">类型</label><select id="pType">${types.map((t) => `<option value="${t}">${tlabel[t]}</option>`).join('')}</select></div>
          <button class="btn" id="pAdd">添加</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📌 我的计划 <span class="sub">${list.length} 项</span></div>
        <div class="list" id="pList">${list.length ? '' : '<div class="empty">还没有计划，添加第一个目标</div>'}</div>
      </div>
    `;
    const ul = $('#pList', root);
    list.forEach((p) => {
      const el = document.createElement('div');
      el.className = 'item' + (p.status === 'done' ? ' done' : '');
      el.innerHTML = `
        <div class="check ${p.status === 'done' ? 'on' : ''}" data-chk="${p.id}">${p.status === 'done' ? '✓' : ''}</div>
        <div class="grow"><div class="title">${UI.esc(p.text)} <span class="badge gray">${tlabel[p.type]}</span></div>
          <div class="meta">${D.pretty(p.createdAt)} 创建</div></div>
        <button class="btn danger sm" data-del="${p.id}">删除</button>`;
      el.querySelector('[data-chk]').onclick = () => { const x = list.find((i) => i.id === p.id); x.status = x.status === 'done' ? 'doing' : 'done'; Store.set('plans', list); plans(root); };
      el.querySelector('[data-del]').onclick = async () => {
        if (await UI.confirm('删除该计划？')) { list = list.filter((i) => i.id !== p.id); Store.set('plans', list); plans(root); }
      };
      ul.appendChild(el);
    });
    $('#pAdd', root).onclick = () => {
      const text = $('#pText', root).value.trim();
      if (!text) { UI.toast('请填写计划内容'); return; }
      list.unshift({ id: uid(), text, type: $('#pType', root).value, status: 'doing', createdAt: D.today() });
      Store.set('plans', list); plans(root);
    };
  }

  /* ---------------- 7. 心情日记 ---------------- */
  function mood(root) {
    const m = Store.get('mood', { days: {} });
    const today = D.today();
    const todayM = m.days[today];
    const moods = [
      { k: '😊', t: '开心' }, { k: '😌', t: '平静' }, { k: '😢', t: '难过' },
      { k: '😡', t: '愤怒' }, { k: '😰', t: '焦虑' }, { k: '😴', t: '疲惫' }, { k: '🤩', t: '兴奋' },
    ];
    root.innerHTML = `
      <div class="card">
        <div class="card-title">💗 今日心情</div>
        <div class="mood-pick" id="moodPick">
          ${moods.map((x) => `<div class="mood-opt ${todayM && todayM.mood === x.k ? 'sel' : ''}" data-m="${x.k}" title="${x.t}">${x.k}</div>`).join('')}
        </div>
        <label class="fld">今天想说点什么？</label>
        <textarea id="moodNote" rows="3" placeholder="记录此刻的心情与事件…">${todayM ? UI.esc(todayM.note || '') : ''}</textarea>
        <button class="btn block" id="moodSave" style="margin-top:8px">保存今日心情</button>
      </div>
      <div class="card">
        <div class="card-title">📔 心情记录 <span class="sub">${Object.keys(m.days).length} 天</span></div>
        <div class="list" id="moodList">
          ${Object.keys(m.days).length ? '' : '<div class="empty">还没有心情记录</div>'}
        </div>
      </div>
    `;
    let picked = todayM ? todayM.mood : '';
    $$('#moodPick .mood-opt', root).forEach((o) => o.onclick = () => {
      picked = o.dataset.m;
      $$('#moodPick .mood-opt', root).forEach((x) => x.classList.remove('sel'));
      o.classList.add('sel');
    });
    $('#moodSave', root).onclick = () => {
      if (!picked) { UI.toast('请先选择一种心情'); return; }
      m.days[today] = { mood: picked, note: $('#moodNote', root).value.trim() };
      Store.set('mood', m); UI.toast('已保存今日心情'); mood(root);
    };
    const ul = $('#moodList', root);
    Object.keys(m.days).sort().reverse().forEach((d) => {
      const x = m.days[d];
      const el = document.createElement('div');
      el.className = 'item';
      el.innerHTML = `<div style="font-size:26px">${x.mood}</div><div class="grow"><div class="title">${D.pretty(d)}</div>${x.note ? '<div class="meta">' + UI.esc(x.note) + '</div>' : ''}</div>`;
      ul.appendChild(el);
    });
  }

  /* ---------------- 8. 每月复盘（树木成长） ---------------- */
  function treeSVG(p) {
    const pr = Math.max(0, Math.min(100, p)) / 100;
    const cx = 100, ground = 210;
    const trunkH = 40 + 30 * pr;
    const rx = 26 + 46 * pr;
    const ry = 24 + 40 * pr;
    const cy = ground - trunkH - ry * 0.55;
    const fruits = pr >= 0.6 ? Math.round(pr * 6) : 0;
    let fr = '';
    for (let i = 0; i < fruits; i++) {
      const a = (i / fruits) * Math.PI * 2;
      const fx = cx + Math.cos(a) * rx * 0.6;
      const fy = cy + Math.sin(a) * ry * 0.6;
      fr += `<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="4" fill="#ef9a9a"/>`;
    }
    return `<svg class="tree-svg" width="200" height="240" viewBox="0 0 200 240">
      <ellipse cx="100" cy="226" rx="70" ry="10" fill="#c8e6c9"/>
      <rect x="${cx - 9}" y="${ground - trunkH}" width="18" height="${trunkH}" rx="6" fill="#8d6e63"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="url(#g${Math.round(pr*10)})"/>
      ${fr}
      <defs><radialGradient id="g${Math.round(pr*10)}" cx="40%" cy="35%">
        <stop offset="0%" stop-color="#a5d6a7"/><stop offset="100%" stop-color="#43a047"/></radialGradient></defs>
    </svg>`;
  }

  function review(root) {
    const all = Store.get('review', {});
    const cur = review._month || D.thisMonth();
    const data = all[cur] || { goals: [], actual: '', note: '' };
    const doneGoals = (data.goals || []).filter((g) => g.done).length;
    const totalGoals = (data.goals || []).length;
    const progress = totalGoals ? Math.round((doneGoals / totalGoals) * 100) : 0;
    const [yy, mm] = cur.split('-');
    const monthName = yy + '年' + parseInt(mm, 10) + '月';

    root.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px">
        <div class="tabs" id="monthNav">
          <button id="prevM">‹ 上月</button>
          <button class="active" style="cursor:default">${monthName}</button>
          <button id="nextM">下月 ›</button>
        </div>
        <span class="news-rotate-note">按自然月独立记录 · 新月份自动生成空白模板</span>
      </div>

      <div class="card">
        <div class="tree-wrap">
          ${treeSVG(progress)}
          <div class="review-box">
            <div class="card-title" style="margin-bottom:8px">🌳 成长进度</div>
            <div class="stat" style="text-align:left;background:var(--primary-soft);padding:12px 16px;margin-bottom:10px">
              <div class="num">${progress}%</div><div class="lbl">本月计划完成度（${doneGoals}/${totalGoals}）</div></div>
            <div class="progress"><span style="width:${progress}%"></span></div>
            <div class="meta" style="margin-top:8px">小树苗会随完成度长大，进度越高枝叶越茂盛 🍃</div>
          </div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">📌 本月计划（目标）<span class="sub">计划</span></div>
          <div class="row">
            <div><input id="gText" placeholder="添加一个本月目标"></div>
            <button class="btn" id="gAdd">＋</button>
          </div>
          <div class="list" id="gList" style="margin-top:10px">
            ${(data.goals || []).length ? '' : '<div class="empty">还没有目标，添加后开始成长</div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-title">✅ 实际完成情况 <span class="sub">实际</span></div>
          <textarea id="actual" rows="5" placeholder="本月实际做了什么？对照计划复盘…">${UI.esc(data.actual || '')}</textarea>
          <label class="fld">反思 / 感悟</label>
          <textarea id="rnote" rows="3" placeholder="收获、不足、下月改进…">${UI.esc(data.note || '')}</textarea>
          <button class="btn ghost sm" id="saveActual" style="margin-top:8px">保存实际与反思</button>
        </div>
      </div>
    `;

    const ul = $('#gList', root);
    (data.goals || []).forEach((g) => {
      const el = document.createElement('div');
      el.className = 'item' + (g.done ? ' done' : '');
      el.innerHTML = `<div class="check ${g.done ? 'on' : ''}" data-c="${g.id}">${g.done ? '✓' : ''}</div>
        <div class="grow"><div class="title">${UI.esc(g.text)}</div></div>
        <button class="btn danger sm" data-d="${g.id}">删</button>`;
      el.querySelector('[data-c]').onclick = () => {
        g.done = !g.done;
        const a = Store.get('review', {}); a[cur] = data; Store.set('review', a); review(root);
      };
      el.querySelector('[data-d]').onclick = async () => {
        if (await UI.confirm('删除该目标？')) {
          data.goals = data.goals.filter((x) => x.id !== g.id);
          const a = Store.get('review', {}); a[cur] = data; Store.set('review', a); review(root);
        }
      };
      ul.appendChild(el);
    });

    $('#prevM', root).onclick = () => { const d = new Date(cur + '-01'); d.setMonth(d.getMonth() - 1); review._month = D.monthStr(d); review(root); };
    $('#nextM', root).onclick = () => { const d = new Date(cur + '-01'); d.setMonth(d.getMonth() + 1); review._month = D.monthStr(d); review(root); };
    $('#gAdd', root).onclick = () => {
      const t = $('#gText', root).value.trim();
      if (!t) { UI.toast('请填写目标'); return; }
      if (!data.goals) data.goals = [];
      data.goals.push({ id: uid(), text: t, done: false });
      const a = Store.get('review', {}); a[cur] = data; Store.set('review', a); review(root);
    };
    $('#saveActual', root).onclick = () => {
      data.actual = $('#actual', root).value; data.note = $('#rnote', root).value;
      const a = Store.get('review', {}); a[cur] = data; Store.set('review', a); UI.toast('已保存');
    };
  }

  window.Sections = { habits, research, exercise, study, news, plans, mood, review };
})();
