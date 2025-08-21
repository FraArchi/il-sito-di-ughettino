// This file is now a simple wrapper around the main app for testing purposes.
// It ensures that the real application is loaded for integration tests.
const app = require('../src/app');

module.exports = app;
