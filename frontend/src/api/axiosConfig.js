import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const axiosInstance = axios.create({
  baseURL: Capacitor.isNativePlatform() ? 'http://10.0.2.2:8080' : 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;