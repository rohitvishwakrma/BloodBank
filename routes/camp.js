let express=require('express');
let router=express.Router({mergeParams:true});
let mysql=require('mysql2');
let path=require('path');

router.use(express.json())
router.use(express.static(path.join(__dirname,"../public")));

let connection = require('../database.js');

router.get("/registration",function(req,res){
    res.render("camp_registration.ejs");
})
router.post("/submition",function(req,res){
    try{
        let {
            Organization_Type,Organization_Name,Organizer_Name,Organizer_Mobile_No,Organizer_Email_Id,Camp_Date,Camp_Name,Camp_Address,State,District,Start_Time,End_Time
        }=req.body;
        let sql=`insert into blood_camp (organization_type,organization_name,organizer_name,Organizer_Mobile_No,Organizer_Email_Id,Camp_Date,Camp_Name,Camp_Address,State,District,Start_Time,End_Time) values(?,?,?,?,?,?,?,?,?,?,?,?)`
        let value=[Organization_Type,Organization_Name,Organizer_Name,Organizer_Mobile_No,Organizer_Email_Id,Camp_Date,Camp_Name,Camp_Address,State,District,Start_Time,End_Time];
        connection.query(sql,value,function(err,result){
            if(err) throw err;
            res.redirect("/camp/registration");
        })
    }
    catch(err){
        console.log(err);
        res.redirect("/camp/registration");
    }
})

module.exports = router;