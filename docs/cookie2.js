
(function() {
  // Funzione per impostare un cookie
  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/; SameSite=Lax; Secure";
  }

  // Funzione per leggere un cookie
  function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
  }

  // Verifica se i cookie sono abilitati
  if (!navigator.cookieEnabled) {
    console.warn("I cookie sono disabilitati nel browser.");
    return;
  }

  // Genera o recupera user_id univoco
  let userId = getCookie("user_id");
  if (!userId) {
    userId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substr(2, 16);
    setCookie("user_id", userId, 365);
    console.log("Nuovo user_id creato:", userId);
  } else {
    console.log("User_id trovato:", userId);
  }

  // Raccogli informazioni sul dispositivo
  const deviceInfo = {
    userId: userId,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezoneOffset: new Date().getTimezoneOffset(),
    lastVisit: new Date().toISOString()
  };

  // Salva le info in un cookie
  setCookie("device_info", JSON.stringify(deviceInfo), 365); // valido 365 giorni
  console.log("Cookie device_info impostato:", deviceInfo);
})();
