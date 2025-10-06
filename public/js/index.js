/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { signup } from './signup';
import { updateSettings } from './updateSettings';
import { resetPassword } from './resetPassword';
import { forgotPassword } from './forgetPassword';
import { bookTour } from './stripe';
// DOM Elements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const signUpBtn = document.querySelector('.form--signup');
const updateSettingsForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const forgotForm = document.getElementById('forgotPasswordForm');
const bookBtn = document.getElementById(`book-tour`);
// Wait for DOM to be fully loaded including CSS
document.addEventListener('DOMContentLoaded', function () {
  // Map initialization - wait a bit longer for CSS to fully load
  if (mapBox) {
    try {
      const locations = JSON.parse(mapBox.dataset.locations);

      // Ensure the map container is visible and has dimensions
      if (locations && locations.length > 0) {
        // Wait for CSS to be applied
        setTimeout(() => {
          displayMap(locations);
        }, 300);
      } else {
        console.warn('No locations data found');
      }
    } catch (error) {
      console.error('Error parsing locations data:', error);
    }
  }

  // Login form handling
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault(); // stop page refresh
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      login(email, password);
    });
  }

  // Logout button handling
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Signup form handling
  if (signUpBtn) {
    signUpBtn.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;
      const photo = document.getElementById('photo').files[0];

      signup(name, email, password, passwordConfirm, photo);
    });
  }
});

// Also handle the case where DOMContentLoaded has already fired
if (document.readyState === 'loading') {
  // Document is still loading, wait for DOMContentLoaded
} else {
  // Document has already loaded, execute immediately
  if (mapBox) {
    try {
      const locations = JSON.parse(mapBox.dataset.locations);
      console.log('Locations data (immediate):', locations);

      if (locations && locations.length > 0) {
        setTimeout(() => {
          displayMap(locations);
        }, 300);
      }
    } catch (error) {
      console.error('Error parsing locations data (immediate):', error);
    }
  }
}
if (updateSettingsForm) {
  updateSettingsForm.addEventListener('submit', async e => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    document.querySelector('.btn--save-data').textContent = 'Updating...';

    await updateSettings(form, 'data');
    document.querySelector('.btn--save-data').textContent = 'Save settings';
  });
}

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save--password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );
    document.querySelector('.btn--save--password').textContent =
      'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

// --- Forgot Password Form

if (forgotForm) {
  forgotForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    forgotPassword(email);
  });
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();

    const token = resetPasswordForm.dataset.token;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    resetPassword(token, password, passwordConfirm);
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing....';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}
