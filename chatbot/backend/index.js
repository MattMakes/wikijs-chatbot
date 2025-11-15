const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const chatService = require('./chatService');
const { indexModifiedPages } = require('./indexer');

const app = express();

// Middleware
app.use(cors({
  origin: config.server.corsOrigin
}));
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create a new chat session
app.post('/api/chat/session', async (req, res) => {
  try {
    const { userId } = req.body;
    const sessionId = await chatService.createChatSession(userId);

    res.json({ sessionId });
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
});

// Send a message and get response
app.post('/api/chat/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    const response = await chatService.generateChatResponse(sessionId, message);

    res.json(response);
  } catch (error) {
    console.error('Error generating chat response:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

// Get chat history
app.get('/api/chat/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const history = await chatService.getChatHistory(sessionId, limit);

    res.json({ history });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, limit } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const results = await chatService.searchRelevantChunks(query, limit || 5);

    res.json({ results });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Trigger reindexing of modified pages
app.post('/api/index/update', async (req, res) => {
  try {
    // Run indexing in background
    indexModifiedPages()
      .then(() => console.log('Background indexing completed'))
      .catch(err => console.error('Background indexing failed:', err));

    res.json({ message: 'Indexing started in background' });
  } catch (error) {
    console.error('Error starting indexing:', error);
    res.status(500).json({ error: 'Failed to start indexing' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Wiki.js Chatbot API Server          ║
║   Port: ${PORT}                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}              ║
╚════════════════════════════════════════╝

API Endpoints:
  POST   /api/chat/session       - Create new chat session
  POST   /api/chat/message       - Send message and get response
  GET    /api/chat/history/:id   - Get chat history
  POST   /api/search             - Search wiki content
  POST   /api/index/update       - Trigger reindexing
  GET    /health                 - Health check

Ready to serve requests!
  `);
});

module.exports = app;
