const express = require('express');
const app = express();
const port = 1500;
const path = require('path');
const env = require('dotenv');
const session = require('express-session');
const cookie_parser = require('cookie-parser');

env.config({
    path: './.env'
})

app.use(session({
    secret: 'my_secret_key', // a random string used to sign the session ID cookie
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.set('view engine', 'hbs')
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(cookie_parser());

//define the routes --- this is the middleware
app.use('/', require('./routes/register_routes'));
app.use('/auth', require('./routes/auth.js'));
app.use('/', require('./routes/login_routes'));


app.listen(port, () => {
    console.log(`Server listening on ${port}`);
})
