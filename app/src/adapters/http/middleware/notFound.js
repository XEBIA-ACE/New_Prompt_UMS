'use strict';

/**
 * 404 catch-all middleware.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
}

module.exports = notFound;
