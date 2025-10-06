const mongoose = require('mongoose');
const Tour = require('./tourModel');
const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'Review cannot be empty'] },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must be belong to a tour !'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must be belong to a user!'],
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);
//create compund index on tourid, userid to make the user create only one review
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});
//create mongoose static function that storing stats for average rating and the number of ratings on each tour
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  //presist it inside Tour model schema
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // handle case when all reviews are deleted → reset to default values
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: 0,
      ratingsAverage: 4.5, // or your default
    });
  }
};

// update stats after save
reviewSchema.post('save', function () {
  //this point to constructor of the model
  //this points to current review
  this.constructor.calcAverageRatings(this.tour);
});

// بعد update أو delete → doc بيرجع هنا
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.tour);
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
