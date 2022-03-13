const router = require("express").Router();
const passport = require("passport");
const bcrypt = require("bcrypt");
const User = require("../models/user-model");

router.get("/login", (req, res) => {
  res.render("login", { user: req.user });
});

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get("/google/redirect", passport.authenticate("google"), (req, res) => {
  // 登入後引導到原本想要的route
  if (req.session.returnTo) {
    let newPath = req.session.returnTo;
    req.session.returnTo = "";
    res.redirect(newPath);
  } else {
    res.redirect("/profile");
  }
});

router.get("/logout", (req, res) => {
  req.logOut();
  res.redirect("/");
});

router.get("/signup", (req, res) => {
  res.render("signup", { user: req.user });
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/auth/login",
    failureFlash: "Wrong email or password",
  }),
  (req, res) => {
    // 登入後引導到原本想要的route
    if (req.session.returnTo) {
      let newPath = req.session.returnTo;
      req.session.returnTo = "";
      res.redirect(newPath);
    } else {
      res.redirect("/profile");
    }
  }
);

router.post("/signup", async (req, res) => {
  let { name, email, password } = req.body;
  // 檢查有沒有重複的username
  const emailExist = await User.findOne({ email });
  if (emailExist) {
    req.flash("error_msg", "Email has already been used");
    res.redirect("/auth/signup");
  }

  const hash = await bcrypt.hash(password, 10);
  password = hash;
  let nweUser = new User({ name, email, password });
  try {
    await nweUser.save();
    console.log("registered");
    req.flash("success_msg", "Registration succeeds");
    res.redirect("/auth/login");
  } catch (err) {
    req.flash("error_msg", err._message);
    res.redirect("/auth/signup");
  }
});
module.exports = router;
