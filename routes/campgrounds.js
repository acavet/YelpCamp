const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../cloudinary'); // don't need to specify index bc node automatically searches for that
const upload = multer({ storage });
// const upload = multer({ dest: 'uploads/' });
const campgrounds = require('../controllers/campgrounds');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, validateCampground, isAuthor } = require('../middleware');


// CRUD and routes, using MVC (model view controller) framework

router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground));
//^ this middleware order kind of not ideal 

router.get('/new', isLoggedIn, campgrounds.renderNewForm);

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));



// // OUTDATED ROUTING, KEEPING FOR REFERENCE 
// router.get('/', catchAsync(campgrounds.index));
// // create
// router.get('/new', isLoggedIn, campgrounds.renderNewForm);
// router.post('/', isLoggedIn, validateCampground, catchAsync(campgrounds.createCampground));
// // read
// router.get('/:id', catchAsync(campgrounds.showCampground));
// // edit
// router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));
// router.put('/:id', isLoggedIn, isAuthor, validateCampground, catchAsync(campgrounds.updateCampground));
// // delete
// router.delete('/:id', isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

module.exports = router;