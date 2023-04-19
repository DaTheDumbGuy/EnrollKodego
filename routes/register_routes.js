const express = require('express');
const router = express.Router();
const session = require('express-session');
const store = new session.MemoryStore();

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

router.post('/test', (req, res) => {
    console.log(store.sessionID);
    console.log(req.sessionID);
    const { username, password } = req.body;
    if (username && password) {
        if (req.session.authenticated) {
            res.json(req.session);
        } else {
            if (password == '123') {
                req.session.authenticated = true;
                req.session.user = {
                    username, password
                };
            } else {
                res.status(403).json({ msg: "Bad Credetials" })
            }
        }
    } else {
        res.status(403).json({ msg: "Bad Credetials" })
    }
    res.sendStatus(200);
});

module.exports = router;
