const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "India Village Geographical Data API",
      version: "1.0.0",
      description:
        "Production-grade REST API providing standardized village-level geographical data for India.",
    },

    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },

        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },

        ApiSecretAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Secret",
        },
      },
    },

    tags: [
      {
        name: "Health",
        description: "API health checks",
      },
      {
        name: "Authentication",
        description: "B2B authentication",
      },
      {
        name: "Geography",
        description: "India geographical hierarchy",
      },
      {
        name: "Search",
        description: "Village search and autocomplete",
      },
      {
        name: "API Keys",
        description: "B2B API key management",
      },
      {
        name: "State Access",
        description: "B2B state access management",
      },
      {
        name: "Usage",
        description: "B2B API usage and analytics",
      },
      {
        name: "Admin",
        description: "Administrative operations",
      },
    ],
  },

  apis: ["./src/routes/*.js", "./src/server.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;