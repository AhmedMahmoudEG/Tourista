/* eslint-disable */
import axios from 'axios';
import { showAlerts } from './alerts';

export const signup = async (name, email, password, passwordConfirm, photo) => {
  try {
    const form = new FormData();
    form.append('name', name);
    form.append('email', email);
    form.append('password', password);
    form.append('passwordConfirm', passwordConfirm);

    // Only append photo if user selected one
    if (photo) {
      form.append('photo', photo);
    }

    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: form,
    });
    if ((res.data.status = 'success')) {
      showAlerts('success', 'Account created Successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (error) {
    showAlerts('❌ Error:', error.response.data.message);
  }
};
