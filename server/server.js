require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require('dotenv').config();


const app = express();
const port = process.env.PORT || 8000;

app.use(bodyParser.json());

app.use(express.static('public'));

app.use(
  cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


const userRoutes = require("./routes/usersRotes");
const users_providersRoutes = require("./routes/users_providersRoutes");
const refresh_tokensRoutes = require("./routes/refresh_tokensRoutes");
const postsRoutes = require("./routes/postsRoutes");
const password_resetsRoutes = require("./routes/password_resetsRoutes");
const moderation_logsRoutes = require("./routes/moderation_logsRoutes");
const commentsRoutes = require("./routes/commentsRoutes");
const otpRoutes = require("./routes/otpRoutes");
const authRotes = require("./routes/authRoutes");
const oauthRoutes = require("./routes/oauthRoutes")

app.use("/users", userRoutes);
app.use("/users_providers", users_providersRoutes);
app.use("/retoken", refresh_tokensRoutes);
app.use("/post", postsRoutes );
app.use("/password_reset", password_resetsRoutes);
app.use("/moderation_log", moderation_logsRoutes);
app.use("/comments", commentsRoutes);
app.use("/otp", otpRoutes);
app.use("/auth", authRotes);
app.use("/oauth", oauthRoutes);

app.get("/", (req, res) => {
  res.send("test");
});

app.get("/", (req, res) => res.send("API is running"));

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
