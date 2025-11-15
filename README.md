# Wiki.js Chatbot

An intelligent AI-powered chatbot for Wiki.js that allows users to ask questions about your wiki content and receive accurate, contextual answers using OpenAI's GPT models and RAG (Retrieval-Augmented Generation).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991.svg)

## 🌟 Features

- **🔍 Semantic Search**: Uses OpenAI embeddings for intelligent, context-aware content discovery
- **💬 Conversational AI**: Natural language Q&A powered by GPT-4
- **📚 Source Citations**: Always references the wiki pages used to generate answers
- **🎨 Beautiful UI**: Modern Vue.js chat interface that integrates seamlessly with Wiki.js
- **⚡ Real-time Responses**: Fast, streaming-ready architecture
- **🔄 Auto-Indexing**: Automatically processes new and modified wiki pages
- **📊 Chat History**: Maintains conversation context and history
- **🐳 Docker Support**: Easy deployment with Docker Compose
- **🔐 Secure**: Integrates with Wiki.js authentication

## 📋 Table of Contents

- [Demo](#demo)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🎬 Demo

The chatbot provides a floating chat interface that appears in the corner of your Wiki.js pages:

```
User: "How do I deploy the application?"

Bot: "Based on the Deployment Guide, you can deploy the application using Docker or
     manually. Here are the steps:

     1. Build the Docker image
     2. Configure environment variables
     3. Run docker-compose up

     For detailed instructions, see the complete guide.

     Sources: Deployment Guide, Docker Configuration"
```

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐
│   Wiki.js UI    │
│  (Vue.js + Vue) │
│                 │
│  ┌───────────┐  │
│  │  ChatBot  │  │  ← Vue Component
│  │ Component │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
         │ HTTP/REST
         │
    ┌────▼─────────────────┐
    │  Chatbot API Server  │
    │    (Express.js)      │
    │                      │
    │  ┌────────────────┐  │
    │  │  Chat Service  │  │  ← RAG Implementation
    │  │   (OpenAI)     │  │
    │  └────────────────┘  │
    │                      │
    │  ┌────────────────┐  │
    │  │    Indexer     │  │  ← Content Processing
    │  │  (Embeddings)  │  │
    │  └────────────────┘  │
    └──────────┬───────────┘
               │
               │
    ┌──────────▼───────────┐
    │    PostgreSQL        │
    │   + pgvector         │
    │                      │
    │  ├─ pages            │  ← Wiki.js data
    │  ├─ page_embeddings  │  ← Vector embeddings
    │  ├─ chat_sessions    │  ← Conversations
    │  └─ chat_messages    │  ← Message history
    └──────────────────────┘
```

### Components

1. **Frontend (Vue.js)**
   - ChatBot.vue: Interactive chat interface
   - Integrates with Wiki.js theme
   - Real-time message handling

2. **Backend (Node.js/Express)**
   - REST API for chat interactions
   - RAG implementation with OpenAI
   - Content indexing and embedding generation
   - Vector similarity search

3. **Database (PostgreSQL + pgvector)**
   - Stores wiki pages (Wiki.js)
   - Vector embeddings for semantic search
   - Chat session and message history

## 📦 Prerequisites

- **Node.js** 14+ and npm
- **PostgreSQL** 12+ with pgvector extension
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **Wiki.js** instance (already installed and running)

## 🚀 Quick Start

### 1. Clone this Repository

```bash
git clone <your-repo-url>
cd wikijs-chatbot
```

### 2. Install pgvector Extension

Connect to your PostgreSQL database:

```bash
psql -U wikijs -d wiki
```

Then run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 3. Run Setup Script

```bash
cd chatbot
./setup.sh
```

### 4. Configure Environment

Edit `chatbot/backend/.env`:

```bash
cd backend
cp .env.example .env
nano .env
```

Set your configuration:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wiki
DB_USER=wikijs
DB_PASSWORD=your_database_password
```

### 5. Run Database Migrations

```bash
cd ..
psql -U wikijs -d wiki -f database/migrations/001_create_embeddings_table.sql
```

### 6. Index Your Wiki Content

```bash
cd backend
node indexer.js all
```

This will process all your wiki pages and create embeddings. This may take a few minutes depending on your content volume.

### 7. Start the Backend

```bash
npm start
```

The API will start at `http://localhost:3001`

### 8. Integrate Frontend

Copy the chatbot component to Wiki.js:

```bash
cp ../frontend/ChatBot.vue ../../wikijs/client/components/
```

Add to your Wiki.js theme (e.g., in `wikijs/client/themes/default/components/page.vue`):

```vue
<template>
  <div>
    <!-- Existing content -->

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

### 9. Build and Run Wiki.js

```bash
cd ../../wikijs
npm run build
npm start
```

## 🐳 Docker Deployment

For production deployment using Docker:

```bash
cd chatbot

# Create .env file with your settings
cp backend/.env.example backend/.env
nano backend/.env

# Start services
docker-compose up -d
```

This will start:
- PostgreSQL with pgvector
- Chatbot API server

Then index your content:

```bash
docker-compose exec chatbot-api node indexer.js all
```

## 📚 Documentation

For detailed documentation, see:

- **[Full Documentation](./chatbot/README.md)** - Complete setup guide, API reference, and troubleshooting
- **[API Reference](./chatbot/README.md#api-endpoints)** - REST API endpoints
- **[Configuration](./chatbot/README.md#configuration)** - Configuration options
- **[Troubleshooting](./chatbot/README.md#troubleshooting)** - Common issues and solutions

## 📁 Project Structure

```
wikijs-chatbot/
├── wikijs/                      # Wiki.js source code (cloned)
│   ├── client/                  # Vue.js frontend
│   ├── server/                  # Node.js backend
│   └── ...
│
├── chatbot/                     # Chatbot implementation
│   ├── backend/                 # Node.js/Express API
│   │   ├── index.js            # API server
│   │   ├── indexer.js          # Content indexing
│   │   ├── chatService.js      # RAG & chat logic
│   │   ├── db.js               # Database connection
│   │   ├── config.js           # Configuration
│   │   ├── package.json
│   │   ├── .env.example
│   │   └── Dockerfile
│   │
│   ├── frontend/               # Vue.js components
│   │   ├── ChatBot.vue         # Chat UI component
│   │   ├── chatbot-plugin.js   # Plugin wrapper
│   │   └── package.json
│   │
│   ├── database/               # Database migrations
│   │   └── migrations/
│   │       └── 001_create_embeddings_table.sql
│   │
│   ├── docker-compose.yml      # Docker configuration
│   ├── setup.sh                # Setup script
│   └── README.md               # Detailed documentation
│
└── README.md                   # This file
```

## 🔧 Configuration

### OpenAI Models

**Recommended:**
- **Embeddings**: `text-embedding-3-small` (fast, cost-effective)
- **Chat**: `gpt-4-turbo-preview` (best quality)

**Budget option:**
- **Chat**: `gpt-3.5-turbo` (faster, cheaper)

### Chunking Parameters

Adjust in `chatbot/backend/.env`:

```env
CHUNK_SIZE=1000      # Characters per chunk
CHUNK_OVERLAP=200    # Overlap between chunks
```

## 💰 Cost Estimation

For a medium-sized wiki (1000-5000 pages):

- **Initial indexing**: $1-10 (one-time)
- **Monthly updates**: $0.10-1
- **Monthly chat** (1000 queries): $10-30 with GPT-4

See [detailed cost breakdown](./chatbot/README.md#cost-estimation)

## 🔄 Keeping Content Updated

### Manual Reindexing

Index only modified pages:

```bash
cd chatbot/backend
node indexer.js modified
```

### Automatic Reindexing

Set up a cron job:

```bash
crontab -e
```

Add:

```cron
# Reindex modified pages every hour
0 * * * * cd /path/to/chatbot/backend && node indexer.js modified
```

Or use the API endpoint:

```bash
curl -X POST http://localhost:3001/api/index/update
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Wiki.js](https://js.wiki/) - The powerful wiki platform
- [OpenAI](https://openai.com/) - GPT models and embeddings
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search for PostgreSQL

## 🐛 Troubleshooting

### Common Issues

**"Database connection failed"**
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure pgvector extension is installed

**"OpenAI API error"**
- Verify API key is correct
- Check billing and quota
- Monitor rate limits during indexing

**"Frontend not loading chatbot"**
- Verify backend is running: `curl http://localhost:3001/health`
- Check CORS settings
- Review browser console for errors

See [full troubleshooting guide](./chatbot/README.md#troubleshooting)

## 📧 Support

For issues or questions:
1. Check the [documentation](./chatbot/README.md)
2. Review [troubleshooting](./chatbot/README.md#troubleshooting)
3. Open an issue in this repository

## 🗺️ Roadmap

- [ ] Vector database integration (Pinecone, Weaviate, Qdrant)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Suggested questions
- [ ] Admin configuration UI
- [ ] Response rating and feedback
- [ ] Alternative LLM support (Claude, Llama, etc.)
- [ ] Slack/Discord integration
- [ ] Export conversations

---

Made with ❤️ for the Wiki.js community
