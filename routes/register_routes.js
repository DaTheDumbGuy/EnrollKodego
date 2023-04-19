const express = require('express');
const router = express.Router();
const session = require('express-session');

router.get('/', (req, res) => {
    res.render('main');
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.use(session({
    secret: "some secret",
    cookie: { maxAge: 30000 },
    saveUninitialized: false,
    resave: false
}));



module.exports = router;
