const express = require( 'express' );
const router = express.Router( { mergeParams: true } );
const bcrypt = require( 'bcryptjs' );
const passport = require( 'passport' );
const LocalStrategy = require( 'passport-local' ).Strategy;
const path = require( 'path' );
const connection = require( '../database.js' );
let bankdata = '';
let donationData = '';

router.use( express.static( path.join( __dirname, "../public" ) ) );

// Passport local strategy for donor login
passport.use( 'donor-local', new LocalStrategy(
    async function ( username, password, done )
    {
        try
        {
            connection.query( `SELECT * FROM donor WHERE email = ?`, [ username ], async function ( err, result )
            {
                if ( err ) return done( err );
                if ( result.length === 0 ) return done( null, false );

                let user = result[ 0 ];
                let match = await bcrypt.compare( password, user.password );
                if ( match )
                    return done( null, user );
                else
                    return done( null, false );
            } );
        } catch ( err )
        {
            console.log( "Error in passport authentication", err );
            return done( err );
        }
    }
) );

//  signup page
router.get( "/signup", function ( req, res )
{
    res.render( "donor_signup.ejs" );
} );

// Handle donor signup
router.post( "/signup", async function ( req, res )
{
    try
    {
        let { name, age, gender, bloodgroup, email, phone, address, pin, password, aadhar, father_name } = req.body;
        password = await bcrypt.hash( password, 10 );
        let sql = "INSERT INTO donor (name, age, gender, bloodgroup, email, phone, address, pin, password, aadhar, father_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        connection.query( sql, [ name, age, gender, bloodgroup, email, phone, address, pin, password, aadhar, father_name ], function ( err, result )
        {
            if ( err )
            {
                console.log( err );
                return res.redirect( "/donor/signup" );
            }
            res.redirect( '/donor/login' );
        } );
    } catch ( err )
    {
        console.log( err );
        res.redirect( "/donor/signup" );
    }
} );

// login page
router.get( "/login", function ( req, res )
{
    if ( req.isAuthenticated() && req.user.role === 'donor' )
        res.redirect( '/donor/dashboard' );
    else
        res.render( "donor_login.ejs" );
} );

// Handle donor login
router.post( "/login", passport.authenticate( 'donor-local', {
    successRedirect: "/donor/dashboard",
    failureRedirect: "/donor/login",
    failureFlash: true
} ) );

// donor dashboard
router.get( "/dashboard", async function ( req, res )
{
    if ( req.isAuthenticated() && req.user.role === 'donor' )
    {
        try
        {
            let sql = `SELECT *
                        FROM donation
                        JOIN bank ON donation.bank_id = bank.bank_id
                        JOIN donor ON donation.donor_id = donor.id
                        WHERE donor_id = ?;`;
            donationData = await new Promise( function ( resolve, reject )
            {
                connection.query( sql, [ req.user.id ], function ( err, result )
                {
                    if ( err ) reject( err );
                    else resolve( result );
                } );
            } );
        } catch ( err )
        {
            console.log( "Error on donation table on donor dashboard", err );
        }
        res.render( "donor_dashboard.ejs", { user: req.user, bankdata, donationData } );
    } else
    {
        res.redirect( '/donor/login' );
    }
} );

// Update donor profile
router.post( "/dashboard/update/:id", async function ( req, res )
{
    let { id } = req.params;
    let { name, email, phone, address, password, re_password } = req.body;
    if ( password.length > 0 && password === re_password )
    {
        password = await bcrypt.hash( password, 10 );
        let sql = `UPDATE donor SET name=?, email=?, phone=?, address=?, password=? WHERE id = ?`;
        connection.query( sql, [ name, email, phone, address, password, id ], function ( err, result )
        {
            if ( err ) throw err;
            res.redirect( '/donor/dashboard' );
        } );
    } else
    {
        let sql = `UPDATE donor SET name=?, email=?, phone=?, address=? WHERE id = ?`;
        connection.query( sql, [ name, email, phone, address, id ], function ( err, result )
        {
            if ( err ) throw err;
            res.redirect( '/donor/dashboard' );
        } );
    }
} );

// Handle donation request
router.get( "/dashboard/donate/:bank_id/:donor_id", async function ( req, res )
{
    try
    {
        let { bank_id, donor_id } = req.params;
        let sql = `SELECT * FROM donation WHERE donor_id = ?`;
        let existdonor = await new Promise( function ( resolve, reject )
        {
            connection.query( sql, [ donor_id ], function ( err, result )
            {
                if ( err ) reject( err );
                else resolve( result );
            } );
        } );
        if ( existdonor.length > 0 )
        {
            req.flash( 'message', 'You cannot send more than one donation request to the blood bank.' );
            return res.redirect( '/donor/dashboard' );
        }
        sql = `INSERT INTO donation (bank_id, donor_id) VALUES (?, ?)`;
        connection.query( sql, [ bank_id, donor_id ], function ( err, result )
        {
            if ( err ) throw err;
        } );
        res.redirect( '/donor/dashboard' );
    } catch ( err )
    {
        console.log( "Error on donation table on donor dashboard", err );
        res.redirect( '/donor/dashboard' );
    }
} );

// Search for banks by state and district
router.post( "/bankdetails", async function ( req, res )
{
    try
    {
        let { state, district } = req.body;
        bankdata = await new Promise( function ( resolve, reject )
        {
            connection.query( `SELECT * FROM bank WHERE state = ? AND district = ? AND Action = 'accepted'`, [ state, district ], function ( err, result )
            {
                if ( err ) reject( err );
                else resolve( result );
            } );
        } );
        res.redirect( '/donor/dashboard' );
    } catch ( err )
    {
        console.log( "Error on fetch bank data on donor dashboard", err );
    }
} );

// Drop donation request
router.get( "/dashboard/drop_request/:donor_id", function ( req, res )
{
    let donor_id = req.params.donor_id;
    let sql = `DELETE FROM donation WHERE donor_id = ?`;
    connection.query( sql, [ donor_id ], function ( err, result )
    {
        if ( err ) throw err;
        res.redirect( '/donor/dashboard' );
    } );
} );

// Logout
router.get( '/logout', function ( req, res )
{
    bankdata = '';
    req.logout( function ( err )
    {
        if ( err ) console.log( err );
        res.redirect( '/' );
    } );
} );

module.exports = router;
