# Wiki.js Chatbot

An intelligent chatbot for Wiki.js that uses RAG (Retrieval-Augmented Generation) to answer questions about your wiki content using OpenAI's GPT models.

## Features

- **Semantic Search**: Uses OpenAI embeddings for intelligent content search
- **Contextual Answers**: Generates accurate responses based on your wiki content
- **Source Citations**: Always cites the wiki pages used to generate answers
- **Chat History**: Maintains conversation context across messages
- **Modern UI**: Beautiful Vue.js interface that integrates seamlessly with Wiki.js
- **Auto-Indexing**: Automatically indexes new and modified pages

## Architecture

### Backend (Node.js + Express)
- **Indexer**: Processes wiki pages, chunks content, and generates embeddings
- **Chat Service**: Handles semantic search and response generation using RAG
- **API Server**: RESTful API for chat interactions

### Frontend (Vue.js)
- **ChatBot Component**: Floating chat interface
- **Real-time messaging**: Immediate responses with loading indicators
- **Source display**: Shows which pages were used for each answer

### Database
- **PostgreSQL**: Stores embeddings and chat history
- **pgvector extension**: Enables efficient vector similarity search

## Prerequisites

- Node.js 14+ and npm
- PostgreSQL 12+ with pgvector extension
- OpenAI API key
- Running Wiki.js instance

## Installation

### 1. Install pgvector Extension

Connect to your PostgreSQL database and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Run Setup Script

```bash
cd chatbot
./setup.sh
```

### 3. Configure Environment

Edit `backend/.env` with your settings:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Database Configuration (same as Wiki.js)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wiki
DB_USER=wikijs
DB_PASSWORD=your_password

# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### 4. Run Database Migrations

```bash
psql -U wikijs -d wiki -f database/migrations/001_create_embeddings_table.sql
```

### 5. Index Your Content

Initial indexing of all published pages:

```bash
cd backend
node indexer.js all
```

This will:
- Read all published pages from Wiki.js
- Split content into chunks
- Generate embeddings using OpenAI
- Store in the database

**Note**: This may take some time depending on your content volume and OpenAI API limits.

### 6. Start the Backend Server

```bash
cd backend
npm start
```

The API will be available at `http://localhost:3001`

### 7. Integrate Frontend Component

#### Option A: Copy to Wiki.js Components

```bash
cp frontend/ChatBot.vue ../wikijs/client/components/
```

Then add to your Wiki.js theme template (e.g., `wikijs/client/themes/default/components/page.vue`):

```vue
<template>
  <div>
    <!-- Your existing page content -->

    <!-- Add chatbot -->
    <chat-bot />
  </div>
</template>

<script>
import ChatBot from '@/components/ChatBot.vue'

export default {
  components: {
    ChatBot
  }
}
</script>
```

#### Option B: Add as Plugin

Add to `wikijs/client/client-app.js`:

```javascript
import ChatBot from './components/ChatBot.vue'

Vue.component('ChatBot', ChatBot)
```

Then add `<chat-bot />` to any template.

### 8. Configure Frontend API URL

Set the API URL in your Wiki.js `.env` or build configuration:

```env
VUE_APP_CHATBOT_API=http://localhost:3001
```

## Usage

### Starting the Chatbot Backend

Development mode with auto-reload:
```bash
cd backend
npm run dev
```

Production mode:
```bash
cd backend
npm start
```

### Indexing Content

Index all pages:
```bash
node indexer.js all
```

Index only modified pages:
```bash
node indexer.js modified
```

### API Endpoints

#### Create Chat Session
```http
POST /api/chat/session
Content-Type: application/json

{
  "userId": 123  // optional
}

Response:
{
  "sessionId": "uuid"
}
```

#### Send Message
```http
POST /api/chat/message
Content-Type: application/json

{
  "sessionId": "uuid",
  "message": "What is the deployment process?"
}

Response:
{
  "message": "Based on the documentation...",
  "sources": [
    {
      "title": "Deployment Guide",
      "path": "operations/deployment",
      "description": "How to deploy the application",
      "similarity": 0.89
    }
  ]
}
```

#### Get Chat History
```http
GET /api/chat/history/:sessionId?limit=20

Response:
{
  "history": [
    {
      "role": "user",
      "content": "What is...",
      "createdAt": "2024-01-01T12:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Based on...",
      "sources": [...],
      "createdAt": "2024-01-01T12:00:05Z"
    }
  ]
}
```

#### Search Content
```http
POST /api/search
Content-Type: application/json

{
  "query": "deployment process",
  "limit": 5
}

Response:
{
  "results": [
    {
      "title": "Page Title",
      "path": "page/path",
      "content": "Relevant content chunk...",
      "similarity": 0.92
    }
  ]
}
```

#### Trigger Reindexing
```http
POST /api/index/update

Response:
{
  "message": "Indexing started in background"
}
```

## Automatic Reindexing

To keep your chatbot synchronized with wiki updates, set up a cron job or use Wiki.js webhooks:

### Option 1: Cron Job

```bash
# Add to crontab (every hour)
0 * * * * cd /path/to/chatbot/backend && node indexer.js modified
```

### Option 2: Wiki.js Post-Update Hook

Create a Wiki.js server-side hook that calls the reindexing endpoint after page updates.

## Configuration

### Chunking Parameters

Adjust in `backend/.env`:

```env
CHUNK_SIZE=1000          # Characters per chunk
CHUNK_OVERLAP=200        # Overlap between chunks
```

- **Larger chunks**: More context but less precise matching
- **Smaller chunks**: More precise but may miss context
- **Overlap**: Ensures important content isn't split

### OpenAI Models

**Embedding Model Options:**
- `text-embedding-3-small` - Faster, cheaper (recommended)
- `text-embedding-3-large` - Higher quality, more expensive

**Chat Model Options:**
- `gpt-4-turbo-preview` - Best quality (recommended)
- `gpt-4` - High quality
- `gpt-3.5-turbo` - Faster, cheaper

### Response Customization

Edit the system prompt in `backend/chatService.js`:

```javascript
{
  role: 'system',
  content: `You are a helpful assistant that answers questions based on a Wiki knowledge base.

  // Customize this message to fit your use case
  ...
  `
}
```

## Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check credentials in `.env`
3. Ensure database exists
4. Test connection:
   ```bash
   cd backend
   node -e "require('./db')"
   ```

### OpenAI API Errors

1. Verify API key is correct
2. Check API quota and billing
3. Monitor rate limits (especially during indexing)
4. Consider adding delays between requests

### Indexing Fails

1. Check OpenAI API key and quota
2. Reduce `CHUNK_SIZE` if hitting token limits
3. Add delays between pages:
   ```javascript
   await new Promise(resolve => setTimeout(resolve, 1000));
   ```

### Frontend Not Loading

1. Verify backend is running (`http://localhost:3001/health`)
2. Check CORS settings in `backend/config.js`
3. Update `VUE_APP_CHATBOT_API` in frontend configuration
4. Check browser console for errors

### Poor Answer Quality

1. **Increase context**: Return more chunks (increase `limit` in search)
2. **Better chunking**: Adjust `CHUNK_SIZE` and `CHUNK_OVERLAP`
3. **Improve prompts**: Customize system prompt
4. **Better model**: Use `gpt-4` instead of `gpt-3.5-turbo`
5. **Reindex**: Ensure all content is indexed properly

### Slow Responses

1. Use faster model (`gpt-3.5-turbo`)
2. Reduce number of chunks searched
3. Optimize database queries
4. Consider caching frequent questions

## Cost Estimation

### OpenAI Costs (as of 2024)

**Indexing** (one-time + updates):
- text-embedding-3-small: ~$0.02 per 1M tokens
- Example: 1000 pages × 500 words = ~$0.10-0.50

**Chat** (per conversation):
- gpt-4-turbo: ~$0.01-0.03 per response
- gpt-3.5-turbo: ~$0.001-0.003 per response

For a medium-sized wiki (1000-5000 pages):
- Initial indexing: $1-10
- Monthly updates: $0.10-1
- Monthly chat (1000 queries): $10-30

## Development

### Project Structure

```
chatbot/
├── backend/
│   ├── index.js           # API server
│   ├── indexer.js         # Content indexing
│   ├── chatService.js     # RAG implementation
│   ├── db.js              # Database connection
│   ├── config.js          # Configuration
│   └── package.json
├── frontend/
│   ├── ChatBot.vue        # Vue component
│   ├── chatbot-plugin.js  # Plugin wrapper
│   └── package.json
├── database/
│   └── migrations/
│       └── 001_create_embeddings_table.sql
├── setup.sh
└── README.md
```

### Adding Features

**Custom search filters:**
Edit `chatService.js` to filter by tags, authors, dates, etc.

**Multi-language support:**
Use different embedding models per language.

**Analytics:**
Add tracking to `chat_messages` table.

## Security Considerations

1. **API Keys**: Never commit `.env` to version control
2. **Rate Limiting**: Implement rate limiting on API endpoints
3. **Authentication**: Integrate with Wiki.js auth system
4. **Input Validation**: Sanitize user inputs
5. **CORS**: Restrict to your Wiki.js domain only

## License

MIT License - Feel free to use and modify for your needs.

## Support

For issues or questions:
1. Check this documentation
2. Review troubleshooting section
3. Check Wiki.js and OpenAI documentation
4. Open an issue in the repository

## Roadmap

- [ ] Vector database integration (Pinecone, Weaviate)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Integration with Wiki.js search
- [ ] Suggested questions
- [ ] Admin configuration UI
- [ ] Automatic webhook integration
- [ ] Response rating and feedback
- [ ] Alternative LLM support (Claude, Llama, etc.)

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.
