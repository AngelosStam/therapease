// backend/swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TherapEase API',
            version: '1.0.0',
            description: 'Documentation for REST API of TherapEase'
        },
        servers: [
            { url: 'http://localhost:5000/api' }
        ]
    },
    apis: ['./routes/*.js'], // ← files with routes definition
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
