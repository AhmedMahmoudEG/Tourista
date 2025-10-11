const stripe = require('stripe')(process.env.STRIPE_SECRETKEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) return next(new AppError('Tour not found', 404));

  // Determine image URL (Cloudinary or local)
  const imageUrl = tour.imageCover.startsWith('http')
    ? tour.imageCover
    : `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`;

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'hosted',
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    line_items: [
      {
        price_data: {
          currency: 'egp',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [imageUrl],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
  });

  res.status(200).json({
    status: 'success',
    url: session.url, // ← Important for redirect
    session,
  });
});

// Fixed webhook handler
const createBookingCheckout = async session => {
  try {
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_email })).id;

    // Get the price from line_items (not display_items)
    const price = session.amount_total / 100;

    await Booking.create({ tour, user, price });
    console.log('✅ Booking created successfully');
  } catch (error) {
    console.error('❌ Error creating booking:', error);
  }
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

exports.webHookCheckout = catchAsync(async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    console.log('✅ Checkout session completed');
    await createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
});
