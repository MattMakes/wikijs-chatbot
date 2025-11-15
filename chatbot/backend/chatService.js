const OpenAI = require('openai');
const db = require('./db');
const config = require('./config');
const { generateEmbedding } = require('./indexer');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search for relevant content chunks
 */
async function searchRelevantChunks(query, limit = 5) {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Get all embeddings from database
  const embeddings = await db('page_embeddings')
    .select(
      'page_embeddings.id',
      'page_embeddings.page_id',
      'page_embeddings.content',
      'page_embeddings.embedding',
      'pages.title',
      'pages.path',
      'pages.description'
    )
    .join('pages', 'page_embeddings.page_id', 'pages.id')
    .where('pages.isPublished', true);

  // Calculate similarity scores
  const results = embeddings.map(embedding => {
    const embeddingVector = JSON.parse(embedding.embedding);
    const similarity = cosineSimilarity(queryEmbedding, embeddingVector);

    return {
      id: embedding.id,
      pageId: embedding.page_id,
      title: embedding.title,
      path: embedding.path,
      description: embedding.description,
      content: embedding.content,
      similarity
    };
  });

  // Sort by similarity and return top results
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, limit);
}

/**
 * Create a new chat session
 */
async function createChatSession(userId = null) {
  const sessionId = uuidv4();

  await db('chat_sessions').insert({
    id: sessionId,
    user_id: userId
  });

  return sessionId;
}

/**
 * Save a chat message
 */
async function saveChatMessage(sessionId, role, content, sources = null) {
  await db('chat_messages').insert({
    session_id: sessionId,
    role,
    content,
    sources: sources ? JSON.stringify(sources) : null
  });

  // Update session last message time
  await db('chat_sessions')
    .where('id', sessionId)
    .update({
      last_message_at: db.fn.now()
    });
}

/**
 * Get chat history for a session
 */
async function getChatHistory(sessionId, limit = 10) {
  const messages = await db('chat_messages')
    .select('role', 'content', 'sources', 'created_at')
    .where('session_id', sessionId)
    .orderBy('created_at', 'desc')
    .limit(limit);

  return messages.reverse().map(msg => ({
    role: msg.role,
    content: msg.content,
    sources: msg.sources ? JSON.parse(msg.sources) : null,
    createdAt: msg.created_at
  }));
}

/**
 * Generate chat response using RAG
 */
async function generateChatResponse(sessionId, userMessage) {
  // Save user message
  await saveChatMessage(sessionId, 'user', userMessage);

  // Search for relevant content
  const relevantChunks = await searchRelevantChunks(userMessage, 5);

  // Build context from relevant chunks
  const context = relevantChunks
    .map((chunk, idx) => `[${idx + 1}] From "${chunk.title}":\n${chunk.content}`)
    .join('\n\n---\n\n');

  // Get chat history
  const history = await getChatHistory(sessionId, 5);

  // Build messages for OpenAI
  const messages = [
    {
      role: 'system',
      content: `You are a helpful assistant that answers questions based on a Wiki knowledge base.

Use the following context from the wiki to answer the user's question. If the answer cannot be found in the context, say so clearly. Always cite which document(s) your answer comes from.

CONTEXT:
${context}

When answering:
1. Be concise and accurate
2. Reference the relevant documents by their titles
3. If the information isn't in the context, be honest about it
4. Format your responses in markdown for better readability`
    }
  ];

  // Add conversation history (excluding sources for brevity)
  for (const msg of history.slice(-5)) {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage
  });

  // Generate response
  const completion = await openai.chat.completions.create({
    model: config.openai.model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 1000
  });

  const assistantMessage = completion.choices[0].message.content;

  // Prepare sources
  const sources = relevantChunks.map(chunk => ({
    title: chunk.title,
    path: chunk.path,
    description: chunk.description,
    similarity: chunk.similarity
  }));

  // Save assistant message
  await saveChatMessage(sessionId, 'assistant', assistantMessage, sources);

  return {
    message: assistantMessage,
    sources
  };
}

module.exports = {
  searchRelevantChunks,
  createChatSession,
  getChatHistory,
  generateChatResponse,
  saveChatMessage
};
