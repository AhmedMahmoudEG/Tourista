// public/js/forgotPassword.js
import axios from 'axios';
import { showAlerts } from './alerts';

export const forgotPassword = async email => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/forgetPassword',
      data: { email },
    });

    if (res.data.status === 'success') {
      showAlerts('sucess', '✅ Reset link sent to your email!');
    }
  } catch (err) {
    showAlerts(
      'error',
      err.response?.data?.message || '❌ Error sending reset link!'
    );
  }
};
