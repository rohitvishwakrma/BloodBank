let express = require('express');
let router = express.Router({mergeParams:true});
let bcrypt = require('bcryptjs');
let passport = require('passport');
let localpassport = require('passport-local').Strategy;
let path = require('path');
let flash = require('connect-flash');
let connection = require('../database.js');
// Initialize flash messages and static files
router.use(express.static(path.join(__dirname, "../public")));
router.use(flash());

// Passport Local Strategy for Admin
passport.use('admin-local', new localpassport(
    async function (username, password, done) {
        try {
            connection.query(`SELECT * FROM Admin WHERE username = ?`, [username], async function (err, result) {
                if (err) throw err;
                if (result.length == 0) return done(null, false);
                
                let user = result[0];
                let match = await bcrypt.compare(password, user.password);
                
                if (match){
                    return done(null, user);
                    
                } 
                else return done(null, false);
            });
        } catch (err) {
            console.log(err);
            return done(err);
        }
    }
));



router.get("/login", function (req, res) {
    if (req.isAuthenticated() && req.user.role === 'admin') 
        res.render('admin_dashboard.ejs');
    else 
        res.render("admin_login.ejs");
});

router.post("/login", passport.authenticate('admin-local', {
    successRedirect: "/admin/dashboard",
    failureRedirect: "/admin/login",
    failureFlash: true
}));
router.get("/dashboard", function (req, res) {
    if (req.isAuthenticated() && req.user.role === 'admin' ) res.render('admin_dashboard.ejs');
    else res.render("admin_login.ejs")
});
router.get("/signup",function(req,res){
    res.render('admin_signup.ejs');
})
router.post("/signup",async function(req,res){
    try {
        let {username,password} = req.body;
        password = await bcrypt.hash(password, 10);
        let sql = "INSERT INTO admin (username,password) VALUES(?,?)";
        connection.query(sql, [username, password], function (err, result) {
            if (err) throw err;
            res.redirect('/admin/login');
        });
    } catch (err) {
        res.redirect("/admin/signup");
    }
});

router.get('/logout', function (req, res) {
    req.logout(function (err) {
        if (err) console.log(err);
        res.redirect('/');
    });
});

module.exports = router;
