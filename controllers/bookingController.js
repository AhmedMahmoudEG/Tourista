const stripe = require('stripe')(process.env.STRIPE_SECRETKEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.tourId);
    if (!tour) return next(new AppError('Tour not found', 404));

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'hosted',
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
      success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      line_items: [
        {
          price_data: {
            currency: 'egp',
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [`https://natours.dev/img/tours/${tour.imageCover}`],
            },
            unit_amount: tour.price * 100,
          },
          quantity: 1,
        },
      ],
    });

    res.status(200).json({
      status: 'success',
      url: session.url,
    });
  } catch (err) {
    console.error('❌ STRIPE ERROR:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});

exports.createUserCheckout = catchAsync(async (req, res, next) => {
  //temp solution
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
