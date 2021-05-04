// seed imports
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const path = require('path');
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
    console.log('Dotenv connected');
}
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapboxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapboxToken });

// connect mongoose and models
const mongoose = require('mongoose');
const Campground = require('../models/campground');
mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

// make a bunch of fake campsites to start
const sample = array => array[Math.floor(Math.random() * array.length)];
const seedDB = async () => {
    await Campground.deleteMany({}); // delete everything
    for (let i = 0; i < 100; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const location = `${cities[random1000].city}, ${cities[random1000].state}`;
        const geometry = {
            type: 'Point',
            coordinates: [
                cities[random1000].longitude,
                cities[random1000].latitude
            ]
        };
        const price = Math.floor(Math.random() * 30) + 10;
        const camp = new Campground({
            author: '6084ba919afce84ddcade3a7', // user id from user in database, might need to change 
            title: `${sample(descriptors)} ${sample(places)}`,
            location: location,
            geometry: geometry,
            price: price,
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas luctus volutpat ipsum eu ultrices. Nulla ac est aliquet diam eleifend ornare. Ut rhoncus dui non pharetra ultricies. ',
            images: [
                {
                    url: 'https://res.cloudinary.com/dunwerlt4/image/upload/v1619568241/YelpCamp/Default/camping-in-yosemite-woods-523679818-57a1012e3df78c3276e958ab_zrvect.jpg',
                    filename: 'noDelete0' // these are default images so will not be allowing delete
                },
                {
                    url: 'https://res.cloudinary.com/dunwerlt4/image/upload/v1619568237/YelpCamp/Default/3D2_DD_6852694_3486087467_4-700x541_o4gtdi.jpg',
                    filename: 'noDelete1'
                }
            ]
        })
        await camp.save();
    }
}
seedDB().then(() => {
    console.log('ALL DONE!!!');
    mongoose.connection.close(); // since seedDB is async function this works to close connection
})