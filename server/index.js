const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 8000;

// MongoDB connection with your MongoDB server URL
const url = 'mongodb://localhost:27017/users';

mongoose.connect(url).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB', error);
});

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Start the server
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

const { Schema } = mongoose;

const userSchema = new Schema({
    fname: String,
    lname: String,
    email: String,
    password: String,
    cpassword: String
});

const User = mongoose.model('User', userSchema);

// API to get all registered users
app.get('/api/users', (req, res) => {
    User.find().then((users) => {
        res.json(users);
    }).catch((error) => {
        console.error('Error retrieving users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    });
});

// API to register with firstName, lastName, email, password, and confirmPassword with validation
app.post('/api/register', async (req, res) => {
    try {
        const { fname, lname, email, password, cpassword } = req.body;

        // Check if the user already exists in the database
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Encrypt the passwords
        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedCPassword = await bcrypt.hash(cpassword, 10);

        // Create a new user instance
        const newUser = new User({ fname, lname, email, password: hashedPassword, cpassword: hashedCPassword });

        // Save the user to the database
        await newUser.save();

        res.status(200).json({ message: 'Registration successful' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API to login with email and password with validation
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists in the database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare the provided password with the stored hashed password
        const emailMatch = user.email === email;
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!emailMatch || !passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Successful login
        res.status(200).json({ message: 'Login successful', userDetails: req.body });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/currentuser', (req, res) => {
    try {
        const { email } = req.query;
        console.log('Received email:', email);

        // Find the user by email in the database
        User.findOne({ email }).then((user) => {
            if (!user) {
                console.log('User not found');
                return res.status(404).json({ message: 'User not found' });
            }
            // Return the user details
            console.log('User details:', user);
            res.status(200).json({ userDetails: user });
        }).catch((error) => {
            console.error('Error retrieving user:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});