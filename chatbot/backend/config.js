require('dotenv').config();

module.exports = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'wiki',
    user: process.env.DB_USER || 'wikijs',
    password: process.env.DB_PASSWORD
  },
  server: {
    port: parseInt(process.env.PORT) || 3001,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  indexing: {
    chunkSize: parseInt(process.env.CHUNK_SIZE) || 1000,
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 200
  }
};
