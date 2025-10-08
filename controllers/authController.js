const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const Email = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
//create and send token
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  //send the token via the cookie
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });
  //remove the password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
//reset the jwt
exports.logOut = (req, res) => {
  res.cookie('jwt', 'Loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};
//create new User
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    photo: req.file ? req.file.filename : undefined, // Use filename from resize middleware
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, req, res);
});

//login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please Provide email and password!', 400));
  }
  //check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password!', 401));
  }
  //if everything is okay, send token to client
  createSendToken(user, 200, req, res);
});

//protect middleware
exports.protect = catchAsync(async (req, res, next) => {
  //getting the token and check if it exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    return next(new AppError('You are not logged in, please login', 401));
  //verfication token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError('the user belonging to this token no longer exist', 401)
    );
  //check if user changed password, after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password, please log in again!', 401)
    );
  }
  //Granted Access to Protected Route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});
exports.protectOptional = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    req.user = null; // <--- no AppError here
    return next();
  }

  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);

    if (!currentUser || currentUser.changePasswordAfter(decoded.iat)) {
      req.user = null; // still no AppError
      return next();
    }

    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
});
//Only for render pages, No errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //verfication token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //check if user still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();
      //check if user changed password, after the token was issued
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }
      //there's a logged in user, then render it, but how pug could get that user ? using res.locals
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }

  next();
};

//restrict to delete a tour
exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    //roles : admin , lead-guide
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "you don't have the permission to perform this action",
          403
        )
      );
    }
    next();
  });
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError("There's no user with this email address", 404));
  // 2) generate token
  const resetToken = user.createPasswordResetToken();
  // Note: changes made in createPasswordResetToken() only live in memory,
  // not in the database. We must call save() to persist them.
  // We disable validation here because we are not updating the password
  // fields in this request, and running validators would cause errors.
  await user.save({ validateBeforeSave: false });
  // 3) built Reset URL
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    // 4) send Email
    res.status(200).json({
      status: 'success',
      message: 'Token Sent to Email!',
    });
  } catch (error) {
    // 5) reset fields if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log('Email Error', error);
    return next(
      new AppError(
        'There was an error sending the email, please try again later',
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });
  if (!user) return next(new AppError('Token is invalid or Expired!', 400));
  // 2) set the new password if token not expired and user is exist
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  // 3) update the changedpassword for the current user
  await user.save();
  // 4) log the user in (send JWT)
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2) check if password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('Your Current Password is wrong', 401));
  // 3) if so , update the user password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) log the user in send jwt
  createSendToken(user, 200, req, res);
});
