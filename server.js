// server.js
// Local development entrypoint. Vercel ignores this file -- it uses api/index.js directly.
// Run with: npm start  (then open http://localhost:3000)

const path = require("path");
const express = require("express");
const app = require("./api/index.js");

// Serve the same static files Vercel serves from /public
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Recipe app running on http://localhost:${port}`);
});
