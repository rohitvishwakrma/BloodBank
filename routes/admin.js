const express = require( 'express' );
const router = express.Router( { mergeParams: true } );
const bcrypt = require( 'bcryptjs' );
const passport = require( 'passport' );
const LocalStrategy = require( 'passport-local' ).Strategy;
const path = require( 'path' );
const flash = require( 'connect-flash' );
const connection = require( '../database.js' );

const bloodInventory = {
    "A+": 0, "A-": 0, "B+": 0, "B-": 0,
    "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
};

router.use( express.static( path.join( __dirname, "../public" ) ) );
router.use( flash() );


passport.use( 'admin-local', new LocalStrategy(
    async function ( username, password, done )
    {
        try
        {
            connection.query( `SELECT * FROM admin WHERE username = ?`, [ username ], async function ( err, result )
            {
                if ( err ) return done( err );
                if ( result.length === 0 ) return done( null, false );

                let user = result[ 0 ];
                let match = await bcrypt.compare( password, user.password );

                if ( match ) return done( null, user );
                else return done( null, false );
            } );
        } catch ( err )
        {
            console.log( err );
            return done( err );
        }
    }
) );

//  admin login page
router.get( "/login", function ( req, res )
{
    if ( req.isAuthenticated() && req.user.role === 'admin' )
        res.redirect( '/admin/dashboard' );
    else
        res.render( 'admin_login.ejs' );
} );

// Handle admin login
router.post( "/login", passport.authenticate( 'admin-local', {
    successRedirect: "/admin/dashboard",
    failureRedirect: "/admin/login",
    failureFlash: true
} ) );

// admin dashboard
router.get( "/dashboard", async function ( req, res )
{
    if ( req.isAuthenticated() && req.user.role === 'admin' )
    {
        try
        {
            let bankdetails = await new Promise( function ( resolve, reject )
            {
                connection.query( 'SELECT * FROM bank', function ( err, result )
                {
                    if ( err ) reject( err );
                    else resolve( result );
                } );
            } );

            let campdetails = await new Promise( function ( resolve, reject )
            {
                connection.query( 'SELECT * FROM blood_camp', function ( err, result )
                {
                    if ( err ) reject( err );
                    else resolve( result );
                } );
            } );

            res.render( 'admin_dashboard.ejs', { bankdetails, campdetails } );
        } catch ( err )
        {
            console.error( "Database error:", err );
            res.redirect( "/admin/login" );
        }
    } else
    {
        res.redirect( "/admin/login" );
    }
} );

// admin signup page
router.get( "/signup", function ( req, res )
{
    res.render( 'admin_signup.ejs' );
} );

// Handle admin signup
router.post( "/signup", async function ( req, res )
{
    try
    {
        let { username, password } = req.body;
        password = await bcrypt.hash( password, 10 );
        let sql = "INSERT INTO admin (username, password) VALUES (?, ?)";
        connection.query( sql, [ username, password ], function ( err, result )
        {
            if ( err )
            {
                console.log( err );
                return res.redirect( "/admin/signup" );
            }
            res.redirect( '/admin/login' );
        } );
    } catch ( err )
    {
        console.log( err );
        res.redirect( "/admin/signup" );
    }
} );

// Accept blood bank
router.get( '/acceptBloodBank/:bank_id', async function ( req, res )
{
    try
    {
        let bank_id = req.params.bank_id;
        // Accept the bank
        await new Promise( ( resolve, reject ) =>
        {
            connection.query( 'UPDATE bank SET Action="accepted" WHERE bank_id=?', [ bank_id ], function ( err, result )
            {
                if ( err ) reject( err );
                else resolve( result );
            } );
        } );

        // Create bank admin  password '123'
        let password = await bcrypt.hash( '123', 10 );
        let query = await new Promise( ( resolve, reject ) =>
        {
            connection.query( 'SELECT * FROM bank WHERE bank_id = ?', [ bank_id ], function ( err, result )
            {
                if ( err ) reject( err );
                else resolve( result[ 0 ] );
            } );
        } );
        connection.query( 'INSERT INTO bank_admin (username, password, bank_id) VALUES (?, ?, ?)', [ query.Email, password, bank_id ], function ( err, result )
        {
            if ( err ) console.log( err );
        } );

        //  all blood groups
        for ( let key in bloodInventory )
        {
            connection.query( 'INSERT INTO inventory (bank_id, bloodgroup, quantity) VALUES (?, ?, ?)', [ bank_id, key, bloodInventory[ key ] ], function ( err, result )
            {
                if ( err ) console.log( err );
            } );
        }
        res.redirect( '/admin/dashboard' );
    } catch ( err )
    {
        console.log( 'error in admin accept blood bank', err );
        res.redirect( '/admin/dashboard' );
    }
} );

// Reject blood bank
router.get( '/rejectBloodBank/:bank_id', function ( req, res )
{
    try
    {
        let bank_id = req.params.bank_id;
        connection.query( 'DELETE FROM bank WHERE bank_id=?', [ bank_id ], function ( err, result )
        {
            if ( err )
            {
                console.log( err );
            }
            res.redirect( '/admin/dashboard' );
        } );
    } catch ( err )
    {
        console.log( 'error in admin reject blood bank', err );
        res.redirect( '/admin/dashboard' );
    }
} );

// Accept camp
router.get( "/acceptCamp/:camp_id", function ( req, res )
{
    try
    {
        let camp_id = req.params.camp_id;
        connection.query( 'UPDATE blood_camp SET Action="accepted" WHERE camp_id=?', [ camp_id ], function ( err, result )
        {
            if ( err )
            {
                console.log( err );
            }
            res.redirect( '/admin/dashboard' );
        } );
    } catch ( err )
    {
        console.log( 'error in admin accept blood camp', err );
        res.redirect( '/admin/dashboard' );
    }
} );

// Reject camp
router.get( '/rejectCamp/:camp_id', function ( req, res )
{
    try
    {
        let camp_id = req.params.camp_id;
        connection.query( 'DELETE FROM blood_camp WHERE camp_id=?', [ camp_id ], function ( err, result )
        {
            if ( err )
            {
                console.log( err );
            }
            res.redirect( '/admin/dashboard' );
        } );
    } catch ( err )
    {
        console.log( 'error in admin reject blood camp', err );
        res.redirect( '/admin/dashboard' );
    }
} );

// Logout
router.get( '/logout', function ( req, res )
{
    req.logout( function ( err )
    {
        if ( err ) console.log( err );
        res.redirect( '/' );
    } );
} );

module.exports = router;
