// favorites.js - loads saved recipes from the backend (which reads Supabase).

document.addEventListener("DOMContentLoaded", loadFavorites);

async function loadFavorites() {
  try {
    const rows = await window.api.get("/api/favorites");
    if (!Array.isArray(rows) || rows.length === 0) {
      setStatus(
        "favorites-status",
        "You have not saved any recipes yet. Find one on the Home page and click Save to Favorites.",
        ""
      );
      document.getElementById("favorites-grid").innerHTML = "";
      return;
    }
    setStatus("favorites-status", rows.length + " saved recipes.", "success");
    renderFavorites(rows);
  } catch (err) {
    console.error(err);
    setStatus("favorites-status", "Error: " + err.message, "error");
  }
}

function renderFavorites(rows) {
  const grid = document.getElementById("favorites-grid");
  grid.innerHTML = "";
  for (const f of rows) {
    const card = document.createElement("div");
    card.className = "recipe-card";
    let badgeHtml = "";
    if (f.missed_count != null) {
      const cls = f.missed_count <= 2 ? "good" : "bad";
      badgeHtml =
        '<span class="badge ' + cls + '">' + f.missed_count + " to buy</span>";
    }
    card.innerHTML =
      '<div class="img-wrap"><img src="' + (f.image || "") + '" alt="' + escapeHtml(f.title) + '" /></div>' +
      '<div class="body">' +
      '<div class="title">' + escapeHtml(f.title) + "</div>" +
      '<div class="meta">' + badgeHtml + "</div>" +
      '<div class="row" style="margin-top:6px;">' +
      '<button class="custom-btn" data-open="' + f.recipe_id + '">Open</button>' +
      '<button class="btn-danger" data-remove="' + f.id + '">Remove</button>' +
      "</div></div>";
    grid.appendChild(card);
  }
  grid.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = "recipe.html?id=" + btn.getAttribute("data-open");
    });
  });
  grid.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-remove");
      try {
        await window.api.del("/api/favorites/" + encodeURIComponent(id));
        await loadFavorites();
      } catch (err) {
        setStatus("favorites-status", "Error: " + err.message, "error");
      }
    });
  });
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
