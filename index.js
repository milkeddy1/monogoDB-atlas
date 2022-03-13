const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const authRoute = require("./routes/auth-route");
const profileRoute = require("./routes/profile-route");
require("./config/passport");
// const cookieSession = require("cookie-session");
const passport = require("passport");
const session = require("express-session");
const flash = require("connect-flash");
const User = require("./models/user-model");

// 連接到monogodb atlas
mongoose
  .connect(process.env.DB_CONNECT)
  .then(() => {
    console.log("Connect to mongoDB atlas.");
  })
  .catch(() => {
    console.log("Failed to connect to mongoDB atlas");
  });

// 連接到monogodb atlas=================================

//   middleware
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 儲存cookie
// app.use(
//   cookieSession({
//     keys: [process.env.SECRET],
//   })
// );
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  // 在res.locals設定一個sucess_msg物件
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// /auth的route middleware
app.use("/auth", authRoute);

// /profile的route middleware
app.use("/profile", profileRoute);

//middleware =================================

// routes
app.get("/", (req, res) => {
  res.render("index", { user: req.user });
  console.log(User.find({}));
});

// routes=================================

app.listen(3000, () => {
  console.log("Server running in 3000");
});
