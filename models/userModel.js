const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
//name ,email,photo,password, passwordConfirm
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
    trim: true, // remove extra spaces
    minlength: [3, 'A name must have at least 3 characters'],
    maxlength: [40, 'A name must have less or equal than 40 characters'],
    validate: {
      validator: function (val) {
        // only letters (no numbers, no special chars)
        return /^[a-zA-Z\s]+$/.test(val);
      },
      message: 'Name must only contain letters and spaces',
    },
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a vaild Email'],
  },
  role: {
    type: String,
    enum: ['admin', 'guide', 'lead-guide', 'user'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please Confirm your password'],
    validate: {
      //this only works only on Create and on Save!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'password are not the same!',
    },
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  photo: {
    type: String,
    default: 'default.jpg',
  },
  passwordChangedAt: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
// Hash password only if it was modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// Update passwordChangedAt when password changes
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
//query middleware to unselect the users with active = false
userSchema.pre(/^find/, function (next) {
  //this point to query, find the query that start with find and get only users with active not equal false
  this.find({ active: { $ne: false } });
  next();
});
const User = mongoose.model('User', userSchema);

module.exports = User;
