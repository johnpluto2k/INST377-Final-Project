// api/index.js
// Express app that runs as a single Vercel serverless function.
// Three authored endpoints:
//   GET  /api/recipes        -> proxies Spoonacular (external data)
//   GET  /api/favorites      -> reads saved recipes from Supabase
//   POST /api/favorites      -> writes a saved recipe to Supabase
//
// A fourth helper endpoint (GET /api/recipes/:id) proxies the Spoonacular
// recipe-detail call so the Recipe Detail page can run through the backend.

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Supabase client ----------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function requireSupabase(res) {
  if (!supabase) {
    res.status(500).json({
      error:
        "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    });
    return false;
  }
  return true;
}

// ---------- Health check ----------
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    spoonacular: Boolean(process.env.SPOONACULAR_API_KEY),
    supabase: Boolean(supabase),
    time: new Date().toISOString(),
  });
});

// ---------- 1) External provider: Spoonacular findByIngredients ----------
// GET /api/recipes?ingredients=tomato,rice,cheese&number=12
app.get("/api/recipes", async (req, res) => {
  try {
    const key = process.env.SPOONACULAR_API_KEY;
    if (!key) {
      return res
        .status(500)
        .json({ error: "SPOONACULAR_API_KEY is not set." });
    }

    const ingredients = (req.query.ingredients || "").trim();
    const number = Number(req.query.number) || 12;
    if (!ingredients) {
      return res
        .status(400)
        .json({ error: "Query param 'ingredients' is required." });
    }

    const url =
      "https://api.spoonacular.com/recipes/findByIngredients" +
      `?ingredients=${encodeURIComponent(ingredients)}` +
      `&number=${number}` +
      `&ranking=2&ignorePantry=true&apiKey=${key}`;

    const upstream = await fetch(url);
    if (!upstream.ok) {
      const text = await upstream.text();
      return res
        .status(upstream.status)
        .json({ error: "Spoonacular error", detail: text });
    }
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Spoonacular recipe detail (used by recipe.html)
// GET /api/recipes/:id
app.get("/api/recipes/:id", async (req, res) => {
  try {
    const key = process.env.SPOONACULAR_API_KEY;
    if (!key) {
      return res
        .status(500)
        .json({ error: "SPOONACULAR_API_KEY is not set." });
    }
    const id = req.params.id;
    const url =
      `https://api.spoonacular.com/recipes/${encodeURIComponent(id)}/information` +
      `?includeNutrition=false&apiKey=${key}`;

    const upstream = await fetch(url);
    if (!upstream.ok) {
      const text = await upstream.text();
      return res
        .status(upstream.status)
        .json({ error: "Spoonacular error", detail: text });
    }
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- 2) Read from DB: GET /api/favorites ----------
app.get("/api/favorites", async (req, res) => {
  if (!requireSupabase(res)) return;
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// ---------- 3) Write to DB: POST /api/favorites ----------
// Body: { recipe_id, title, image, missed_count }
app.post("/api/favorites", async (req, res) => {
  if (!requireSupabase(res)) return;
  const { recipe_id, title, image, missed_count } = req.body || {};
  if (!recipe_id || !title) {
    return res
      .status(400)
      .json({ error: "recipe_id and title are required." });
  }
  const { data, error } = await supabase
    .from("favorites")
    .insert([
      {
        recipe_id: String(recipe_id),
        title,
        image: image || null,
        missed_count: missed_count ?? null,
      },
    ])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Bonus: remove a favorite (handy on the Favorites page)
app.delete("/api/favorites/:id", async (req, res) => {
  if (!requireSupabase(res)) return;
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

module.exports = app;
