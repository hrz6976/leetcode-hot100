// 在首屏绘制前应用系统主题，并同步已加载的代码编辑器。
(() => {
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  function apply() {
    const theme = preference.matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.monaco?.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
  }
  apply();
  preference.addEventListener('change', apply);
})();
