import axios from "axios";
import errorHandler from "./errorHandler";
import successHandler from "./successHandler";

const api = axios.create({
  baseURL: process.env.REACT_APP_API + "api/",
  //  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Access-Control-Allow-Origin": `${process.env.REACT_APP_API}`,
    "Access-control-request-methods":
      "POST, GET, DELETE, PUT, PATCH, COPY, HEAD, OPTIONS",
  },
});

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const create = async (entity, jsonData) => {
  try {
    const response = await api.post(`${entity}`, jsonData);
    return successHandler(response, {
      notifyOnSuccess: true,
      notifyOnFailed: true,
    });
  } catch (error) {
    return errorHandler(error);
  }
};

const update = async (entity, id, jsonData) => {
  try {
    const response = await api.patch(`${entity}/${id}`, jsonData);
    successHandler(response, { notifyOnSuccess: true, notifyOnFailed: true });
    return response.data;
  } catch (error) {
    return errorHandler(error);
  }
};

const read = async (entity, id = "") => {
  try {
    const response = await api.get(`${entity}/${id}`);
    successHandler(response, { notifyOnSuccess: false, notifyOnFailed: true });
    return response.data;
  } catch (error) {
    return errorHandler(error);
  }
};

const remove = async (entity, id) => {
  try {
    const response = await api.delete(`${entity}/${id}`);
    successHandler(response, { notifyOnSuccess: true, notifyOnFailed: true });
    return response.data;
  } catch (error) {
    return errorHandler(error);
  }
};

const list = async (entity, options = {}) => {
  try {
    let query = "?";
    for (const key in options) {
      query += `${key}=${options[key]}&`;
    }
    query = query.slice(0, -1);

    const response = await api.get(`${entity}${query}`);
    successHandler(response, { notifyOnSuccess: false, notifyOnFailed: true });
    return response.data;
  } catch (error) {
    return errorHandler(error);
  }
};

export const request = { create, list, read, remove, update };
