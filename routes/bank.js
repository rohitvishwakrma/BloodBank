let express = require( 'express' );
let router = express.Router( { mergeParams: true } );
let path = require( 'path' );
let passport = require( 'passport' );
let localpassportdonor = require( 'passport-local' ).Strategy;
let bcrypt = require( 'bcryptjs' );
let connection = require( '../database.js' );
const sql = require( '../database.js' );



router.use( express.json() )
router.use( express.static( path.join( __dirname, "../public" ) ) );

passport.use( 'bank_admin-local', new localpassportdonor(
    async function ( username, password, done )
    {
        try
        {
            connection.query( `SELECT * FROM bank_admin WHERE username = ?`, [ username ], async function ( err, result )
            {
                if ( err ) throw err;
                if ( result.length == 0 ) return done( null, false );

                let user = result[ 0 ];
                let match = await bcrypt.compare( password, user.password );
                if ( match )
                    return done( null, user )
                else return done( null, false );
            } );
        } catch ( err )
        {
            console.log( err );
            return done( err );
        }
    }
) );
router.get( "/Registration", function ( req, res )
{
    res.render( "blood_bank_registration.ejs" );
} )
router.get( "/login", function ( req, res )
{
    if ( req.isAuthenticated() && req.user.role === 'bank_admin' )
        res.redirect( '/bank/dashboard' )
    else
        res.render( "blood_bank_login.ejs" );
} )
router.post( "/login", passport.authenticate( 'bank_admin-local', {
    successRedirect: "/bank/dashboard",
    failureRedirect: "/bank/login",
    failureFlash: true
} ) );

router.get( "/dashboard", async function ( req, res )
{
    let bankdata;
    let donordata;
    let donationdata;
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
    if ( req.isAuthenticated() && req.user.role === 'bank_admin' )
    {
        try
        {
            let sql = `select * 
                from bank_admin
                join bank
                on bank_admin.bank_id=bank.bank_id
                where bank.bank_id = ?;`
            bankdata = await new Promise( function ( resolve, reject )
            {
                connection.query( sql, [ req.user.bank_id ], function ( err, result )
                {
                    if ( err ) reject( err );
                    else resolve( result[ 0 ] );
                } );
            } )
            sql = `select * from donor where id in (select donor_id
                from donation
                join bank
                on donation.bank_id=bank.bank_id
                where bank.bank_id = ${ req.user.bank_id });`
            donordata = await new Promise( function ( resolve, reject )
            {
                connection.query( sql, function ( err, result )
                {
                    if ( err ) reject( err );
                    else resolve( result );
                } );
            } )
            sql = `select * from donation where bank_id=${ req.user.bank_id }`;
            donationdata = await new Promise( function ( resolve, reject )
            {
                connection.query( sql, function ( err, result )
                {
                    if ( err ) reject( err );
                    else resolve( result );
                } );
            } )
            sql = `select * from donation_history where bank_id = ${ req.user.bank_id }`;
            let donate_history = await new Promise( function ( resolve, reject )
            {
                connection.query( sql, function ( err, result )
                {
                    if ( err ) reject( err );
                    else resolve( result );
                } );
            } )
            let date = new Date();
            for ( let i = 0; i < donate_history.length; i++ )
            {
                for ( let key in bloodInventory )
                {
                    if ( donate_history[ i ][ 'blood_group' ] === key && donate_history[ i ][ 'expiry_date' ] > date )
                        bloodInventory[ key ]++;
                }
            }
            for ( let key in bloodInventory )
            {
                sql = 'update inventory set quantity = ?,last_updated_date = ? where bloodgroup = ? and bank_id=?';
                connection.query( sql, [ bloodInventory[ key ], new Date(), key, req.user.bank_id ], function ( err, result )
                {
                    if ( err )
                        throw err
                } )
            }
        }
        catch ( err )
        {
            console.log( 'Error on bank_admin table on blood bank dashboard', err );
        }
        res.render( "blood_bank_dashboard.ejs", { bankdata, donordata, donationdata, bloodInventory } );
    }
    else
        res.redirect( '/bank/login' );
} )
router.post( "/submition", async function ( req, res )
{
    try
    {
        let { Blood_Bank_Name, Hospital_Name, Category, Person_Name, Email, Contact_No,
            Licence_No, License_Issue, License_Expiry, Website, No_Beds, state, district,
            Address, Pincode, Donor_Type, Donation_Type, Component_Type, Bag_Type, TTI_Type } = req.body;
        let sql = `INSERT INTO bank (Blood_Bank_Name, Hospital_Name, Category, Person_Name, Email, Contact_No, Licence_No,License_Issue,License_Expiry,Website,No_Beds,state,district,Address,Pincode, Donor_Type,Donation_Type,Component_Type,Bag_Type,TTI_Type) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        No_Beds = No_Beds === '' ? null : parseInt( No_Beds, 10 );
        if ( Array.isArray( Donor_Type ) )
        {
            Donor_Type = Donor_Type.join( ', ' );
        }
        if ( Array.isArray( Donation_Type ) )
        {
            Donation_Type = Donation_Type.join( ', ' );
        }
        if ( Array.isArray( Component_Type ) )
        {
            Component_Type = Component_Type.join( ', ' );
        }
        if ( Array.isArray( Bag_Type ) )
        {
            Bag_Type = Bag_Type.join( ', ' );
        }
        if ( Array.isArray( TTI_Type ) )
        {
            TTI_Type = TTI_Type.join( ', ' );
        }
        let values = [
            Blood_Bank_Name, Hospital_Name, Category, Person_Name, Email, Contact_No,
            Licence_No, License_Issue, License_Expiry, Website, No_Beds, state, district,
            Address, Pincode, Donor_Type, Donation_Type, Component_Type, Bag_Type, TTI_Type
        ];
        connection.query( sql, values, function ( err, result )
        {
            if ( err || result.length == 0 )
                throw err;
            else
                res.redirect( '/' );
        } )
    }
    catch ( err )
    {
        console.log( err )
        res.redirect( '/bank/Registration' );
    }
} )
router.post( '/donation/approve/:donation_id', function ( req, res )
{
    try
    {
        let donation_id = req.params.donation_id;
        let { donation_date, donation_time } = req.body;
        let sql = `UPDATE donation SET donation_date=?, donation_time=?,status='approved' WHERE id=?`;
        connection.query( sql, [ donation_date, donation_time, donation_id ], function ( err, result )
        {
            if ( err ) throw err;
        } );
        res.redirect( '/bank/dashboard' );
    }
    catch ( err )
    {
        console.log( 'error in bank admin accept donation', err );
        res.redirect( '/bank/dashboard' );
    }
} )

router.post( "/dashboard/update/:bank_id", async function ( req, res )
{
    try
    {
        let bank_id = req.params.bank_id;
        let { Email, Blood_Bank_Name, Hospital_Name, Contact_No, Address, password, re_password } = req.body;
        if ( password == re_password && password.length > 0 )
        {
            let sql = 'update bank set Email =?, Blood_Bank_Name =?,Hospital_Name = ?, Contact_No = ?,Address =? where bank_id =?';
            connection.query( sql, [ Email, Blood_Bank_Name, Hospital_Name, Contact_No, Address, bank_id ], function ( err, result )
            {
                if ( err )
                    throw err;
            } )
            password = await bcrypt.hash( password, 10 );
            sql = 'update bank_admin set password = ? where bank_id = ?';
            connection.query( sql, [ password, bank_id ], function ( err, result )
            {
                if ( err )
                    throw err;
            } )
        }
        else
        {
            let sql = 'update bank set Email =?, Blood_Bank_Name =?,Hospital_Name =?, Contact_No = ?,Address =? where bank_id =?';
            connection.query( sql, [ Email, Blood_Bank_Name, Hospital_Name, Contact_No, Address, bank_id ], function ( err, result )
            {
                if ( err )
                    throw err;
            } )
        }
        res.redirect( '/bank/dashboard' )
    }
    catch ( err )
    {
        console.log( 'error update profile of blood bank', err );
        res.redirect( '/bank/dashboard' )
    }
} )
router.get( "/dashboard/update_blood_group/:donor_id/:blood_group", function ( req, res )
{
    try
    {
        let { donor_id, blood_group } = req.params;
        let sql = 'UPDATE donor SET bloodgroup =? WHERE id =?';
        connection.query( sql, [ blood_group, donor_id ], function ( err, result )
        {
            if ( err )
                throw err;
        } )
        res.redirect( '/bank/dashboard' );
    }
    catch ( err )
    {
        console.log( 'Error on update blood group on blood bank', err );
        res.redirect( '/bank/dashboard' );
    }
} )
router.get( "/dashboard/donation_history/:donation_id/:bank_id/:donor_id", async function ( req, res )
{
    try
    {
        let { donation_id, bank_id, donor_id } = req.params;
        let sql = 'select * from donor where id=?';
        let donor_data = await new Promise( function ( resolve, reject )
        {
            connection.query( sql, [ donor_id ], function ( err, result )
            {
                if ( err )
                    reject( err );
                else
                    resolve( result[ 0 ] );
            } )
        } )
        let bloodgroup = donor_data[ 'bloodgroup' ]
        let total_donation = donor_data[ 'total_donation' ] + 1;
        sql = 'update donor set total_donation =? where id =?';
        connection.query( sql, [ total_donation, donor_id ], function ( err, result )
        {
            if ( err )
                throw err;
        } )
        sql = 'update donation set blood_type =?, status ="completed" where id =?'
        connection.query( sql, [ donor_data[ 'bloodgroup' ], donation_id ], function ( err, result )
        {
            if ( err )
                throw err;
        } )
        sql = 'select donation_date from donation where id =?'
        let donation_date = await new Promise( function ( resolve, reject )
        {
            connection.query( sql, [ donation_id ], function ( err, result )
            {
                if ( err )
                    reject( err );
                else
                    resolve( result[ 0 ][ 'donation_date' ] );
            } )
        } )
        let expiry_date = new Date();
        expiry_date.setDate( expiry_date.getDate() + 42 );
        let formattedExpiryDate = expiry_date.getFullYear() + '-' + String( expiry_date.getMonth() + 1 ).padStart( 2, '0' ) + '-' + String( expiry_date.getDate() ).padStart( 2, '0' );
        sql = 'insert into donation_history (bank_id,donor_id,donation_id,blood_group,donation_date,expiry_date) values (?,?,?,?,?,?)';
        connection.query( sql, [ bank_id, donor_id, donation_id, bloodgroup, donation_date, formattedExpiryDate ], function ( err, result )
        {
            if ( err )
                throw err;
        } )
        res.redirect( "/bank/dashboard" )
    }
    catch ( err )
    {
        console.log( "error in donation_history table", err );
        res.redirect( "/bank/dashboard" )
    }
} )
router.get( "/dashboard/donation_history/reject_donor/:donation_id", function ( req, res )
{
    try
    {
        let donation_id = req.params.donation_id;
        let sql = `update donation set status="rejected" where id =?`;
        connection.query( sql, [ donation_id ], function ( err, result )
        {
            if ( err ) throw err;
        } );
        res.redirect( "/bank/dashboard" )
    }
    catch ( err )
    {
        console.log( "error on update donation status", err );
        res.redirect( "/bank/dashboard" )
    }

} )

router.get( '/logout', function ( req, res )
{
    req.logout( function ( err )
    {
        if ( err ) console.log( "error in bank logout", err );
        res.redirect( '/' );
    } );
} );

module.exports = router;