const header = document.querySelector(".site-header");

window.addEventListener("scroll", () => {
  const elevated = window.scrollY > 12;
  header.style.boxShadow = elevated ? "0 8px 30px rgba(33, 72, 76, 0.08)" : "none";
});

document.querySelectorAll(".clickable-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;

    const href = card.dataset.href;
    if (href) window.open(href, "_blank", "noopener");
  });
});
