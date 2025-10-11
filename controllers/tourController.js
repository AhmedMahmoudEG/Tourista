const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');
const cloudinary = require('../utils/cloudinary');

//multer storage
const multerStorage = multer.memoryStorage();

//multer filter
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an Image! please upload only images', 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover && !req.files.images) return next();

  // Process cover image
  if (req.files.imageCover && req.files.imageCover[0]) {
    const coverBuffer = await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toBuffer();

    const coverResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'tourista/tours',
          public_id: `tour-${req.params.id}-${Date.now()}-cover`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(coverBuffer);
    });

    req.body.imageCover = coverResult.secure_url;
  }

  // Process other images
  if (req.files.images) {
    req.body.images = [];

    await Promise.all(
      req.files.images.map(async (file, i) => {
        const buffer = await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toBuffer();

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'tourista/tours',
              public_id: `tour-${req.params.id}-${Date.now()}-${i + 1}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(buffer);
        });

        req.body.images.push(result.secure_url);
      })
    );
  }

  next();
});
// GET all tours
exports.getAllTours = factory.getAll(Tour);
// GET a single tour
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// CREATE a tour
exports.createTour = factory.createOne(Tour);
// UPDATE a tour
exports.updateTour = factory.updateOne(Tour);
// DELETE a tour
exports.deleteTour = factory.deleteOne(Tour);

// controller for top 5 cheap
exports.top5Cheap = catchAsync(async (req, res, next) => {
  // Create the query object directly
  const queryObj = {
    limit: '5',
    sort: 'price,-ratingsAverage',
    fields: 'name,price,ratingsAverage,summary,difficulty',
  };
  // Build query with APIFeatures
  const features = new APIFeatures(Tour.find(), queryObj)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    //group stage
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      //sort by avgPrice id desc
      $sort: { avgPrice: -1 },
    },
    //   {
    //      //match with id which is difficulty that we choose before not equal 'EASY'
    //     $match: { _id: { $ne: 'EASY' } },
    //      },
  ]);
  res.status(200).json({
    status: 'sucess',
    data: {
      stats,
    },
  });
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //to convert it to a number 2021
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        //we want to group by month
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      //add Fields
      $addFields: { month: '$_id' },
    },
    {
      //to hide or show a field 0 to hide 1 to show
      $project: {
        _id: 0,
      },
    },
    {
      //sorting by number of Tour starts in asec
      $sort: { numTourStarts: -1 },
    },
  ]);
  res.status(200).json({
    status: 'sucess',
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  // '/tours-within/233/center/-34.1145,-118.2445/mi',
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  // Radius (in radians)
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng * 1, lat * 1], radius], // هنا التصحيح
      },
    },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  const distances = await Tour.aggregate([
    {
      //geonear need to be at the first stage of aggregate pipeline
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
        key: 'startLocation',
      },
    },
    {
      $project: { distance: 1, name: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
