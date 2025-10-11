const { protectOptional } = require('./controllers/authController');
const path = require('path');
const express = require('express');

const rateLimit = require('express-rate-limit');
const globalErrorHandler = require('./controllers/errorController.js');
const tourRouter = require('./routes/tourRoute.js');
const userRouter = require('./routes/userRoute.js');
const review = require('./routes/reviewRoute.js');
const viewRouter = require('./routes/viewRoute.js');
const AppError = require('./utils/appError.js');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const bookingRouter = require('./routes/bookingRoute.js');
const bookingController = require('./controllers/bookingController.js');

const app = express();
app.enable('trust proxy');
app.set('trust proxy', 1);
//set pug view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
app.use(cors({ origin: 'http://localhost:8000' }));
app.options('*', cors());

//serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'script-src': [
        "'self'",
        'https://js.stripe.com/',
        'https://api.mapbox.com/',
        "'unsafe-inline'",
      ],
      'connect-src': [
        "'self'",
        'ws://localhost:*',
        'http://127.0.0.1:*',
        'wss://*.tiles.mapbox.com',
        'https://*.tiles.mapbox.com',
        'https://api.mapbox.com',
        'https://events.mapbox.com',
        'https://*.stripe.com',
      ],
      'frame-src': ["'self'", 'https://js.stripe.com/'],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://*.mapbox.com',
        'https://*.tile.openstreetmap.org',
        'https://res.cloudinary.com', // ← ADD THIS LINE
      ],
      'worker-src': ["'self'", 'blob:'],
      'child-src': ["'self'", 'blob:'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://api.mapbox.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
    },
  })
);

//Development Logging
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

//limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

//we need the body of this request to come in not a JSON form, in stream
app.use(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webHookCheckout
);

//Body Parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  })
);
app.use(cookieParser());

//Data Sanitaztion Against NoSQL query injection
app.use(mongoSanitize());

// Data Sanitaztion against XSS
app.use(xss());

//prevent parameter pollution and whitelist some parameters
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2) ROUTES
app.use(protectOptional);
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', review);
app.use('/api/v1/bookings', bookingRouter);

//Error Handler for unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`cannot find ${req.originalUrl} on this server!`, 404));
});

//Global Error handling Middleware
app.use(globalErrorHandler);

module.exports = app;
