const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema; // shortcut bc we reference schema a lot
const { cloudinary } = require('../cloudinary');


const imageSchema = new Schema({
    url: String,
    filename: String
});
imageSchema.virtual('thumbnail').get(function () {
    // using virtual bc information already stored in "url", cloudinary will do resizing for us
    return this.url.replace('/upload', '/upload/w_200');
});
// imageSchema.virtual('showSize').get(function () {
//     return this.url.replace('/upload', '/upload/h_500');
// }); // TODO

const opts = { toJSON: { virtuals: true } }; // so virtuals are populated when JSON stringifying
const campgroundSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    geometry: { // geojson data
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: {
        type: Number,
        required: true
    },
    description: String,
    images: [
        imageSchema
    ],
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts);

// virtual for index campground map
campgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `<strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>`;
});


campgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        // delete associated reviews
        await Review.remove({
            _id: {
                $in: doc.reviews
            }
        })
        // delete associated pics from cloudinary
        for (let img of doc.images) { // delete all non-template files associated with campground
            if (!img.filename.includes('noDelete')) {
                await cloudinary.uploader.destroy(img.filename);
            }
        }
    }
});



module.exports = mongoose.model('Campground', campgroundSchema);