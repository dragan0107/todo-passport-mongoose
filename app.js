dotenv = require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const dateFormat = require("dateformat");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;
const app = express();
const port = process.env.PORT || 1717;
const user = process.env.DB_HOST;
const pass = process.env.DB_PASS;
app.use(session({
    secret: "Drip's darkest secret eeeeeeheheheh",
    resave: false,
    saveUninitialized: false
})); //having express handle the session and setting up the secret

app.use(passport.initialize());
app.use(passport.session());


//mongoose connection
mongoose.connect(`mongodb+srv://${user}${pass}@cluster0.jr1bn.mongodb.net/todoRebuildDB`, { useNewUrlParser: true, useUnifiedTopology: true });

const dateToday = dateFormat("fullDate");

const date = new Date();
const year = date.getFullYear();


app.set('view engine', 'ejs'); //setting EJS to use the files from views folder



const userSchema = new Schema({
    email: String,
    password: String,
    items: [{
        listItem: String
    }]
});


userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(bodyParser.urlencoded({
    extended: true
})); // body parser setup

app.use(express.static(__dirname + '/public')); // letting express to serve public static files



app.get("/", (req, res) => {

    if (req.isAuthenticated()) {
        res.redirect("/list");
    } else {
        res.render("home-login", {
            htmlYear: year
        });
    }

});



app.post("/", (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);

        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/list");
            });
        }
    });

});


app.get("/register", (req, res) => {
    res.render("register", {
        htmlYear: year
    });
});


app.post("/register", (req, res) => {

    User.register({
        username: req.body.username
    }, req.body.password, function(err, user) {

        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/list");
            });
        }
    });

});


app.get("/list", (req, res) => {

    if (req.isAuthenticated()) {
        User.findById(req.user._id, function(err, results) {
            if (err) {
                console.log(err);
            } else {
                res.render("list", {
                    htmlList: results.items,
                    htmlTitle: dateToday,
                    htmlYear: year
                });
            }

        });
    } else {
        res.redirect("/");
    }

});


app.post("/list", (req, res) => {


    const itemFromList = req.body.newItem;


    var newItems = { listItem: itemFromList };
    User.findOneAndUpdate({ _id: req.user._id }, { $push: { items: newItems } },
        (error, success) => {
            if (error) {
                console.log(error);
            } else {
                res.redirect("/list");
            }
        });




});


app.post("/delete", (req, res) => {


    const deletedItem = req.body.checkbox;


    if (req.isAuthenticated()) {
        User.findByIdAndUpdate({ _id: req.user._id }, { $pull: { items: { _id: deletedItem } } }, () => {
            res.redirect("/list");
        });
    } else {
        console.log("not found");
    }

});



app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

//express listening for connections on the port 1717
app.listen(port, () => console.log("The server is hosted on port 1717!"));