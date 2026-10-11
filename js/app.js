/* ============ 应用主控：路由 / 导航 / 安装 / SW ============ */
(function () {
  const routes = {
    habits: { title: '习惯养成', fn: () => Sections.habits(content) },
    research: { title: '科研', fn: () => Sections.research(content) },
    exercise: { title: '运动', fn: () => Sections.exercise(content) },
    study: { title: '学习', fn: () => Sections.study(content) },
    news: { title: '新闻热点', fn: () => Sections.news(content) },
    plans: { title: '我的计划', fn: () => Sections.plans(content) },
    mood: { title: '心情日记', fn: () => Sections.mood(content) },
    review: { title: '每月复盘', fn: () => Sections.review(content) },
  };

  const content = document.getElementById('content');
  const navItems = Array.from(document.querySelectorAll('.nav-item'));
  const pageTitle = document.getElementById('pageTitle');
  const pageDate = document.getElementById('pageDate');

  function render(route) {
    const r = routes[route] || routes.habits;
    pageTitle.textContent = r.title;
    pageDate.textContent = D.pretty(D.today());
    navItems.forEach((b) => b.classList.toggle('active', b.dataset.route === route));
    content.scrollTop = 0;
    r.fn();
    try { location.hash = route; } catch (e) {}
  }

  navItems.forEach((b) => b.addEventListener('click', () => render(b.dataset.route)));

  // 初始路由（支持 #hash 直达）
  const init = (location.hash || '#habits').replace('#', '');
  render(routes[init] ? init : 'habits');

  // 安装到桌面（安卓 / 桌面 PWA）
  let deferredPrompt = null;
  const installBtn = document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) { UI.toast('请使用浏览器菜单「添加到主屏幕」'); return; }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { installBtn.hidden = true; UI.toast('已安装到桌面 🎉'); });

  // 注册 Service Worker（用于离线启动与稳定添加到桌面）
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
