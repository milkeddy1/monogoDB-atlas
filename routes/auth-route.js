const router = require("express").Router();
const passport = require("passport");
const bcrypt = require("bcrypt");
const User = require("../models/user-model");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const mongoose = require("mongoose");

const DB_URL =
  "mongodb+srv://milkeddy:milkeddy@cluster0.8bqcv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
// 連接db
const conn = mongoose.createConnection(DB_URL);

let gfs;
let gridfsBucket;
conn.once("open", () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads",
  });
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

const storage = new GridFsStorage({
  url: DB_URL,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = "file_" + Date.now();
      const fileInfo = {
        filename: filename,
        bucketName: "uploads",
      };
      resolve(fileInfo);
    });
  },
});

const upload = multer({
  storage: storage,
});

// google auth =======================
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

// google auth =======================

router.get("/signup", (req, res) => {
  res.render("signup", { user: req.user });
});

// 登入頁面
router.get("/login", (req, res) => {
  res.render("login", { user: req.user });
  console.log(req.user);
});

// 登入驗證
router.post(
  "/login",
  //這邊指的local就是針對localStrategy去認證
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

// 註冊驗證
router.post("/signup", upload.single("avatar"), async (req, res) => {
  console.log(req.file, "req file");
  console.log(req.body);
  let { name, email, password } = req.body;
  // 檢查有沒有重複的username
  const emailExist = await User.findOne({ email });
  if (emailExist) {
    req.flash("error_msg", "Email has already been used");
    res.redirect("/auth/signup");
  }

  let hash = await bcrypt.hash(password, 10);
  password = hash;
  let nweUser = new User({ name, email, password, avatar: req.file.filename });
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

// logout -> 沒有logout頁面，而是直接導向首頁
router.get("/logout", (req, res) => {
  req.logOut();
  res.redirect("/");
});

//  圖片url
router.get("/image/:filename", async (req, res) => {
  let image = await gfs.files.findOne({ filename: req.params.filename });
  let readStream = gridfsBucket.openDownloadStream(image._id);
  readStream.pipe(res);
  // res.redirect("/");
});

module.exports = router;
