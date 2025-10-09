import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { showAlerts } from './alerts';

export const bookTour = async tourId => {
  try {
    // Get checkout session from your backend
    const { data } = await axios.get(
      `/api/v1/bookings/checkout-session/${tourId}`
    );

    // console.log('SESSION RESPONSE:', data);

    // // Load Stripe
    // const stripe = await loadStripe(
    //   'pk_test_51SEWsGERcUn98bebITEXf3o444Ut1GbTpoQNVv7UxdkORzKSVGA3367wrz8QtHy0NpUwYZyNGY5wtcLd4P6GhvpU00vMuuDXet'
    // );

    // Redirect to Stripe checkout
    if (data.status === 'success' && data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('Invalid checkout session response');
    }
  } catch (err) {
    console.error('💥 Full error object:', err);
    console.error('💥 Error response:', err.response);
    console.error('💥 Error message:', err.message);

    const errorMessage =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong while booking. Please try again.';
    showAlerts('error', errorMessage);
  }
};
