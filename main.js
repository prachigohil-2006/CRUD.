require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;

//database connection

mongoose.connect(process.env.DB_URI);
const db = mongoose.connection;
db.on('error', (error) => console.log(error));
db.once('open',() => console.log('connected to the database'));

//middleware
app.use(express.urlencoded({extended:false}));
app.use(express.json());

app.use(
    session({
        secret:"my secret key",
        saveUninitialized: true,
        resave : false,
    })
);
app.use((req,res,next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});
app.use(express.static('uploads'))
app.set('view engine','ejs');

//routes prefix
app.use("",require('./routes/routes'));
app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
})


