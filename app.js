const express = require('express');
const {handleChat} = require('./fungsi/gemini.js')
const app = express()
const port = process.env.PORT || 3000
const failed = "https://nue-api.vercel.app/error"
const succes = "https://nue-api.vercel.app/succes?re=";
const base = "https://nue-api.vercel.app";

app.get('/lgpt', (req, res) => {
  if (!req.query.systemPrompt) return res.status(400).json({ error: "System Prompt is required" });
  handleChat(req, res, null);
});

app.get('/', (req, res) => {
  res.redirect(base+"/dashboard")
})

app.listen(port, () => {
  console.log(`App is listening on port ${port}`)
})
