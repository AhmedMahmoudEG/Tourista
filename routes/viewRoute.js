const express = require('express');
const viewController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

const router = new express.Router();

// Add this middleware to ALL routes to check for booking query params
router.use(bookingController.createUserCheckout);

router.get('/', viewController.getOverview);
router.get('/tour/:slug', viewController.getTour);
router.get('/login', viewController.getLoginForm);
router.get('/me', authController.protect, viewController.getAccount);
router.get('/signup', viewController.signupForm);
router.get('/my-tours', authController.protect, viewController.getMyTours);

//forget password route
router.get('/forgotPassword', (req, res) => {
  res.status(200).render('forgotPassword', {
    title: 'Forgot Password',
  });
});

// Render reset password page
router.get('/resetPassword/:token', (req, res) => {
  res.status(200).render('resetPassword', {
    title: 'Reset Password',
    token: req.params.token,
  });
});

module.exports = router;
