let swiperInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("add-ingredient-btn")
    .addEventListener("click", onAddIngredient);

  document
    .getElementById("ingredient-input")
    .addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onAddIngredient();
      }
    });

  document
    .getElementById("find-recipes-btn")
    .addEventListener("click", onFindRecipes);

  document
    .getElementById("clear-pantry-btn")
    .addEventListener("click", () => {
      window.pantry.clear();
      renderPantry();
      setStatus("home-status", "Pantry cleared.", "");
    });

  renderPantry();
});

function onAddIngredient() {
  const input = document.getElementById("ingredient-input");
  const added = window.pantry.add(input.value);
  input.value = "";
  input.focus();
  renderPantry();
  if (!added) {
    setStatus("home-status", "Already in your pantry.", "");
  } else {
    setStatus("home-status", "", "");
  }
}

function renderPantry() {
  const container = document.getElementById("pantry-chips");
  const items = window.pantry.get();
  container.innerHTML = "";
  if (items.length === 0) {
    container.innerHTML =
      '<span class="muted">Your pantry is empty. Add ingredients above.</span>';
    return;
  }
  for (const item of items) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = item;
    const close = document.createElement("button");
    close.setAttribute("aria-label", "Remove " + item);
    close.textContent = "x";
    close.addEventListener("click", () => {
      window.pantry.remove(item);
      renderPantry();
    });
    chip.appendChild(close);
    container.appendChild(chip);
  }
}

async function onFindRecipes() {
  const items = window.pantry.get();
  if (items.length === 0) {
    setStatus("home-status", "Add at least one ingredient first.", "error");
    return;
  }
  setStatus("home-status", "Searching recipes...", "");

  try {
    const url =
      "/api/recipes?ingredients=" + encodeURIComponent(items.join(","));
    const recipes = await window.api.get(url);
    if (!Array.isArray(recipes) || recipes.length === 0) {
      setStatus(
        "home-status",
        "No matching recipes. Try broader ingredient names.",
        "error"
      );
      renderFeatured([]);
      renderGrid([]);
      return;
    }
    setStatus("home-status", "Found " + recipes.length + " recipes.", "success");
    renderFeatured(recipes.slice(0, 5));
    renderGrid(recipes);
  } catch (err) {
    console.error(err);
    setStatus("home-status", "Error: " + err.message, "error");
  }
}

function renderFeatured(top5) {
  const wrapper = document.querySelector("#featured-swiper .swiper-wrapper");
  wrapper.innerHTML = "";
  for (const r of top5) {
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    const used = r.usedIngredientCount || 0;
    const missed = r.missedIngredientCount || 0;
    slide.innerHTML =
      '<img src="' + r.image + '" alt="' + escapeHtml(r.title) + '" />' +
      '<div class="cap"><strong>' + escapeHtml(r.title) + "</strong>" +
      '<span class="muted">' + used + " of yours - " + missed + " to buy</span></div>";
    slide.addEventListener("click", () => {
      window.location.href = "recipe.html?id=" + r.id;
    });
    wrapper.appendChild(slide);
  }
  if (swiperInstance) {
    swiperInstance.destroy(true, true);
    swiperInstance = null;
  }
  if (top5.length > 0 && window.Swiper) {
    swiperInstance = new window.Swiper("#featured-swiper", {
      slidesPerView: 1,
      spaceBetween: 12,
      loop: top5.length > 2,
      pagination: { el: ".swiper-pagination", clickable: true },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        640: { slidesPerView: 2 },
        900: { slidesPerView: 3 },
      },
    });
  }
}

function renderGrid(recipes) {
  const grid = document.getElementById("recipe-grid");
  grid.innerHTML = "";
  for (const r of recipes) {
    const card = document.createElement("div");
    card.className = "recipe-card";
    const used = r.usedIngredientCount || 0;
    const missed = r.missedIngredientCount || 0;
    const badgeCls = missed <= 2 ? "good" : "bad";
    const badgeText = missed === 0 ? "All in pantry" : missed + " to buy";
    card.innerHTML =
      '<div class="img-wrap"><img src="' + r.image + '" alt="' + escapeHtml(r.title) + '" /></div>' +
      '<div class="body">' +
      '<div class="title">' + escapeHtml(r.title) + "</div>" +
      '<div class="meta">Uses ' + used + " of your ingredients</div>" +
      '<div class="meta"><span class="badge ' + badgeCls + '">' + badgeText + "</span></div>" +
      "</div>";
    card.addEventListener("click", () => {
      window.location.href = "recipe.html?id=" + r.id;
    });
    grid.appendChild(card);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
