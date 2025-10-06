import axios from 'axios';
import { showAlerts } from './alerts';

export const resetPassword = async (token, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/resetPassword/${token}`,
      data: {
        password,
        passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      showAlerts(
        'success',
        'Password reset successfully! You are now logged in.'
      );
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlerts(
      'error',
      err.response.data.message || 'Error resetting password!'
    );
  }
};
