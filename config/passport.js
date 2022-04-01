const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const User = require("../models/user-model");
const localStrategy = require("passport-local");
const bcrypt = require("bcrypt");

// 在本地申請帳號密碼
passport.use(
  new localStrategy((username, password, done) => {
    User.findOne({ email: username })
      .then(async (user) => {
        if (!user) {
          return done(null, false);
        }
        await bcrypt.compare(password, user.password, function (err, result) {
          if (err) {
            return done(null, false);
          }
          if (!result) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        });
      })
      .catch((err) => {
        return done(null, false);
      });
  })
);

// google auth
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/redirect",
    },
    (accessToken, refreshToken, profile, done) => {
      //   passport callback
      User.findOne({ googleID: profile.id }).then((foundUser) => {
        if (foundUser) {
          console.log("User exist");
          done(null, foundUser);
        } else {
          new User({
            name: profile.displayName,
            googleID: profile.id,
            thumbnail: profile.photos[0].value,
            email: profile.emails[0].value,
          })
            .save()
            .then((newUser) => {
              console.log("new user created");
              done(null, newUser);
            });
        }
      });
    }
  )
);

// 將user._id儲存到Session的passport.user
passport.serializeUser(function (user, done) {
  console.log("Serialized");
  done(null, user._id);
});

// 從Session抓取passport.user的_id的資料
passport.deserializeUser(function (_id, done) {
  console.log("Deserialized");
  User.findById({ _id }).then((user) => {
    console.log("Found user");
    done(null, user);
  });
});
