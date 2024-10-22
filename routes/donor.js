

let express = require('express');
let router = express.Router({mergeParams: true });
let bcrypt = require('bcryptjs');
let passport = require('passport');
let localpassportdonor = require('passport-local').Strategy;
let path = require('path');
let flash = require('connect-flash');
let connection = require('../database.js');

// Initialize flash messages and static files
router.use(express.static(path.join(__dirname, "../public")));
router.use(flash());

// Passport Local Strategy for Donor
passport.use('donor-local', new localpassportdonor(
    async function (username, password, done) {
        try {
            connection.query(`SELECT * FROM donor WHERE email = ?`, [username], async function (err, result) {
                if (err) throw err;
                if (result.length == 0) return done(null, false);

                let user = result[0];
                let match = await bcrypt.compare(password, user.password);
                if (match) 
                    return done(null, user);
                else return done(null, false);
            });
        } catch (err) {
            console.log(err);
            return done(err);
        }
    }
));


router.get("/signup", function (req, res) {
    res.render("donor_signup.ejs");
});

router.post("/signup", async function (req, res) {
    try {
        let { name, age, gender, bloodgroup, email, phone, address, pin, password } = req.body;
        password = await bcrypt.hash(password, 10);
        let sql = "INSERT INTO Donor (name, age, gender, bloodgroup, email, phone, address, pin, password) VALUES(?,?,?,?,?,?,?,?,?)";
        connection.query(sql, [name, age, gender, bloodgroup, email, phone, address, pin, password], function (err, result) {
            if (err) throw err;
            res.redirect('/donor/login');
        });
    } catch (err) {
        console.log(err);
        res.redirect("/donor/signup");
    }
});

router.get("/login", function (req, res) {
    if (req.isAuthenticated()&& req.user.role === 'donor') 
        res.render('donor_dashboard.ejs');
    else 
        res.render("donor_login.ejs");
});

router.post("/login", passport.authenticate('donor-local', {
    successRedirect: "/donor/dashboard",
    failureRedirect: "/donor/login",
    failureFlash: true
}));

router.get("/dashboard", function (req, res) {
    if (req.isAuthenticated()&& req.user.role === 'donor' ) 
        res.render("donor_dashboard.ejs", { name: req.user.name });
    else 
        res.redirect('/donor/login');
});

router.get('/logout', function (req, res) {
    req.logout(function (err) {
        if (err) console.log(err);
        res.redirect('/');
    });
});

module.exports = router;
