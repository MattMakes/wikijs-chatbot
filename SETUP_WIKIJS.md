# Setting Up Wiki.js

This document explains how to set up Wiki.js alongside the chatbot.

## Option 1: Clone Wiki.js (Recommended for Development)

```bash
# From the project root
git clone https://github.com/requarks/wiki.git wikijs
cd wikijs
npm install
```

Then follow the [Wiki.js installation guide](https://docs.requarks.io/install).

## Option 2: Use Existing Wiki.js Installation

If you already have Wiki.js installed elsewhere, you just need to:

1. Connect the chatbot backend to the same database as your Wiki.js instance
2. Copy the chatbot frontend component to your Wiki.js installation
3. Integrate the component into your Wiki.js theme

## Important Notes

- The `wikijs/` directory is not tracked in this repository
- The chatbot can work with any Wiki.js installation as long as it shares the same PostgreSQL database
- For production, you typically want to keep Wiki.js and the chatbot as separate services

## Database Connection

The chatbot needs access to the same PostgreSQL database that Wiki.js uses. Configure this in `chatbot/backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wiki
DB_USER=wikijs
DB_PASSWORD=your_password
```

These should match your Wiki.js database configuration.
