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

// Photo viewer for the portfolio galleries. Clicking a photo enlarges it; the arrows, arrow keys
// or a swipe move through that shoot's photos, and Esc, the close button or a click on the dark
// background closes it. Without JavaScript the gallery links simply open the large photo.
const galleries = document.querySelectorAll(".gallery");
if (galleries.length && window.HTMLDialogElement) {
  const chevron = d => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="${d}"/></svg>`;
  const viewer = document.createElement("dialog");
  viewer.className = "viewer";
  viewer.setAttribute("aria-label", "Photo viewer");
  viewer.innerHTML = `
    <div class="bar"><span class="count" aria-live="polite"></span>
      <button class="close" type="button" aria-label="Close viewer">${chevron("M5 5l14 14M19 5L5 19")}</button></div>
    <div class="stage">
      <button class="nav prev" type="button" aria-label="Previous photo">${chevron("M15 5l-7 7 7 7")}</button>
      <img alt="">
      <button class="nav next" type="button" aria-label="Next photo">${chevron("M9 5l7 7-7 7")}</button>
    </div>`;
  document.body.append(viewer);

  const stage = viewer.querySelector(".stage"), img = stage.querySelector("img"), count = viewer.querySelector(".count");
  let links = [], index = 0, title = "", opener = null;

  const preload = i => { new Image().src = links[(i + links.length) % links.length].href; };
  const show = i => {
    index = (i + links.length) % links.length;
    const link = links[index];
    if (img.src !== link.href) {
      img.classList.add("loading");
      img.onload = () => img.classList.remove("loading");
      img.src = link.href;
      if (img.complete) img.classList.remove("loading");
    }
    img.alt = link.querySelector("img").alt;
    count.textContent = `${title}  ·  ${index + 1} / ${links.length}`;
    preload(index + 1);
    preload(index - 1);
  };

  galleries.forEach(gallery => {
    const items = [...gallery.querySelectorAll("a")];
    const name = gallery.closest(".project")?.querySelector("h2")?.textContent || "";
    items.forEach((link, i) => link.addEventListener("click", e => {
      e.preventDefault();
      links = items; title = name; opener = link;
      show(i);
      viewer.showModal();
      document.documentElement.style.overflow = "hidden";
    }));
  });

  viewer.querySelector(".prev").addEventListener("click", () => show(index - 1));
  viewer.querySelector(".next").addEventListener("click", () => show(index + 1));
  viewer.querySelector(".close").addEventListener("click", () => viewer.close());
  viewer.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
  });
  viewer.addEventListener("close", () => {
    document.documentElement.style.overflow = "";
    opener?.focus({ preventScroll: true });
  });

  // Swipe on touch screens; a tap on the dark area around the photo closes the viewer.
  let startX = null, swiped = false;
  stage.addEventListener("pointerdown", e => { startX = e.clientX; swiped = false; });
  stage.addEventListener("pointerup", e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (e.pointerType !== "mouse" && Math.abs(dx) > 40) { swiped = true; show(index + (dx < 0 ? 1 : -1)); }
  });
  viewer.addEventListener("click", e => {
    if (swiped) { swiped = false; return; }
    if (e.target === viewer || e.target === stage) viewer.close();
  });
}
