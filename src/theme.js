const THEME_STORAGE_KEY = "theme-mode";

const systemThemeMql = window.matchMedia("(prefers-color-scheme: dark)");

function getSystemTheme() {
  return systemThemeMql.matches ? "dark" : "light";
}

function getStoredThemeMode() {
  const v = localStorage.getItem(THEME_STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

function setStoredThemeMode(mode) {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}

function getEffectiveTheme(mode) {
  return mode === "system" ? getSystemTheme() : mode;
}

function applyThemeMode(mode) {
  const theme = getEffectiveTheme(mode);

  document.documentElement.setAttribute("data-theme", theme);

  updateThemeToggleLabel(mode);
}

const themeToggleBtn = document.getElementById("themeToggle");

function updateThemeToggleLabel(mode) {
  if (!themeToggleBtn) return;

  const effective = getEffectiveTheme(mode);

  if (mode === "system") {
    themeToggleBtn.textContent =
      effective === "dark" ? "Modo Claro (Auto)" : "Modo Escuro (Auto)";
  } else {
    themeToggleBtn.textContent =
      effective === "dark" ? "Modo Claro" : "Modo Escuro";
  }
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", (event) => {
    const currentMode = getStoredThemeMode();

    if (event.shiftKey) {
      setStoredThemeMode("system");
      applyThemeMode("system");
      return;
    }

    const effective = getEffectiveTheme(currentMode);
    const nextMode = effective === "dark" ? "light" : "dark";

    setStoredThemeMode(nextMode);
    applyThemeMode(nextMode);
  });
}

systemThemeMql.addEventListener("change", () => {
  if (getStoredThemeMode() === "system") applyThemeMode("system");
});

applyThemeMode(getStoredThemeMode());
