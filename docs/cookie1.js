(function() {
  function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + "=" + value + "; expires=" + expires + "; path=/; SameSite=Lax; Secure";
  }

  let userId = getCookie("user_id");
  if (!userId) {
    userId = crypto.randomUUID(); // genera UUID univoco
    setCookie("user_id", userId, 365); // cookie valido 1 anno
    console.log("Nuovo user_id cookie creato:", userId);
  } else {
    console.log("User_id cookie trovato:", userId);
  }
})();
