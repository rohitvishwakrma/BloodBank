let express = require('express');
let router = express.Router({mergeParams: true });
let bcrypt = require('bcryptjs');
let passport = require('passport');
let localpassportdonor = require('passport-local').Strategy;
let path = require('path');
let connection = require('../database.js');
const { route } = require('./admin.js');
let bankdata='';
let donationData='';
// Initialize flash messages and static files
router.use(express.static(path.join(__dirname, "../public")));

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
                    return done(null, user)
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
        let { name, age, gender, bloodgroup, email, phone, address, pin, password,aadhar,father_name } = req.body;
        password = await bcrypt.hash(password, 10);
        let sql = "INSERT INTO Donor (name, age, gender, bloodgroup, email, phone, address, pin, password,aadhar,father_name) VALUES(?,?,?,?,?,?,?,?,?,?,?)";
        connection.query(sql, [name, age, gender, bloodgroup, email, phone, address, pin, password,aadhar,father_name], function (err, result) {
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
        res.redirect('/donor/dashboard')
    else 
        res.render("donor_login.ejs");
});

router.post("/login", passport.authenticate('donor-local', {
    successRedirect: "/donor/dashboard",
    failureRedirect: "/donor/login",
    failureFlash: true
}));

router.get("/dashboard",async function (req, res) {
    if (req.isAuthenticated()&& req.user.role === 'donor' ){
        try{
            let sql=`select *
                        from donation
                        join bank
                        on donation.bank_id= bank.bank_id
                        join donor
                        on donation.donor_id= donor.id
                        where donor_id = ?;`
            donationData=await new Promise(function(resolve,reject){
                connection.query(sql,[req.user.id] ,function (err, result) {
                    if (err) reject(err); // Handle the error
                    else resolve(result);  // Resolve with the result
                });
            })
        }
        catch(err){
            console.log("error on donation table on donor dashboard");
        }
        res.render("donor_dashboard.ejs", {user: req.user,bankdata,donationData});
    }
    else 
        res.redirect('/donor/login');
});
router.post("/dashboard/update/:id",async function(req,res){
    let {id}=req.params;
    let {name,email,phone,address,password,re_password}=req.body;
    if(password.length>0&& password===re_password){
        password=await bcrypt.hash(password,10);
        let sql=`update donor set name=?,email=?, phone=?, address=?, password=? where id = ${id}`;
        connection.query(sql,[name,email,phone,address,password],function(err,result){
            if(err) throw err;
            res.redirect('/donor/dashboard');
        })
    }
    else{
        let sql=`update donor set name=?, email=?, phone=?, address=? where id = ${id}`;
        connection.query(sql,[name,email,phone,address],function(err,result){
            if(err) throw err;
            res.redirect('/donor/dashboard');
        })
    }
})

router.get("/dashboard/donate/:bank_id/:donor_id",async function(req,res){
    try{
        let {bank_id,donor_id}=req.params;
        let sql=`select * from donation where donor_id = ?`;
        let existdonor=await new Promise(function(resolve,reject){
            connection.query(sql,[donor_id],function(err,result){
                if(err)
                    reject(err);
                else
                    resolve(result);
            })
        })
        if(existdonor.length>0){
            req.flash('message','You cannot send more than one donation request to the blood bank.');
            return res.redirect('/donor/dashboard');
        }
        sql=`INSERT INTO donation (bank_id, donor_id) VALUES(?,?)`;
        connection.query(sql,[bank_id,donor_id],function(err,result){
            if(err) throw err;
        })
        res.redirect('/donor/dashboard');
    }
    catch(err){
        console.log("error on donation table on donor dashboard");
        res.redirect('/donor/dashboard')
    }

})
router.post("/bankdetails",async function(req,res){
    try{
        let {state,district}=req.body;
        bankdata=await new Promise(function(resolve,reject){
            connection.query(`SELECT * FROM bank WHERE state =? AND district =?`, [state, district], function (err, result) {
                if (err) reject(err); // Handle the error
                else resolve(result);  // Resolve with the result
            });
        });
        res.redirect('/donor/dashboard')
    }
    catch(err){
        console.log("error on fetch bank data on donor dashboard");
    }
})
router.get("/dashboard/drop_request/:donor_id",function(req,res){
    let donor_id=req.params.donor_id;
    let sql=`DELETE FROM donation WHERE donor_id =?`;
    connection.query(sql,[donor_id],function(err,result){
        if(err) throw err;
        res.redirect('/donor/dashboard');
    })
})

router.get('/logout', function (req, res) {
    bankdata=''
    req.logout(function (err) {
        if (err) console.log(err);
        res.redirect('/');
    });
});

module.exports = router;
