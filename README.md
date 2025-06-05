# BloodBank
Blood Bank Managment System 
## Features

- **Admin Panel:** Approve/reject blood banks and camps, manage users, view dashboard.
- **Blood Bank Panel:** Register, login, manage donors, update inventory, approve donations.
- **Donor Panel:** Register, login, update profile, request donations, view donation history.
- **Camp Management:** Register and search for blood donation camps.
- **Blood Inventory:** Search blood availability by location and group.
- **Authentication:** Role-based login for admin, bank, and donor.
- **Flash Messages:** User feedback for actions.
- **Responsive UI:** EJS templates and CSS for a user-friendly interface.

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MySQL (default) or PostgreSQL (Neon, PlanetScale, etc.)
- **Frontend:** EJS, HTML, CSS, JavaScript
- **Authentication:** Passport.js, bcryptjs
- **Session Management:** express-session
- **Other:** connect-flash, body-parser

###  Set Up the Database

#### For MySQL

- Create the database and tables using your MySQL client (phpMyAdmin, Workbench, etc.).
- Use the schema from the project or [see example schema below](#example-database-schema).


###  Start the Application

```sh
npm start
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Folder Structure

```
BloodBank/
├── routes/           # Express route files (admin, donor, bank, camp, availability)
├── views/            # EJS templates for all pages
├── public/           # Static files (CSS, JS, images)
├── database.js       # Database connection file
├── index.js          # Main Express app
├── .env              # Environment variables
└── package.json
```

## Example Database Schema

**Request:**
```json
{
  "name": "John Doe",
  "age": 25,
  "gender": "Male",
  "bloodgroup": "A+",
  "email": "john@example.com",
  "phone": "1234567890",
  "address": "123 Main St",
  "pin": "123456",
  "password": "password123",
  "aadhar": "123412341234",
  "father_name": "Robert Doe"
}
```
**Response:**  
Redirects to `/donor/login` on success.

---

## License

This project is for educational purposes.

---

## Credits

Developed by [Rohit Vishwakarma](https://github.com/rohitvishwakrma) and contributors MY team @M.Anil kumar, @Vinay sharma,@Praveen Araya.

## Donor Login :Authenticates donors using email and password.

## Donor Dashboard: Displays donor profile and donation history.


## Profile Update: Donors can update their personal information and password.


## Donation Request: Donors can request to donate blood to a selected bank, with checks to prevent duplicate requests.
Bank Search: Donors can search for blood banks by state and district.


## Cancel Donation Request: Donors can withdraw their donation request.


## Logout: Ends the donor session and redirects to the homepage.