const express = require("express");
const app = express();
const mongoose = require("mongoose");
const url = require("url");
const PORT = process.env.PORT || 5000;
// 取得.env檔案
const dotenv = require("dotenv");
dotenv.config();

// 引入router程式碼
const authRoute = require("./routes/auth-route");
const profileRoute = require("./routes/profile-route");

//
require("./config/passport");
// const cookieSession = require("cookie-session");
const passport = require("passport");
const session = require("express-session");
const flash = require("connect-flash");
const User = require("./models/user-model");
const Post = require("./models/post-model");
const { redirect } = require("express/lib/response");
const { send } = require("process");

// 連接到monogodb atlas ===============================
mongoose
  .connect(process.env.DB_CONNECT)
  .then(() => {
    console.log("Connect to mongoDB atlas.");
  })
  .catch(() => {
    console.log("Failed to connect to mongoDB atlas");
  });

// 連接到monogodb atlas=================================

// middlewares ========================================

// 屬於預設middleware

// 連接靜態檔案
app.use(express.static("public"));
// app.use(express.static("public/images"));
// 這個是讓send的data會以json格式呈現，但似乎現在不需要這段middleware了
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 設定express要顯示頁面的模板種類
app.set("view engine", "ejs");
// 就算頁面關閉還能保持登入的設定
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// 檢查passport.user是否有存在，若無存在則會給予空字串
app.use(passport.initialize());

// 若session有東西並且通過驗證，就會呼叫deserializerUser()
app.use(passport.session());

app.use(flash());
// 在flash的success_msg物件裡面傳入值的時候，在locals建立一個對應物件可以在全域使用它
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

//middlewares =========================================

// HOME
app.get("/", async (req, res) => {
  let posts = await Post.find({});
  let allUsers = await User.find({});
  res.render("index", { user: req.user, posts, allUsers });
});

app.get("/allposts", async (req, res) => {
  let findPosts = await Post.find({});
  res.render("allposts", { user: req.user, posts: findPosts });
});

app.post("/delete", async (req, res) => {
  const deletePost = await Post.deleteOne({ _id: req.body.id });
  res.redirect("/profile");
  console.log("post delete");
});

app.get("/singlepost/:id", async (req, res) => {
  let { id } = req.params;
  let postDetails = await Post.find({ _id: id });
  let { author, date, content, comments } = await postDetails[0];
  let postAuthor = await User.find({ name: author });

  let postAvatar;
  let googlePostAvatar;
  // 貼文者的頭像
  if (postAuthor[0].avatar) {
    postAvatar = postAuthor[0].avatar;
  } else {
    googlePostAvatar = postAuthor[0].thumbnail;
  }

  // 登入後的user頭像
  let avatar;
  let googleAvatar;
  if (req.user) {
    if (req.user.avatar) {
      avatar = req.user.avatar;
    } else {
      googleAvatar = req.user.thumbnail;
    }
  }
  res.render("single", {
    user: req.user,
    author,
    postAvatar,
    googlePostAvatar,
    date,
    content,
    id,
    comments,
    avatar,
    googleAvatar,
  });
});

// 留言
app.post("/singlepost/:id", async (req, res) => {
  let { id } = req.params;
  let { comment } = req.body;
  let avatar;
  let googleAvatar;
  if (req.user) {
    if (req.user.thumbnail) {
      googleAvatar = req.user.thumbnail;
    } else {
      avatar = req.user.avatar;
    }
  }
  Post.findOneAndUpdate(
    { _id: id },
    {
      $push: {
        comments: {
          comment,
          author: req.user.name,
          date: new Date(),
          avatar,
          googleAvatar,
        },
      },
    },
    function (err, success) {
      if (err) {
        console.log(err);
      } else {
        console.log(success, "udate successed");
      }
    }
  );
  res.redirect(`/singlepost/${id}`);
});

app.listen(PORT, () => {
  console.log("Server running in " + PORT);
});
