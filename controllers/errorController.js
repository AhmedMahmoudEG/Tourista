const AppError = require('../utils/appError');

const handleCastError = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
const handleDublicateFieldDB = err => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field]; // actual duplicated value
  const message = `Dupilcate Field Value: ${value}, Please Use Another Value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid Input Data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const handleJWTError = () =>
  new AppError('invalid Token, Please login again!', 401);

const handleJWTExpired = () =>
  new AppError('Your token has been Expired, Please Login again!', 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }
  //B) Error Render
  return res
    .status(err.statusCode)
    .render('error', { title: 'Something went wrong', msg: err.message });
};
const sendErrorProd = (err, req, res) => {
  //this for API
  //A) Operational, Trusted errors : send message to client
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //B) //programming or other unknown errors
    //send generic message
    console.log('Error ', err);
    return res.status(500).json({
      status: 'ERROR 💥',
      message: 'Something went wrong!',
    });
  }
  //this for rendered website
  //A) Operational, Trusted errors : send message to client
  if (err.isOperational) {
    return res
      .status(err.statusCode)
      .render('error', { title: 'Something went wrong', msg: err.message });
  }
  //1) log error
  console.log('Error ', err);
  //programming or other unkwon errors
  // 2) send genericmessage
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = err; // ✅ keep original reference
    if (error.name === 'CastError') error = handleCastError(error);
    if (error.code === 11000) error = handleDublicateFieldDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpired();
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';
    sendErrorProd(error, req, res); // ✅ now isOperational will be preserved
  }
};
