# Quick Start Guide - Wiki.js Chatbot

Get your Wiki.js chatbot up and running in 10 minutes!

## Prerequisites Checklist

- [ ] Node.js 14+ installed (`node --version`)
- [ ] PostgreSQL 12+ running (`psql --version`)
- [ ] OpenAI API key ([Get one](https://platform.openai.com/api-keys))
- [ ] Wiki.js already installed and running

## Step-by-Step Setup

### 1. Install pgvector (2 minutes)

```bash
# Connect to your database
psql -U wikijs -d wiki

# Install extension
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 2. Setup Chatbot (3 minutes)

```bash
cd chatbot

# Run setup script
./setup.sh

# Configure environment
cd backend
cp .env.example .env
```

Edit `.env` file:
```env
OPENAI_API_KEY=sk-your-key-here
DB_PASSWORD=your_db_password
```

### 3. Initialize Database (1 minute)

```bash
cd ..
psql -U wikijs -d wiki -f database/migrations/001_create_embeddings_table.sql
```

### 4. Index Content (5+ minutes)

```bash
cd backend
npm install
node indexer.js all
```

**Note**: This processes all your wiki pages. Time varies based on content volume.

### 5. Start Backend (1 minute)

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║   Wiki.js Chatbot API Server          ║
║   Port: 3001                           ║
╚════════════════════════════════════════╝

Ready to serve requests!
```

### 6. Test API (Optional)

```bash
# In a new terminal
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-..."}
```

### 7. Integrate Frontend (2 minutes)

```bash
# Copy component
cd ../..
cp chatbot/frontend/ChatBot.vue wikijs/client/components/

# Edit Wiki.js theme to add chatbot
# Example: wikijs/client/themes/default/components/page.vue
```

Add to template:
```vue
<chat-bot />
```

Add to script:
```javascript
import ChatBot from '@/components/ChatBot.vue'

export default {
  components: { ChatBot }
}
```

### 8. Rebuild Wiki.js (3 minutes)

```bash
cd wikijs
npm run build
npm start
```

## Verification

Visit your Wiki.js site. You should see a floating chat button in the bottom right corner.

Click it and ask: "What content is available in this wiki?"

## Next Steps

- Set up automatic reindexing (see main README)
- Customize the chatbot prompt (edit `chatbot/backend/chatService.js`)
- Configure costs and models (see main README)
- Review full documentation in `chatbot/README.md`

## Troubleshooting

### Issue: "Database connection failed"

**Solution**:
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Verify credentials in .env match your database
```

### Issue: "OpenAI API error"

**Solution**:
- Check API key is correct
- Verify billing is set up
- Check quota limits

### Issue: "Indexing is slow"

**Solution**:
- This is normal for first run
- Expect ~1-2 seconds per page
- Subsequent updates are much faster

### Issue: "Chatbot button not showing"

**Solution**:
1. Check backend is running: `curl http://localhost:3001/health`
2. Check browser console for errors
3. Verify component is imported correctly
4. Clear browser cache and rebuild Wiki.js

## Support

Need help? Check:
1. Main [README.md](./README.md)
2. Detailed [chatbot/README.md](./chatbot/README.md)
3. Open an issue

---

**Estimated Total Time**: 15-20 minutes (including indexing)
