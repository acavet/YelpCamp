if (process.env.NODE_ENV !== "production") {
    require('dotenv').config({ path: __dirname + '/.env' });
    console.log(__dirname + '/.env')
    console.log('Dotenv connected');
    // if we are in development require .env file, but not in production
}

// imports
const express = require('express');
const ejsMate = require('ejs-mate'); // one of many possible engines, lets you do boilerplate layout
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const MongoDBStore = require('connect-mongo');

const ExpressError = require('./utils/ExpressError');
const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const User = require('./models/user');


// connect mongoose and models 
// const dbUrl = 'mongodb://localhost:27017/yelp-camp'; // development 
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'; // production
mongoose.connect(dbUrl,
    {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    }
);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
    console.log('Database connected')
});

// express app
const app = express();


// set up public directory for static scripts, content, etc
app.use(express.static(path.join(__dirname, 'public')));

// ejs views
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// more middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(mongoSanitize()); // sanitize to avoid mongo injection

// helmet configuration
app.use(helmet({ contentSecurityPolicy: false })); // general security middleware
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://kit-free.fontawesome.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`, // matches cloudinary acct name!!!
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

// sessions
const secret = process.env.SECRET || 'terriblesecret';
const store = new MongoDBStore({ // so session data will be stored in db
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60 // eliminiating unnecessary session resaves every time user refreshes page (in sec)
});
store.on('error', function (e) {
    console.log('Session store error!')
})
const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, // for security
        // secure:true, // also for security but only when deployed bc localhost not https
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // expires in a week, in milliseconds
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));

// passport auth
app.use(passport.initialize());
app.use(passport.session()); // must be after session configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// flash
app.use(flash());


app.use((req, res, next) => {
    res.locals.currentUser = req.user; // so have access to current user in all templates
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    return next();
});


// routes


app.get('/fakeUser', async (req, res) => {
    const user = new User({ email: 'a@gm.com', username: 'a' });
    const registeredUser = await User.register(user, 'pass'); // pass in user and password
    res.send(registeredUser);
});

app.get('/', (req, res) => {
    res.render('home');
});

app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);
app.use('/users', userRoutes);


// 404 if doesn't fit any other route
app.all('*', (req, res, next) => {
    return next(new ExpressError('Page not found!', 404))
});


// error handling middleware
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something went wrong!';
    res.status(statusCode).render('error', { err });
});


// served on heroku port or 3000 for local development
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});