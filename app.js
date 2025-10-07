const { protectOptional } = require('./controllers/authController');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
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

const app = express();

//set pug view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
//serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({ origin: 'http://localhost:8000' }));
//security HTTP HEADERS
app.use(helmet());
//Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
});
app.use('/api', limiter);
//Body Parser, reading data from body into req.body
//parser will understand that if request is larger than 10kb it will block it
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
//pug route
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
//Global Error handlig Middleware
app.use(globalErrorHandler);

module.exports = app;
