/* eslint-disable */
import axios from 'axios';
import { showAlerts } from './alerts';

export const login = async (email, password) => {
  try {
    const result = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if ((result.data.status = 'success')) {
      showAlerts('success', 'Logged in Successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlerts('error', error.response.data.message);
  }
};

export const logout = async () => {
  try {
    const result = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout',
    });
    if (result.data.status === 'success') location.assign('/');
  } catch (error) {
    showAlerts('error', 'Error logging out! Try again!');
  }
};
