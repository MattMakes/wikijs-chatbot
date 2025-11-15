#!/bin/bash

echo "========================================="
echo "Wiki.js Chatbot Setup Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓${NC} Created backend/.env"
    echo -e "${YELLOW}⚠${NC}  Please edit backend/.env and add your API keys and database credentials"
    echo ""
fi

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install backend dependencies"
    exit 1
fi
cd ..

# Check if PostgreSQL is running
echo ""
echo -e "${YELLOW}Checking PostgreSQL connection...${NC}"
cd backend
node -e "require('./db')" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Database connection successful"
else
    echo -e "${RED}✗${NC} Database connection failed"
    echo -e "${YELLOW}⚠${NC}  Please check your database credentials in backend/.env"
fi
cd ..

echo ""
echo "========================================="
echo "Setup Instructions:"
echo "========================================="
echo ""
echo "1. Install pgvector extension in PostgreSQL:"
echo "   Connect to your PostgreSQL database and run:"
echo "   CREATE EXTENSION IF NOT EXISTS vector;"
echo ""
echo "2. Run database migrations:"
echo "   psql -U <username> -d <database> -f database/migrations/001_create_embeddings_table.sql"
echo ""
echo "3. Configure backend/.env with your:"
echo "   - OpenAI API key"
echo "   - Database credentials"
echo "   - Server settings"
echo ""
echo "4. Index your Wiki.js content:"
echo "   cd backend && node indexer.js all"
echo ""
echo "5. Start the chatbot backend:"
echo "   cd backend && npm start"
echo ""
echo "6. Integrate the frontend component:"
echo "   Copy chatbot/frontend/ChatBot.vue to wikijs/client/components/"
echo "   Add <ChatBot /> to your Wiki.js theme"
echo ""
echo "========================================="
echo -e "${GREEN}Setup preparation complete!${NC}"
echo "========================================="
