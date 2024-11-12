let express = require('express');
let router = express.Router({mergeParams:true});
let bcrypt = require('bcryptjs');
let passport = require('passport');
let localpassport = require('passport-local').Strategy;
let path = require('path');
let flash = require('connect-flash');
let connection = require('../database.js');
const { fchmod } = require('fs');
const { promises } = require('dns');
const bloodInventory = {
    "A+": 0,
    "A-": 0,
    "B+": 0,
    "B-": 0,
    "AB+": 0,
    "AB-": 0,
    "O+": 0,
    "O-": 0
};

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
        res.redirect('/admin/dashboard');
    else 
        res.render('admin_login.ejs');
});

router.post("/login", passport.authenticate('admin-local', {
    successRedirect: "/admin/dashboard",
    failureRedirect: "/admin/login",
    failureFlash: true
}));
router.get("/dashboard",async function (req, res) {
    if (req.isAuthenticated() && req.user.role === 'admin' ){
        try{
            let sql=`select * from bank`;
            let bankdetails='';
            bankdetails = await new Promise(function(resolve, reject) {
                connection.query(sql, function (err, result) {
                    if (err) reject(err); // Handle the error
                    else resolve(result);  // Resolve with the result
                });
            });

            const campdetails= await new Promise(function(resolve,reject){
                connection.query(`SELECT * FROM blood_camp`, function (err, result) {
                    if (err) reject(err); // Handle the error
                    else resolve(result);  // Resolve with the result
                });
            })
            res.render('admin_dashboard.ejs',{bankdetails,campdetails});
        }
        catch(err){
            console.error("Database error:", err);
        }
    }
        
    else 
        res.redirect("/admin/login");
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
router.get('/acceptBloodBank/:bank_id',async function(req,res){
    try{
        let bank_id=req.params.bank_id;
        let sql='UPDATE bank SET Action="accepted" WHERE bank_id=?';
        connection.query(sql,[bank_id],function(err,result){
            if(err){
                throw err;
            }
        });
        sql='insert into bank_admin (username,password,bank_id) values (?,?,?)';
        let password=await bcrypt.hash('123',10);
        let query=await new Promise(function(resolve, reject){
            connection.query('select * from bank where bank_id = ?',[bank_id],function(err,result){
                if(err)
                    reject(err);
                else
                    resolve(result[0]);
            })
        })
        connection.query(sql,[query.Email,password,bank_id],function(err,result){
            if(err){
                throw err;
            }
        });
        for(let key in bloodInventory){
            sql='INSERT INTO inventory (bank_id,bloodgroup,quantity) values (?,?,?)';
            connection.query(sql,[bank_id,key,bloodInventory[key]],function(err,result){
                if(err){
                    throw err;
                }
            });
        }
        res.redirect('/admin/dashboard');
    }
    catch(err){
        console.log('error in admin accept blood bank',err);
        res.redirect('/admin/dashboard');
    }
})
router.get('/rejectBloodBank/:bank_id',function(req,res){
    try{
        let bank_id=req.params.bank_id;
        let sql='delete from bank where bank_id=?';
        connection.query(sql,[bank_id],function(err,result){
            if(err){
                throw err;
            }
        });
        res.redirect('/admin/dashboard');
    }
    catch(err){
        console.log('error in admin reject blood bank',err);
        res.redirect('/admin/dashboard');
    }
})

router.get("/acceptCamp/:camp_id",function(req,res){
    try{
        let camp_id=req.params.camp_id;
        let sql='UPDATE blood_camp SET Action="accepted" WHERE camp_id=?';
        connection.query(sql,[camp_id],function(err,result){
            if(err){
                throw err;
            }
        });
        res.redirect('/admin/dashboard');
    }
    catch(err){
        console.log('error in admin accept blood camp',err);
        res.redirect('/admin/dashboard');
    }
})

router.get('/rejectCamp/:camp_id',function(req,res){
    try{
        let camp_id=req.params.camp_id;
        let sql='delete from blood_camp where camp_id=?';
        connection.query(sql,[camp_id],function(err,result){
            if(err){
                throw err;
            }
        });
        res.redirect('/admin/dashboard');
    }
    catch(err){
        console.log('error in admin reject blood camp',err);
        res.redirect('/admin/dashboard');
    }
})


router.get('/logout', function (req, res) {
    req.logout(function (err) {
        if (err) console.log(err);
        res.redirect('/');
    });
});
module.exports = router;
