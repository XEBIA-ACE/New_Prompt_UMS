'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const healthRouter = require('./adapters/http/routes/health.routes');
const authRouter = require('./adapters/http/routes/auth.routes');
const userRouter = require('./adapters/http/routes/user.routes');
const errorHandler = require('./adapters/http/middleware/errorHandler');
const notFound = require('./adapters/http/middleware/notFound');

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Routes
app.use('/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
