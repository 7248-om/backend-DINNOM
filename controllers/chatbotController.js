import axios from 'axios';
import Product from '../models/product.js';

/**
 * @desc    Handle chatbot query
 * @route   POST /api/chatbot
 * @access  Public
 */
export const handleChat = async (req, res) => {
  const { query } = req.body;
  const { OLLAMA_API_URL, OLLAMA_MODEL } = process.env;

  if (!query) {
    return res.status(400).json({ message: 'Query is required.' });
  }

  // Guard clause in case the server starts without the .env variables
  if (!OLLAMA_API_URL || !OLLAMA_MODEL) {
    console.error(
      'Chatbot is not configured. Please set OLLAMA_API_URL and OLLAMA_MODEL in your .env file.'
    );
    return res.status(500).json({
      message: 'Chatbot service is not configured on the server.',
    });
  }

  try {
    // New: Fetch all unique tags to provide as context to the AI.
    const allTags = await Product.distinct('tags');

    // 1. Parse the user's query to extract relevant keywords, handling possessives like "women's".
    const stopWords = new Set(['a', 'an', 'the', 'is', 'in', 'on', 'for', 'of', 'with', 'do', 'you', 'have', 'any', 'what', 'are', 'can', 'i', 'get', 's']);
    const keywords = query.toLowerCase().split(' ').map(w => w.replace(/['’]s$/, '')).filter(word => !stopWords.has(word) && word.length > 1);

    if (keywords.length === 0) {
      return res.json({ reply: "I'm sorry, I couldn't understand your request. Could you please be more specific about what you're looking for?" });
    }

    // New: Detect gender keywords to create a specific filter.
    const genderFilter = {};
    const maleKeywords = new Set(['men', 'man', 'male', 'boy', 'boys']);
    const femaleKeywords = new Set(['women', 'woman', 'female', 'girl', 'girls']);
    let genderDetected = false;

    const searchKeywords = keywords.filter(keyword => {
      if (maleKeywords.has(keyword)) {
        genderFilter.gender = 'Male';
        genderDetected = true;
        return false; // Remove from search keywords
      }
      if (femaleKeywords.has(keyword)) {
        genderFilter.gender = 'Female';
        genderDetected = true;
        return false; // Remove from search keywords
      }
      return true;
    });

    let products = [];
    let foundIds = new Set();

    // If there are no specific keywords but a gender was found, search just by gender.
    if (searchKeywords.length === 0 && genderDetected) {
        products = await Product.find(genderFilter).limit(5).lean();
    } else if (searchKeywords.length > 0) {
        // 2. Prioritize search by tags for better relevance.
        const tagRegexes = searchKeywords.map(k => new RegExp(`^${k}$`, 'i'));
        const productsFromTags = await Product.find({ ...genderFilter, tags: { $in: tagRegexes } }).limit(5).lean();

        foundIds = new Set(productsFromTags.map(p => p._id.toString()));
        products = [...productsFromTags];

        // 3. If we don't have enough results, broaden the search to other fields.
        if (products.length < 5) {
            const searchRegex = new RegExp(searchKeywords.join('|'), 'i');
            const otherProducts = await Product.find({
                _id: { $nin: Array.from(foundIds) }, // Exclude products already found
                ...genderFilter,
                $or: [ { name: { $regex: searchRegex } }, { description: { $regex: searchRegex } }, { category: { $regex: searchRegex } } ],
            }).limit(5 - products.length).lean();
            products = products.concat(otherProducts);
        }
    }

    // ✅ Debug log to see if products are being found
    console.log(`Found ${products.length} products for query: "${query}"`);
    if (products.length > 0) {
      console.log('Found products:', products.map(p => p.name));
    }

    // 4. Construct a detailed prompt for the AI with the product data.
    // ...existing code above...

    // 4. Construct a detailed prompt for the AI with the product data.
    // CHANGE: Add a markdownLink field for each product
    // ...existing code above...

    // Make productInfo a plain markdown list of links
    // ...existing code above...

    // Make productInfo a plain markdown list of links
    const productInfo =
      products.length > 0
        ? products.map(
            p => `- [${p.name}](http://localhost:5173/product/${p._id})`
          ).join('\n')
        : '';

    // If no products, reply directly and skip AI
    if (!productInfo) {
      return res.json({ reply: "Sorry, I don't have information about that or can't help with this query." });
    }

    const prompt = `You are a helpful e-commerce assistant for a store called DINNOM.
You can ONLY answer about products that are in the PRODUCTS list below.
If the PRODUCTS list is empty, reply with exactly: Sorry, I don't have information about that or can't help with this query.
If the PRODUCTS list is not empty, ONLY reply with a bullet list of the products below, using the markdown links as provided. Do NOT add any other information or explanation.

PRODUCTS:
${productInfo}

USER'S QUERY:
${query}`;

// ...rest of your code unchanged...

// ...rest of your code unchanged...

// ...rest of your code unchanged...

    // 5. Call the local Ollama AI API and send the response.
    const ollamaResponse = await axios.post(OLLAMA_API_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false, // We want the full response at once
    });

    const reply = ollamaResponse.data.response;
    res.json({ reply: reply.trim() });
  } catch (error) {
    // Provide more specific feedback if the Ollama server is not reachable.
    if (error.code === 'ECONNREFUSED') {
      console.error('Chatbot Error: Connection to Ollama server failed. Is Ollama running?');
      return res.status(500).json({ message: 'The AI service is currently unavailable.' });
    }

    console.error('Error with chatbot:', error);
    res.status(500).json({ message: 'Something went wrong on our end.' });
  }
};
