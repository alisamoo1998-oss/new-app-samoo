// --- الوضع الليلي / النهاري ---
const THEME_KEY = "samoo_theme";

function applyTheme(theme) {
    if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }
    const icon = document.getElementById("themeIcon");
    if (icon) {
        icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
    }
}

const savedTheme = localStorage.getItem(THEME_KEY) || "light";
applyTheme(savedTheme);

window.toggleTheme = () => {
    const current = localStorage.getItem(THEME_KEY) || "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
};
