import axios from "axios";
import { API_ENDPOINTS } from "../../core/api/api.constants";

export const signup = async (data) => {
  try {
    const { data: responseData } = await axios.post(API_ENDPOINTS.SIGNUP, data);
    return responseData;
  } catch (error) {
    throw error;
  }
};







