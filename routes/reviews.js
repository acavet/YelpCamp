const express = require('express');
const router = express.Router({ mergeParams: true }); // need mergeParams to get campground ids

const reviews = require('../controllers/reviews');
const catchAsync = require('../utils/catchAsync');
// const ExpressError = require('../utils/ExpressError');
const { isLoggedIn, validateReview, isReviewAuthor } = require('../middleware');


// routes

router.post('/', validateReview, isLoggedIn, catchAsync(reviews.createReview));

router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview));

module.exports = router;