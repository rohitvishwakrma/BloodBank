let express=require('express');
let router=express.Router({mergeParams:true});
let mysql=require('mysql2');
let path=require('path');

router.use(express.json())
router.use(express.static(path.join(__dirname,"../public")));

let connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'Vinay@6378',
    database:'BloodBank'
});

router.get("/Registration",function(req,res){
    res.render("bank.ejs");
})
router.post("/submition",async function(req,res){
    try{
        let { Blood_Bank_Name,Hospital_Name,Category,Person_Name,Email,Contact_No,
            Licence_No,License_Issue,License_Expiry,Website,No_Beds,state,district,
            Address,Pincode,Donor_Type,Donation_Type,Component_Type,Bag_Type,TTI_Type}=req.body;
        let sql = `INSERT INTO bank (Blood_Bank_Name, Hospital_Name, Category, Person_Name, Email, Contact_No, Licence_No,License_Issue,License_Expiry,Website,No_Beds,state,district,Address,Pincode, Donor_Type,Donation_Type,Component_Type,Bag_Type,TTI_Type) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        No_Beds = No_Beds === '' ? null : parseInt(No_Beds, 10);
        if (Array.isArray(Donor_Type)) {
            Donor_Type = Donor_Type.join(', ');
        }
        if (Array.isArray(Donation_Type)) {
            Donation_Type = Donation_Type.join(', ');
        }
        if (Array.isArray(Component_Type)) {
            Component_Type = Component_Type.join(', ');
        }
        if (Array.isArray(Bag_Type)) {
            Bag_Type = Bag_Type.join(', ');
        }
        if (Array.isArray(TTI_Type)) {
            TTI_Type = TTI_Type.join(', ');
        }
        let values= [
            Blood_Bank_Name,Hospital_Name,Category,Person_Name,Email,Contact_No,
            Licence_No,License_Issue,License_Expiry,Website,No_Beds,state,district,
            Address,Pincode,Donor_Type,Donation_Type,Component_Type,Bag_Type,TTI_Type
        ];
        connection.query(sql,values,function(err,result){
                if(err||result.length==0)
                    throw err;
                else
                    res.redirect('/');
            })
    }
    catch(err){
        console.log(err)
        res.redirect('/bank/Registration');
    }
})


module.exports = router;