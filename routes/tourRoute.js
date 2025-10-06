const express = require('express');
const tourControllers = require('./../controllers/tourController.js');
const authController = require('./../controllers/authController.js');
const reviewRouter = require('./../routes/reviewRoute.js');
const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheap').get(tourControllers.top5Cheap); // Direct controller call

router.route('/tour-stats').get(tourControllers.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourControllers.getMonthlyPlan
  );
//center point where you lived-> coordiantes of the place where you are
//:unit : either Killos or miles
//tours-within:/255/center/-40,45/kms
router
  .route('/tours-within/:distance/center/:latlng/:unit')
  .get(tourControllers.getToursWithin);
//also we could do it with this way
//tours-distance?distance=233,center=40,45&unit=mi

router.route('/distances/:latlng/unit/:unit').get(tourControllers.getDistances);
router
  .route('/')
  .get(tourControllers.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.createTour
  );
router
  .route('/:id')
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.uploadTourImages,
    tourControllers.resizeTourImages,
    tourControllers.updateTour
  )
  .get(tourControllers.getTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.deleteTour
  );

//

module.exports = router;
