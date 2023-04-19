const express = require('express');
const router = express.Router();

router.get('/login', (req, res) => { //http://localhost:2002/login
    res.render('index');
})



module.exports = router;