// src/api/axios.ts
import axios, { type AxiosRequestConfig } from "axios";

const baseURL = "https://digital-twilight.ru";

const axiosInstance = axios.create({
  baseURL,
  withCredentials: false,
});

// interceptors
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const customAxios = <T>(config: AxiosRequestConfig): Promise<T> => {
  return axiosInstance(config).then((res) => res.data);
};
