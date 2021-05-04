const Campground = require('../models/campground');
const { cloudinary } = require('../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapboxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapboxToken });

// MVC framework to help route file be more concise

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res) => {
    const geodata = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send(); // TODO: create error handling if can't find location?
    const newCampground = new Campground(req.body.campground);
    newCampground.geometry = geodata.body.features[0].geometry;
    newCampground.images = req.files.map(f => ({ url: f.path, filename: f.filename })); // add link(s) to cloudinary images
    newCampground.author = req.user._id;
    await newCampground.save();
    req.flash('success', 'Successfully added a new campground!');
    res.redirect(`/campgrounds/${newCampground._id}`);
}

module.exports.showCampground = async (req, res) => {
    const { id } = req.params;
    // need to populate author, reviews, and each review's author
    const campground = await Campground.findById(id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!campground) {
        req.flash('error', 'Sorry, campground not found');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}

module.exports.renderEditForm = async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    if (!campground) {
        req.flash('error', 'Sorry, campground not found');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    const { deleteImages } = req.body;
    const geodata = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send(); // TODO: create error handling if can't find location?
    const editedCampground = await Campground.findByIdAndUpdate(id, { ...req.body.campground }, { runValidators: true, new: true }); // not secure
    const newImgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    editedCampground.geometry = geodata.body.features[0].geometry;
    editedCampground.images.push(...newImgs);
    if (deleteImages) { // delete images selected to delete
        for (let filename of deleteImages) {
            if (filename.includes('noDelete')) {
                req.flash('error', 'PSA: you cannot delete template image from Cloudinary :)');
            } else {
                await cloudinary.uploader.destroy(filename);
            }
        }
        await editedCampground.updateOne({ $pull: { images: { filename: { $in: deleteImages } } } });
    }
    await editedCampground.save();
    req.flash('success', 'Successfully updated campground');
    res.redirect(`/campgrounds/${id}`)
}

module.exports.deleteCampground = async (req, res) => {
    // associated reviews and cloudinary pics deleted in /models/campgrounds.js middleware
    const deletedCampground = await Campground.findByIdAndDelete(req.params.id);
    req.flash('success', 'Successfully removed campground');
    res.redirect('/campgrounds');
}