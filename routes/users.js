const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport');

const users = require('../controllers/users');
const catchAsync = require('../utils/catchAsync');

// routes

router.route('/register')
    .get(users.renderRegister)
    .post(catchAsync(users.createUser));

router.route('/login')
    .get(users.renderLogin)
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/users/login' }), catchAsync(users.login));

router.get('/logout', users.logout);

module.exports = router;