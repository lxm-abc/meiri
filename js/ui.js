/* ============ UI 辅助函数 ============ */
(function () {
  const UI = {};

  UI.esc = function (s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  let toastTimer = null;
  UI.toast = function (msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
  };

  // 确认对话框，返回 Promise<boolean>
  UI.confirm = function (msg, okText) {
    return new Promise((resolve) => {
      const root = document.getElementById('modalRoot');
      root.innerHTML =
        '<div class="modal-mask"><div class="modal"><p style="margin:6px 0 18px">' + UI.esc(msg) + '</p>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end">' +
        '<button class="btn ghost" data-act="cancel">取消</button>' +
        '<button class="btn danger" data-act="ok">' + UI.esc(okText || '确定') + '</button></div></div></div>';
      const close = (v) => { root.innerHTML = ''; resolve(v); };
      root.querySelector('[data-act="ok"]').onclick = () => close(true);
      root.querySelector('[data-act="cancel"]').onclick = () => close(false);
    });
  };

  // 通用模态框：传入 title 与 html 内容，回调里可访问容器
  UI.modal = function (title, bodyHtml, onMount) {
    const root = document.getElementById('modalRoot');
    root.innerHTML =
      '<div class="modal-mask"><div class="modal"><h3>' + UI.esc(title) + '</h3>' + bodyHtml + '</div></div>';
    const mask = root.querySelector('.modal-mask');
    mask.addEventListener('click', (e) => { if (e.target === mask) root.innerHTML = ''; });
    if (onMount) onMount(root.querySelector('.modal'));
    return {
      close() { root.innerHTML = ''; },
    };
  };

  window.UI = UI;
})();
