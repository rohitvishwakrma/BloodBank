const express = require( 'express' );
const router = express.Router( { mergeParams: true } );
const path = require( 'path' );
const connection = require( '../database.js' );

router.use( express.json() );
router.use( express.static( path.join( __dirname, "../public" ) ) );

let camp_details = [];

// camp registration form
router.get( "/registration", ( req, res ) =>
{
    res.render( "camp_registration.ejs" );
} );

// Handle camp registration submission
router.post( "/submition", ( req, res ) =>
{
    try
    {
        const {
            Organization_Type, Organization_Name, Organizer_Name, Organizer_Mobile_No,
            Organizer_Email_Id, Camp_Date, Camp_Name, Camp_Address, State, District,
            Start_Time, End_Time
        } = req.body;

        const sql = `
            INSERT INTO blood_camp (
                organization_type, organization_name, organizer_name, Organizer_Mobile_No,
                Organizer_Email_Id, Camp_Date, Camp_Name, Camp_Address, State, District,
                Start_Time, End_Time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            Organization_Type, Organization_Name, Organizer_Name, Organizer_Mobile_No,
            Organizer_Email_Id, Camp_Date, Camp_Name, Camp_Address, State, District,
            Start_Time, End_Time
        ];

        connection.query( sql, values, ( err, result ) =>
        {
            if ( err )
            {
                console.log( err );
                return res.redirect( "/camp/registration" );
            }
            res.redirect( "/camp/registration" );
        } );
    } catch ( err )
    {
        console.log( err );
        res.redirect( "/camp/registration" );
    }
} );

// camp search page
router.get( "/searchCamp", ( req, res ) =>
{
    res.render( "camp_search.ejs", { camp_details } );
} );

// Handle camp search
router.post( "/searchCamp/findDetails", async ( req, res ) =>
{
    const { state, district, camp_date } = req.body;
    const sql = `
        SELECT * FROM blood_camp
        WHERE state = ? AND district = ? AND camp_date = ? AND action = 'accepted'
    `;
    try
    {
        camp_details = await new Promise( ( resolve, reject ) =>
        {
            connection.query( sql, [ state, district, camp_date ], ( err, result ) =>
            {
                if ( err ) reject( err );
                else resolve( result );
            } );
        } );
    } catch ( err )
    {
        console.log( err );
        camp_details = [];
    }
    res.redirect( "/camp/searchCamp" );
} );

module.exports = router;