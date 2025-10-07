const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');
//creating a schema for Tour
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'a tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'a tour must have a name less than or equal to 40 chars'],
      minLength: [10, 'a tour must have a name greater than 10 chars '],
      //validate: [validator.isAlpha, 'Tour name must only contain Chars'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'a tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'a tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'a tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy , medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be above 0 '],
      max: [5, 'rating must be below 5'],
      set: val => Math.round(val * 10) / 10,
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to current doc on new document creation
          return val < this.price;
        },
        message: `Discount price ({VALUE}) should be below regular price `,
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'it must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'it must have a cover image'],
    },
    images: [String], //array of type strings
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
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

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//virutal populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//create index on price
//tourSchema.index({ price: 1 });
//create compound index
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
//create index on start location
tourSchema.index({ startLocation: '2dsphere' });

//document middlware in mongo: runs before .save or .create
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
/*
tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
});
*/
//Query middleware
tourSchema.pre(/^find/, function (next) {
  //find here looks for current query not current doc
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  (this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  }),
    next());
});
// tourSchema.post(/^find/, function (doc, next) {
//   console.log(`Query Took ${Date.now() - this.start} ms`);
//   next();
// });

// // Aggregation middleware
// tourSchema.pre('aggregate', function (next) {
//   //removing from the output all the document that has secret = true
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });
//Creating a Tour model from tour Schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
