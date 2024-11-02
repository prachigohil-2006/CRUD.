const express = require('express');
const router = express.Router(); // Make sure to initialize the router
const User = require('../models/users');
const multer = require('multer');
const fs = require('fs');

// Image storage configuration
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});
var upload = multer({
    storage: storage,
}).single('image');

// Insert a user into the database route 
router.post('/add', upload, async (req, res) => {
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            req.session.message = {
                type: 'danger',
                message: 'User already exists with this email!'
            };
            return res.redirect('/add'); // Redirect back to the add user page
        }

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file.filename,
        });

        await user.save();
        req.session.message = {
            type: 'success',
            message: 'User added successfully'
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});

// Get all users route
router.get('/', async (req, res) => {
    try {
        const users = await User.find().exec();
        res.render('index', {
            title: 'HomePage',
            users: users,
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});

// Render the add user page
router.get('/add', (req, res) => {
    res.render('add_users', { title: 'Add User' });
});

 
// edit a user route 
router.get('/edit/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.redirect('/'); // Redirect if user is not found
        }
        res.render('edit_users', {
            title: "Edit User",
            user: user,
        });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.redirect('/'); // Redirect on error
    }
});



// Update user route
router.post('/update/:id', upload, async (req, res) => {
    let id = req.params.id;
    let new_image = "";

    if (req.file) {
        new_image = req.file.filename; // Get the new image filename
        // Attempt to delete the old image if it exists
        try {
            fs.unlinkSync(`./uploads/${req.body.old_image}`);
        } catch (err) {
            console.log(err); // Log any errors during file deletion
        }
    } else {
        new_image = req.body.old_image; // Retain the old image if no new file is uploaded
    }

    try {
        // Use findByIdAndUpdate without a callback
        await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        });

        // Set success message in session
        req.session.message = {
            type: "success",
            message: "User updated successfully!",
        };
        res.redirect('/'); // Redirect after successful update
    } catch (err) {
        res.json({ message: err.message, type: "danger" }); // Handle any errors
    }
});


// Delete user
router.get('/delete/:id', async (req, res) => {
    const id = req.params.id;

    try {
        // Use findByIdAndDelete instead of findByIdAndRemove
        const result = await User.findByIdAndDelete(id);

        // Check if a user was found
        if (!result) {
            req.session.message = {
                type: "danger",
                message: "User not found!"
            };
            return res.redirect('/'); // Redirect back if user not found
        }

        // Delete the image file if it exists
        if (result.image) {
            const filePath = `./uploads/${result.image}`; // Use a relative path
            try {
                fs.unlinkSync(filePath); // Delete the file
            } catch (err) {
                console.error("Error deleting file:", err); // Log any error during file deletion
            }
        }

        req.session.message = {
            type: "info",
            message: "User has been deleted successfully!",
        };
        res.redirect('/'); // Redirect to home after deletion
    } catch (err) {
        res.json({ message: err.message }); // Handle any other errors
    }
});


module.exports = router; // Make sure to export the router
