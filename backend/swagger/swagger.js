/**
 * swagger/swagger.js
 * Serves Swagger UI using the static swagger.json spec.
 */

const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');

const specPath = path.join(__dirname, 'swagger.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

module.exports = {
    serve: swaggerUi.serve,
    setup: swaggerUi.setup,
    spec,
};
