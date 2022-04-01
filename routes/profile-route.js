const router = require("express").Router();
const Post = require("../models/post-model");

const authCheck = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    res.redirect("auth/login");
  } else {
    next();
  }
};

router.get("/", authCheck, async (req, res) => {
  // user已從passport.authenticate拿到
  // posts要從DB拿到所以要使用find
  let postFound = await Post.find({ author: req.user.name });
  res.render("profile", { user: req.user, posts: postFound });
});

router.get("/post", authCheck, (req, res) => {
  res.render("post", { user: req.user });
});

router.post("/post", authCheck, async (req, res) => {
  let { title, content } = req.body;
  let newPost = new Post({
    title,
    content,
    author: req.user.name,
  });

  try {
    await newPost.save();
    res.status(200).redirect("/profile");
  } catch (err) {
    req.flash("error_msg", "Please fill in both content and title");
    res.redirect("/profile/post");
  }
});

module.exports = router;
