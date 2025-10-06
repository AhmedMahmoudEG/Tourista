const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
exports.getOverview = catchAsync(async (req, res, next) => {
  //1) get all tour data from collection
  const tours = await Tour.find();
  //2) build template

  //3) render that template using tour data from step1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //get the tour
  const slug = req.params.slug;
  const tour = await Tour.findOne({ slug: slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  if (!tour) {
    return next(new AppError('No tour found with that name', 404));
  }
  //build template

  //render it
  res.status(200).render('tour', {
    title: ` ${tour.name} tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: `Login`,
  });
};
exports.signupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Sign up',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account',
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser,
  });
});
exports.getMyTours = catchAsync(async (req, res, next) => {
  //1)find all booking
  //this contain the the bookings that belong to current user
  const bookings = await Booking.find({ user: req.user.id });
  //2) find the ids
  const tourIds = bookings.map(el => el.tour);
  //this will select all tours that have id in tourids
  const tours = await Tour.find({ _id: { $in: tourIds } });
  res.status(200).render('overview', {
    tite: 'My Tours',
    tours,
  });
});
