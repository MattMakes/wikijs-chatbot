const OpenAI = require('openai');
const db = require('./db');
const config = require('./config');

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

/**
 * Split text into chunks with overlap
 */
function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Clean and prepare content for embedding
 */
function cleanContent(content) {
  // Remove excessive whitespace
  let cleaned = content.replace(/\s+/g, ' ').trim();

  // Remove markdown formatting while preserving content
  cleaned = cleaned
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
    .replace(/[#*_`~]/g, '') // Remove markdown syntax
    .replace(/<[^>]+>/g, ''); // Remove HTML tags

  return cleaned;
}

/**
 * Generate embedding for text
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: config.openai.embeddingModel,
      input: text
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

/**
 * Index a single page
 */
async function indexPage(page) {
  console.log(`Indexing page: ${page.title} (ID: ${page.id})`);

  // Clean and prepare content
  const content = cleanContent(page.content || '');
  const fullText = `${page.title}\n\n${page.description || ''}\n\n${content}`;

  // Split into chunks
  const chunks = chunkText(fullText, config.indexing.chunkSize, config.indexing.chunkOverlap);

  // Delete existing embeddings for this page
  await db('page_embeddings').where('page_id', page.id).del();

  // Generate and store embeddings for each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    if (chunk.trim().length === 0) continue;

    console.log(`  Processing chunk ${i + 1}/${chunks.length}...`);

    const embedding = await generateEmbedding(chunk);

    await db('page_embeddings').insert({
      page_id: page.id,
      chunk_index: i,
      content: chunk,
      embedding: JSON.stringify(embedding)  // Store as JSON for now
    });
  }

  console.log(`✓ Indexed page: ${page.title} (${chunks.length} chunks)`);
}

/**
 * Index all published pages
 */
async function indexAllPages() {
  console.log('Starting indexing of all pages...\n');

  const pages = await db('pages')
    .select('id', 'title', 'description', 'content', 'path')
    .where('isPublished', true)
    .orderBy('id');

  console.log(`Found ${pages.length} published pages\n`);

  for (const page of pages) {
    try {
      await indexPage(page);
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`✗ Failed to index page ${page.title}:`, error.message);
    }
  }

  console.log('\n✓ Indexing complete!');
}

/**
 * Index pages that have been modified since last indexing
 */
async function indexModifiedPages() {
  console.log('Checking for modified pages...\n');

  const modifiedPages = await db('pages')
    .select('pages.id', 'pages.title', 'pages.description', 'pages.content', 'pages.path', 'pages.updatedAt')
    .leftJoin('page_embeddings', 'pages.id', 'page_embeddings.page_id')
    .where('pages.isPublished', true)
    .where(function() {
      this.whereNull('page_embeddings.id')
        .orWhereRaw('pages.updatedAt > page_embeddings.updated_at');
    })
    .groupBy('pages.id', 'pages.title', 'pages.description', 'pages.content', 'pages.path', 'pages.updatedAt');

  if (modifiedPages.length === 0) {
    console.log('No modified pages found');
    return;
  }

  console.log(`Found ${modifiedPages.length} modified pages\n`);

  for (const page of modifiedPages) {
    try {
      await indexPage(page);
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`✗ Failed to index page ${page.title}:`, error.message);
    }
  }

  console.log('\n✓ Indexing of modified pages complete!');
}

// Run indexer when called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  (async () => {
    try {
      if (command === 'all') {
        await indexAllPages();
      } else if (command === 'modified') {
        await indexModifiedPages();
      } else {
        console.log('Usage: node indexer.js [all|modified]');
      }
    } catch (error) {
      console.error('Indexing failed:', error);
    } finally {
      process.exit(0);
    }
  })();
}

module.exports = {
  indexPage,
  indexAllPages,
  indexModifiedPages,
  generateEmbedding
};
