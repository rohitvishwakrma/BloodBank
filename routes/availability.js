let express=require('express');
let router=express.Router({mergeParams:true});
let mysql=require('mysql2');
let path=require('path');
let inventory_details;
let bank_details;
router.use(express.json())
router.use(express.static(path.join(__dirname,"../public")));

let connection = require('../database.js');
router.get("/dashboard", function (req, res) {
    res.render("blood_availability.ejs",{bank_details,inventory_details});
});

router.post("/dashboard/blood_stock", async function (req, res) {
    let {state,district,blood_group}=req.body;
    let sql =`select * from bank where state= ? and district= ? and Action ='accepted' `
    bank_details=await new Promise(function (resolve, reject){
        connection.query(sql,[state, district], function (err, result) {
            if (err) reject(err);
            else resolve(result);
        });
    })
    sql=`select * from inventory where bank_id in (select bank_id from bank
        where state= ? and district = ? and Action ='accepted') 
        and bloodgroup= ?;`
    inventory_details=await new Promise(function(resolve, reject) {
        connection.query(sql,[state, district, blood_group], function (err, result) {
            if (err) reject(err);
            else resolve(result);
        });
    })
    console.log(bank_details)
    console.log(inventory_details)
    res.redirect('/availability/dashboard');
})

module.exports = router;