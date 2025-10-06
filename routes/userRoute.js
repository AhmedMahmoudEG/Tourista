const express = require('express');
const userControllers = require('../controllers/userController');
const authControllers = require('../controllers/authController');
const router = new express.Router();

//dest to save the photos

router.post(
  '/signup',
  userControllers.uploadUserPhoto,
  userControllers.resizeUserPhoto,
  authControllers.signup
);
router.post('/login', authControllers.login);
router.get('/logout', authControllers.logOut);
router.post('/forgetPassword', authControllers.forgetPassword);
router.patch('/resetPassword/:token', authControllers.resetPassword);

//Protect all routes after this middlewares
router.use(authControllers.protect);

router.patch('/updateMyPassword', authControllers.updatePassword);
//upload.single('fieldName')
router.patch(
  '/updateMe',
  userControllers.uploadUserPhoto,
  userControllers.resizeUserPhoto,
  userControllers.updateMe
);
router.delete('/deleteMe', userControllers.deleteMe);
//get me endpoint
router.get('/me', userControllers.getMe, userControllers.getUser);

//restrict these endpoint only to admin
router.use(authControllers.restrictTo('admin'));
router
  .route('/')
  .get(userControllers.getAllUsers)
  .post(userControllers.createUser);
router
  .route('/:id')
  .get(userControllers.getUser)
  .patch(userControllers.updateUser)
  .delete(userControllers.deleteUser);

module.exports = router;
