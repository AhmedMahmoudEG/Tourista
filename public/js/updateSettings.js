/* eslint-disable */
import axios from 'axios';
import { showAlerts } from './alerts';

//type is either password or data
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';
    const result = await axios({
      method: 'PATCH',
      url: url,
      data: data,
    });

    if (result.data.status === 'success') {
      showAlerts('success', `${type.toUpperCase()} updated successfully!`);
    }
  } catch (error) {
    showAlerts('error', error.response.data.message);
  }
};
