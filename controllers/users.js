const User = require('../models/user');


// MVC framework to help route file be more concise

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}

module.exports.createUser = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
        });
        // await registeredUser.save(); // not necessary???
        req.flash('success', 'Welcome to YelpCamp!');
        res.redirect('/campgrounds');
    } catch (e) {
        req.flash('error', e.message); // for errors like a given username already being in use
        res.redirect('/users/register');
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.login = async (req, res) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = req.session.returnTo || '/campgrounds';
    // to get users back to the page they wanted to access
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    if (req.isAuthenticated()) {
        req.logout();
        req.flash('success', 'See you next time!');
    }
    res.redirect('/campgrounds');
}