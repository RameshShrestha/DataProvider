const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const axios = require('axios');

// Initialize Ollama client
// Check if using cloud or local Ollama
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const isCloudOllama = OLLAMA_BASE_URL.includes('ollama.com');

console.log('=== OLLAMA CONFIGURATION ===');
console.log('OLLAMA_BASE_URL:', OLLAMA_BASE_URL);
console.log('isCloudOllama:', isCloudOllama);
console.log('OLLAMA_API_KEY:', process.env.OLLAMA_API_KEY ? 'Set (hidden)' : 'Not set');
console.log('===========================');

// For cloud Ollama, use the API endpoint with authentication
// For local Ollama, use the local endpoint
const ollama = new OpenAI({
  baseURL: isCloudOllama ? 'https://ollama.com/v1' : `${OLLAMA_BASE_URL}/v1`,
  apiKey: process.env.OLLAMA_API_KEY || 'ollama',
  defaultHeaders: isCloudOllama ? {
    'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`
  } : {}
});

// URL for fetching available models
const OLLAMA_MODELS_URL = isCloudOllama
  ? 'https://ollama.com/api/tags'
  : `${OLLAMA_BASE_URL}/api/tags`;

// Initialize OpenRouter client
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPEN_ROUTER_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.CORS_ORIGIN || 'http://localhost:3000',
    'X-Title': 'AI Chat Application',
  }
});

// Default models
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';
const DEFAULT_OPENROUTER_MODEL = 'openrouter/free';

// Service types
const SERVICE_TYPES = {
  OLLAMA: 'ollama',
  OPENROUTER: 'openrouter'
};

// Helper function to get the appropriate client and model
const getClientAndModel = (service, model) => {
  const serviceType = service?.toLowerCase() || SERVICE_TYPES.OLLAMA;
  
  if (serviceType === SERVICE_TYPES.OPENROUTER) {
    return {
      client: openrouter,
      model: model || DEFAULT_OPENROUTER_MODEL,
      service: SERVICE_TYPES.OPENROUTER
    };
  }
  
  return {
    client: ollama,
    model: model || DEFAULT_OLLAMA_MODEL,
    service: SERVICE_TYPES.OLLAMA
  };
};

// System message to instruct AI to respond in HTML format
const SYSTEM_MESSAGE = {
  role: 'system',
  content: `You are a helpful AI assistant. IMPORTANT: You must respond ONLY in clean, well-formatted HTML content.
  
Rules for your responses:
1. Use proper HTML tags like <p>, <h1>-<h6>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <pre>, <blockquote>, <a>, <table>, etc.
2. DO NOT use markdown syntax (no **, __, \`\`\`, etc.)
3. For code blocks, use <pre><code class="language-xxx">code here</code></pre>
4. For inline code, use <code>code</code>
5. For lists, use <ul><li> or <ol><li>
6. For emphasis, use <strong> or <em>
7. For headings, use <h3>, <h4>, etc. (not h1 or h2)
8. For links, use <a href="url" target="_blank">text</a>
9. For line breaks, use <br> or wrap content in <p> tags
10. Make your responses visually appealing with proper structure
11. Do not include <!DOCTYPE>, <html>, <head>, or <body> tags - only content tags
12. For Greetings and other simple queries, use <p> tag with greeting message

Example response format for mixed contents:
<p>Here's a well-formatted response with <strong>bold text</strong> and <em>italic text</em>.</p>
<h3>Section Title</h3>
<ul>
  <li>First item</li>
  <li>Second item</li>
</ul>
<p>For code: <code>const x = 5;</code></p>
<p> here is the greeting response or normal chat content</p>`

};

/**
 * POST /chatwithai/chat
 * Send a message and get a response from the LLM
 * Body: { message: string, model?: string, service?: string ('ollama' | 'openrouter'), conversationHistory?: array }
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, model, service, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        success: false
      });
    }

    // Get the appropriate client and model based on service
    const { client, model: selectedModel, service: selectedService } = getClientAndModel(service, model);

    // Build messages array for the chat with system message
    const messages = [
      SYSTEM_MESSAGE,
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call the selected service via OpenAI SDK
    const completion = await client.chat.completions.create({
      model: selectedModel,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const assistantMessage = completion.choices[0].message.content;

    res.json({
      success: true,
      response: assistantMessage,
      model: selectedModel,
      service: selectedService,
      usage: completion.usage,
      conversationHistory: [
        ...messages,
        { role: 'assistant', content: assistantMessage }
      ]
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get response from AI',
      message: error.message,
      details: error.response?.data || error.toString()
    });
  }
});

/**
 * POST /chatwithai/stream
 * Stream responses from the LLM (Server-Sent Events)
 * Body: { message: string, model?: string, service?: string ('ollama' | 'openrouter'), conversationHistory?: array }
 */
router.post('/stream', async (req, res) => {
  try {
    const { message, model, service, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        success: false
      });
    }

    // Get the appropriate client and model based on service
    const { client, model: selectedModel, service: selectedService } = getClientAndModel(service, model);

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Build messages array with system message
    const messages = [
      SYSTEM_MESSAGE,
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Stream the response
    const stream = await client.chat.completions.create({
      model: selectedModel,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
      }
    }

    // Send final message
    res.write(`data: ${JSON.stringify({
      content: '',
      done: true,
      fullResponse,
      model: selectedModel,
      service: selectedService,
      conversationHistory: [
        ...messages,
        { role: 'assistant', content: fullResponse }
      ]
    })}\n\n`);
    
    res.end();

  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({
      error: 'Failed to stream response',
      message: error.message,
      done: true
    })}\n\n`);
    res.end();
  }
});

/**
 * GET /chatwithai/models
 * Get list of available models from both services
 * Query: ?service=ollama|openrouter (optional, defaults to both)
 */
router.get('/models', async (req, res) => {
  try {
    const { service } = req.query;
    const result = {
      success: true,
      services: {}
    };

    // Fetch Ollama models if requested or no service specified
    if (!service || service.toLowerCase() === SERVICE_TYPES.OLLAMA) {
      try {
        console.log('Fetching models from:', OLLAMA_MODELS_URL);
        console.log('Is cloud Ollama:', isCloudOllama);
        
        const headers = isCloudOllama && process.env.OLLAMA_API_KEY
          ? { 'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}` }
          : {};

        console.log('Using headers:', headers.Authorization ? 'With Authorization' : 'No Authorization');

        const response = await axios.get(OLLAMA_MODELS_URL, {
          headers,
          timeout: 10000
        });

        console.log('Models fetched successfully. Count:', response.data.models?.length || 0);

        const models = response.data.models || [];
        
        result.services.ollama = {
          available: true,
          models: models.map(model => ({
            id: model.name,
            name: model.name,
            size: model.size,
            modified_at: model.modified_at,
            digest: model.digest,
            details: model.details
          })),
          defaultModel: DEFAULT_OLLAMA_MODEL,
          source: isCloudOllama ? 'cloud' : 'local',
          baseURL: isCloudOllama ? 'https://ollama.com' : OLLAMA_BASE_URL
        };
      } catch (error) {
        result.services.ollama = {
          available: false,
          error: error.message,
          defaultModel: DEFAULT_OLLAMA_MODEL,
          suggestion: isCloudOllama
            ? 'Check your OLLAMA_API_KEY in .env file'
            : 'Make sure Ollama is running locally'
        };
      }
    }

    // Fetch OpenRouter models if requested or no service specified
    if (!service || service.toLowerCase() === SERVICE_TYPES.OPENROUTER) {
      try {
        const openrouterResponse = await openrouter.models.list();
        // Filter only models that are free (contain 'free' in their id)
        const freeModels = openrouterResponse.data.filter(model =>
          model.id.toLowerCase().includes('free')
        );
        result.services.openrouter = {
          available: true,
          models: freeModels.map(model => ({
            id: model.id,
            created: model.created,
            owned_by: model.owned_by || 'openrouter'
          })),
          defaultModel: DEFAULT_OPENROUTER_MODEL
        };
      } catch (error) {
        result.services.openrouter = {
          available: false,
          error: error.message,
          defaultModel: DEFAULT_OPENROUTER_MODEL
        };
      }
    }

    res.json(result);

  } catch (error) {
    console.error('Models list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models',
      message: error.message
    });
  }
});

/**
 * POST /chatwithai/completion
 * Simple text completion (non-chat format)
 * Body: { prompt: string, model?: string, service?: string ('ollama' | 'openrouter') }
 */
router.post('/completion', async (req, res) => {
  try {
    const { prompt, model, service, maxTokens = 1000 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required',
        success: false
      });
    }

    // Get the appropriate client and model based on service
    const { client, model: selectedModel, service: selectedService } = getClientAndModel(service, model);

    const completion = await client.completions.create({
      model: selectedModel,
      prompt: prompt,
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    res.json({
      success: true,
      response: completion.choices[0].text,
      model: selectedModel,
      service: selectedService,
      usage: completion.usage
    });

  } catch (error) {
    console.error('Completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get completion',
      message: error.message
    });
  }
});

/**
 * GET /chatwithai/health
 * Check if services are running and accessible
 */
router.get('/health', async (req, res) => {
  const health = {
    success: true,
    services: {}
  };

  // Check Ollama
  try {
    const headers = isCloudOllama && process.env.OLLAMA_API_KEY
      ? { 'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}` }
      : {};

    const response = await axios.get(OLLAMA_MODELS_URL, {
      headers,
      timeout: 5000
    });

    health.services.ollama = {
      status: 'running',
      available: true,
      baseURL: isCloudOllama ? 'https://ollama.com/v1' : `${OLLAMA_BASE_URL}/v1`,
      modelsAvailable: response.data.models?.length || 0,
      defaultModel: DEFAULT_OLLAMA_MODEL,
      source: isCloudOllama ? 'cloud' : 'local',
      authenticated: isCloudOllama ? !!process.env.OLLAMA_API_KEY : 'not required'
    };
  } catch (error) {
    health.services.ollama = {
      status: 'not accessible',
      available: false,
      error: error.message,
      baseURL: isCloudOllama ? 'https://ollama.com/v1' : `${OLLAMA_BASE_URL}/v1`,
      suggestion: isCloudOllama
        ? 'Check your OLLAMA_API_KEY and network connection'
        : 'Make sure Ollama is running locally'
    };
  }

  // Check OpenRouter
  try {
    const openrouterResponse = await openrouter.models.list();
    health.services.openrouter = {
      status: 'running',
      available: true,
      baseURL: 'https://openrouter.ai/api/v1',
      modelsAvailable: openrouterResponse.data.length,
      defaultModel: DEFAULT_OPENROUTER_MODEL,
      apiKeyConfigured: !!process.env.OPEN_ROUTER_KEY
    };
  } catch (error) {
    health.services.openrouter = {
      status: 'not accessible',
      available: false,
      error: error.message,
      baseURL: 'https://openrouter.ai/api/v1',
      apiKeyConfigured: !!process.env.OPEN_ROUTER_KEY,
      suggestion: process.env.OPEN_ROUTER_KEY
        ? 'Check your OpenRouter API key or network connection'
        : 'OPEN_ROUTER_KEY not configured in .env file'
    };
  }

  // Set overall success based on at least one service being available
  health.success = health.services.ollama.available || health.services.openrouter.available;

  const statusCode = health.success ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;

// Made with Bob
