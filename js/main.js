// Mobile menu toggle.
const btn = document.querySelector(".menu-btn"), drawer = document.getElementById("drawer");
if (btn && drawer) {
  btn.addEventListener("click", () => {
    const open = drawer.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
    btn.textContent = open ? "Close" : "Menu";
  });
  drawer.addEventListener("click", e => { if (e.target.closest("a")) btn.click(); });
}
