// cookieManager.js
// Gestione cookie personalizzati con JSON

// Crea un cookie (nome, oggetto, durata in ore)
function setCookie(name, dataObj, hours = 100) {
  const jsonData = encodeURIComponent(JSON.stringify(dataObj));
  const maxAge = hours * 3600;
  document.cookie = `${name}=${jsonData}; path=/; max-age=${maxAge}`;
  console.log(`✅ Cookie "${name}" creato per ${hours} ora/e`);
}

// Legge e decodifica tutti i cookie in un oggetto JS
function getCookies() {
  return document.cookie.split("; ").reduce((acc, current) => {
    const [name, value] = current.split("=");
    try {
      acc[name] = JSON.parse(decodeURIComponent(value));
    } catch {
      acc[name] = decodeURIComponent(value);
    }
    return acc;
  }, {});
}

// Legge un cookie specifico
function getCookie(name) {
  const cookies = getCookies();
  return cookies[name] || null;
}

// Esempio d'uso automatico
window.addEventListener("DOMContentLoaded", () => {
  // Crea un cookie di esempio
  setCookie("myData", {
    username: "Fra",
    theme: "dark",
    visit: new Date().toISOString()
  }, 1); // dura 1 ora

  // Leggi tutti i cookie e mostrali in console
  console.log("🍪 Tutti i cookie:", getCookies());
});
