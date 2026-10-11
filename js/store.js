/* ============ 数据存储层 ============ */
(function () {
  const PREFIX = 'meiri.';

  const Store = {
    get(key, def) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw == null) return def !== undefined ? def : null;
        return JSON.parse(raw);
      } catch (e) {
        return def !== undefined ? def : null;
      }
    },
    set(key, val) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) {}
    },
    remove(key) { localStorage.removeItem(PREFIX + key); },

    // 当前数据快照（用于导出备份）
    exportAll() {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) out[k.slice(PREFIX.length)] = Store.get(k.slice(PREFIX.length));
      }
      return out;
    },
  };

  // 日期工具
  const D = {
    pad(n) { return n < 10 ? '0' + n : '' + n; },
    // YYYY-MM-DD
    dateStr(d) {
      d = d || new Date();
      return d.getFullYear() + '-' + D.pad(d.getMonth() + 1) + '-' + D.pad(d.getDate());
    },
    today() { return D.dateStr(new Date()); },
    // YYYY-MM
    monthStr(d) {
      d = d || new Date();
      return d.getFullYear() + '-' + D.pad(d.getMonth() + 1);
    },
    thisMonth() { return D.monthStr(new Date()); },
    // 友好显示
    pretty(s) {
      if (!s) return '';
      const t = s.replace(/-/g, '/');
      const d = new Date(t);
      if (isNaN(d)) return s;
      const wd = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
      return (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + wd;
    },
    // 星期几索引 0=周日
    weekday(s) {
      const d = new Date(s.replace(/-/g, '/'));
      return d.getDay();
    },
    // 偏移天数，返回 YYYY-MM-DD
    addDays(s, n) {
      const d = new Date(s.replace(/-/g, '/'));
      d.setDate(d.getDate() + n);
      return D.dateStr(d);
    },
    // 某天所在自然周的周一日期
    mondayOf(s) {
      const d = new Date(s.replace(/-/g, '/'));
      const wd = d.getDay(); // 0=周日
      const off = wd === 0 ? -6 : 1 - wd;
      d.setDate(d.getDate() + off);
      return D.dateStr(d);
    },
    // 是否已过截止
    isOverdue(s) {
      if (!s) return false;
      return s < D.today();
    },
  };

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  window.Store = Store;
  window.D = D;
  window.uid = uid;
})();
