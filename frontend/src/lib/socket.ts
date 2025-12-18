import { io } from 'socket.io-client';

// Create socket instance with manual connection
export const socket = io('http://localhost:4000', {
  autoConnect: false,
  withCredentials: true,
});
