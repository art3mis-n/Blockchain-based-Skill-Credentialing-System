// Scroll button
window.onscroll = function() {
  const btn = document.getElementById("scroll-btn");
  if (!btn) return;
  btn.style.display = (document.body.scrollTop > 60 || document.documentElement.scrollTop > 60) ? "flex" : "none";
};
function topFunction() { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }

// AOS
if (typeof AOS !== "undefined") AOS.init({ duration: 900, easing: "ease-out-cubic", once: true });

// Purecounter
if (typeof PureCounter !== "undefined") new PureCounter();

// Drag and drop on file zones
document.querySelectorAll(".file-drop-zone").forEach(zone => {
  zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.classList.remove("dragover");
    const input = zone.querySelector("input[type=file]");
    if (input && e.dataTransfer.files.length) {
      const dt = new DataTransfer();
      dt.items.add(e.dataTransfer.files[0]);
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
});
