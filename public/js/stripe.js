import axios from 'axios';
import { showAlerts } from './alerts';

export const bookTour = async tourId => {
  try {
    // Get checkout session from your backend
    const { data } = await axios.get(
      `/api/v1/bookings/checkout-session/${tourId}`
    );

    if (data.status === 'success' && data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('Invalid checkout session response');
    }
  } catch (err) {
    const errorMessage =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong while booking. Please try again.';
    showAlerts('error', errorMessage);
  }
};
