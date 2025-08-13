// lettere.js - Effetto dolce per le lettere
document.addEventListener("DOMContentLoaded", function () {
  const lettere = document.querySelectorAll(".lettera");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1 }
  );

  lettere.forEach((lettera) => {
    lettera.style.opacity = 0;
    lettera.style.transform = "translateY(20px)";
    lettera.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(lettera);
  });
});