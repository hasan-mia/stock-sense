'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

let io;

const socket = (httpServer) => {
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : '*';

  io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: corsOrigin !== '*', methods: ['GET', 'POST'] },
  });

  io.use(async (client, next) => {
    try {
      if (!process.env.JWT_SECRET)
        return next(new Error('Socket authentication is not configured'));
      const authToken = client.handshake.auth?.token;
      const header = client.handshake.headers.authorization;
      const token = authToken || (header?.startsWith('Bearer ') ? header.slice(7) : null);
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(payload.id);
      if (!user) return next(new Error('Authentication required'));
      client.data.user = { id: user.id, role: user.role };
      return next();
    } catch {
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (client) => {
    client.join(`user:${client.data.user.id}`);
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO has not been initialized');
  return io;
};

const emitToUser = (userId, event, payload) => getIO().to(`user:${userId}`).emit(event, payload);

const closeSocket = () =>
  new Promise((resolve) => {
    if (!io) return resolve();
    const activeIO = io;
    io = undefined;
    return activeIO.close(() => resolve());
  });

module.exports = { socket, getIO, emitToUser, closeSocket };
