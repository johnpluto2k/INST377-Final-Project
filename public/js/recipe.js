// recipe.js - recipe detail page (Spoonacular id from ?id= query param).

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    setStatus("detail-status", "No recipe id in URL.", "error");
    return;
  }

  try {
    const recipe = await window.api.get("/api/recipes/" + encodeURIComponent(id));
    setStatus("detail-status", "", "");
    renderRecipe(recipe);
  } catch (err) {
    console.error(err);
    setStatus("detail-status", "Error: " + err.message, "error");
  }
});

function renderRecipe(r) {
  document.getElementById("detail-body").classList.remove("hidden");
  document.getElementById("ingredients-section").classList.remove("hidden");
  document.getElementById("chart-section").classList.remove("hidden");
  document.getElementById("instructions-section").classList.remove("hidden");

  document.getElementById("detail-title").textContent = r.title || "Untitled";
  document.getElementById("detail-image").src = r.image || "";
  document.getElementById("detail-image").alt = r.title || "";
  document.getElementById("detail-ready").textContent = r.readyInMinutes ?? "--";
  document.getElementById("detail-servings").textContent = r.servings ?? "--";
  document.title = "Pantry Plate - " + (r.title || "Recipe");

  // Dietary tags
  const tagRow = document.getElementById("detail-tags");
  tagRow.innerHTML = "";
  const flags = [
    ["Vegetarian", r.vegetarian],
    ["Vegan", r.vegan],
    ["Gluten-Free", r.glutenFree],
    ["Dairy-Free", r.dairyFree],
    ["Healthy", r.veryHealthy],
    ["Cheap", r.cheap],
  ];
  for (const [name, on] of flags) {
    if (!on) continue;
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = name;
    tagRow.appendChild(span);
  }
  if (!tagRow.children.length) {
    tagRow.innerHTML = '<span class="muted">No dietary tags.</span>';
  }

  // Ingredients
  const list = document.getElementById("ingredient-list");
  list.innerHTML = "";
  const pantrySet = new Set(window.pantry.get());
  let owned = 0;
  const ingredients = r.extendedIngredients || [];
  for (const ing of ingredients) {
    const li = document.createElement("li");
    const nameNorm = (ing.name || "").toLowerCase();
    const inPantry = [...pantrySet].some((p) => nameNorm.includes(p));
    if (inPantry) owned++;
    li.textContent = ing.original || `${ing.amount || ""} ${ing.unit || ""} ${ing.name || ""}`;
    if (inPantry) li.style.color = "var(--good)";
    list.appendChild(li);
  }

  // Coverage chart (Chart.js)
  const total = ingredients.length || 1;
  const missing = Math.max(0, total - owned);
  if (window.Chart) {
    const ctx = document.getElementById("coverage-chart");
    new window.Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["In your pantry", "Need to buy"],
        datasets: [
          {
            data: [owned, missing],
            backgroundColor: ["#a6e3a1", "#f38ba8"],
            borderColor: "#1e1e2e",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#cdd6f4" } },
          tooltip: { enabled: true },
        },
      },
    });
  }

  // Instructions - prefer analyzed steps, fall back to plain instructions
  const ol = document.getElementById("instruction-list");
  ol.innerHTML = "";
  const steps =
    (r.analyzedInstructions &&
      r.analyzedInstructions[0] &&
      r.analyzedInstructions[0].steps) ||
    [];
  if (steps.length) {
    for (const s of steps) {
      const li = document.createElement("li");
      li.textContent = s.step;
      ol.appendChild(li);
    }
  } else if (r.instructions) {
    const p = document.createElement("li");
    p.innerHTML = r.instructions;
    ol.appendChild(p);
  } else {
    ol.innerHTML = '<li class="muted">No instructions provided.</li>';
  }

  // Save-favorite handler
  document.getElementById("save-favorite-btn").addEventListener("click", async () => {
    try {
      setStatus("save-status", "Saving...", "");
      await window.api.post("/api/favorites", {
        recipe_id: r.id,
        title: r.title,
        image: r.image,
        missed_count: missing,
      });
      setStatus("save-status", "Saved!", "success");
    } catch (err) {
      setStatus("save-status", "Error: " + err.message, "error");
    }
  });
}
