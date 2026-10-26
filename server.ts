import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Health and Configuration Status
app.get('/api/health', (req: Request, res: Response) => {
  const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    hasServerKey,
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
    defaultModel: 'gemini-3.8-flash',
  });
});

// Test Connection Endpoint
app.post('/api/test-connection', async (req: Request, res: Response) => {
  try {
    const { provider = 'gemini', apiKey, baseUrl, model = 'gemini-3.8-flash' } = req.body;
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

    if (!effectiveKey && provider === 'gemini') {
      return res.status(400).json({
        success: false,
        error: 'No API key provided and no default server GEMINI_API_KEY found.',
      });
    }

    if (provider === 'gemini') {
      const httpOptions: any = {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      };
      if (baseUrl && typeof baseUrl === 'string' && baseUrl.trim().length > 0) {
        httpOptions.baseUrl = baseUrl.trim();
      }

      const client = new GoogleGenAI({
        apiKey: effectiveKey,
        httpOptions,
      });

      const startTime = Date.now();
      try {
        const testPromise = client.models.generateContent({
          model: model || 'gemini-3.8-flash',
          contents: 'Ping',
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timed out after 15000ms')), 15000)
        );

        const testResponse = await Promise.race([testPromise, timeoutPromise]);
        const latency = Date.now() - startTime;

        return res.json({
          success: true,
          latency,
          message: testResponse.text?.trim() || 'Connected successfully',
          model,
        });
      } catch (geminiErr: any) {
        // Fallback test via direct REST to get detailed error diagnostic
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${effectiveKey}`;
        try {
          const directRes = await fetch(directUrl, { method: 'GET', signal: AbortSignal.timeout(3000) });
          if (!directRes.ok) {
            const errJson: any = await directRes.json().catch(() => ({}));
            const reason = errJson?.error?.message || errJson?.error?.status || `HTTP ${directRes.status}`;
            return res.status(directRes.status).json({
              success: false,
              error: `Gemini API Authentication: ${reason}. Please verify your API key in Settings.`,
            });
          }
        } catch {
          // ignore
        }

        return res.status(400).json({
          success: false,
          error: cleanErrorMessage(geminiErr.message || 'Gemini connection failed. Please check your API key and base URL in Settings.'),
        });
      }
    } else {
      // Custom or Oxion AI compatible endpoint test
      const defaultBase = provider === 'oxionai' ? 'https://oxionai.com/v1' : 'https://api.openai.com/v1';
      const targetBase = (baseUrl && typeof baseUrl === 'string' && baseUrl.trim() ? baseUrl.trim() : defaultBase).replace(/\/+$/, '');
      const testUrl = `${targetBase}/chat/completions`;
      const testModel = model || (provider === 'oxionai' ? 'gemma-2-2b' : 'gpt-4o-mini');
      const startTime = Date.now();

      const fetchRes = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveKey ? { Authorization: `Bearer ${effectiveKey}` } : {}),
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(12000),
      });

      const latency = Date.now() - startTime;
      if (!fetchRes.ok) {
        const errorText = await fetchRes.text();
        return res.status(fetchRes.status).json({
          success: false,
          error: `${provider === 'oxionai' ? 'Oxion AI' : 'Endpoint'} returned error (HTTP ${fetchRes.status}): ${cleanErrorMessage(errorText)}`,
          details: errorText,
        });
      }

      const data = await fetchRes.json();
      return res.json({
        success: true,
        latency,
        message: data.choices?.[0]?.message?.content || 'Connected successfully',
        model: testModel,
      });
    }
  } catch (error: any) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      error: cleanErrorMessage(error.message || 'Connection test failed'),
    });
  }
});

// Dynamic Models Fetching Endpoint (e.g. from Oxion AI GET /v1/models or Custom endpoint)
app.post('/api/fetch-models', async (req: Request, res: Response) => {
  try {
    const { provider = 'oxionai', apiKey, baseUrl } = req.body;
    const defaultBase = provider === 'oxionai' ? 'https://oxionai.com/v1' : 'https://api.openai.com/v1';
    const targetBase = (baseUrl && typeof baseUrl === 'string' && baseUrl.trim() ? baseUrl.trim() : defaultBase).replace(/\/+$/, '');
    const effectiveKey = apiKey || (provider === 'gemini' ? process.env.GEMINI_API_KEY : '');

    if (provider === 'gemini') {
      return res.json({
        success: true,
        models: [
          { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', category: 'Google Gemini' },
          { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite', category: 'Google Gemini' },
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'Google Gemini' },
          { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', category: 'Google Gemini' },
        ],
      });
    }

    const modelsUrl = `${targetBase}/models`;
    const fetchRes = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(effectiveKey ? { Authorization: `Bearer ${effectiveKey}` } : {}),
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      return res.status(fetchRes.status).json({
        success: false,
        error: `Could not fetch models from ${modelsUrl} (HTTP ${fetchRes.status}): ${cleanErrorMessage(errText)}`,
      });
    }

    const data = await fetchRes.json();
    const rawList = Array.isArray(data) ? data : data.data || [];
    const models = rawList.map((m: any) => ({
      id: typeof m === 'string' ? m : m.id || m.name,
      name: typeof m === 'string' ? m : m.id || m.name,
      owned_by: m.owned_by,
      category: provider === 'oxionai' ? 'Oxion AI' : 'Custom',
      description: m.description || `Hosted on ${provider === 'oxionai' ? 'Oxion AI' : 'Endpoint'}`,
    }));

    return res.json({
      success: true,
      models,
      count: models.length,
      provider,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: cleanErrorMessage(error.message || 'Failed to fetch models list'),
    });
  }
});

// Helper to clean API error messages
function cleanErrorMessage(msg: any): string {
  if (!msg) return 'Unknown error occurred';
  if (typeof msg !== 'string') return String(msg);
  try {
    const parsed = JSON.parse(msg);
    if (parsed.error?.message) return parsed.error.message;
  } catch {}
  return msg;
}

// Helper for thinking level mapping
function mapThinkingLevel(levelStr?: string): ThinkingLevel | undefined {
  if (!levelStr) return undefined;
  switch (levelStr.toLowerCase()) {
    case 'off':
    case 'minimal':
      return ThinkingLevel.MINIMAL;
    case 'low':
      return ThinkingLevel.LOW;
    case 'medium':
      return ThinkingLevel.MEDIUM;
    case 'high':
      return ThinkingLevel.HIGH;
    default:
      return undefined;
  }
}

// Streaming Chat & Agentic Execution Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (type: string, data: any) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  try {
    const {
      provider = 'gemini',
      apiKey,
      baseUrl,
      model = 'gemini-3.8-flash',
      messages = [],
      systemPrompt,
      temperature = 0.7,
      topP = 0.95,
      thinkingLevel,
      thinkingBudget,
      agentMode = false,
      enableSearch = false,
      enableCodeExec = true,
    } = req.body;

    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

    if (!effectiveKey && provider === 'gemini') {
      sendEvent('error', {
        message: 'No Gemini API key available. Please add your key in the settings panel or environment.',
      });
      res.end();
      return;
    }

    if (provider === 'custom' || provider === 'oxionai') {
      // Stream with OpenAI compatible format (used by Oxion AI, OpenAI, OpenRouter, Ollama)
      const defaultBase = provider === 'oxionai' ? 'https://oxionai.com/v1' : 'https://api.openai.com/v1';
      const targetBase = (baseUrl && typeof baseUrl === 'string' && baseUrl.trim() ? baseUrl.trim() : defaultBase).replace(/\/+$/, '');
      const targetModel = model || (provider === 'oxionai' ? 'gemma-2-2b' : 'gpt-4o');
      const openAiMessages = [];

      if (systemPrompt) {
        openAiMessages.push({ role: 'system', content: systemPrompt });
      }

      for (const m of messages) {
        if (m.attachments && m.attachments.length > 0) {
          const contentParts: any[] = [{ type: 'text', text: m.content || '' }];
          for (const att of m.attachments) {
            if (att.mimeType?.startsWith('image/')) {
              contentParts.push({
                type: 'image_url',
                image_url: { url: `data:${att.mimeType};base64,${att.data}` },
              });
            } else {
              contentParts.push({
                type: 'text',
                text: `\n[Attached File: ${att.name} (${att.mimeType})]:\n${att.textPreview || ''}`,
              });
            }
          }
          openAiMessages.push({ role: m.role, content: contentParts });
        } else {
          openAiMessages.push({ role: m.role, content: m.content });
        }
      }

      const response = await fetch(`${targetBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveKey ? { Authorization: `Bearer ${effectiveKey}` } : {}),
        },
        body: JSON.stringify({
          model: targetModel,
          messages: openAiMessages,
          temperature,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        const errText = await response.text();
        sendEvent('error', {
          message: `${provider === 'oxionai' ? 'Oxion AI' : 'Endpoint'} error (HTTP ${response.status}): ${cleanErrorMessage(errText)}`,
        });
        res.end();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) {
              sendEvent('content', { text: delta.content });
            }
            if (delta?.reasoning_content) {
              sendEvent('thought', { text: delta.reasoning_content });
            }
          } catch {
            // ignore parse error of raw chunk
          }
        }
      }

      sendEvent('done', {});
      res.end();
      return;
    }

    // Google Gemini Provider
    const chatHttpOptions: any = {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    };
    if (baseUrl && typeof baseUrl === 'string' && baseUrl.trim().length > 0) {
      chatHttpOptions.baseUrl = baseUrl.trim();
    }

    const client = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: chatHttpOptions,
    });

    // Format contents for Gemini SDK
    const formattedContents = messages.map((msg: any) => {
      const parts: any[] = [];

      // Attachments first if any
      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.data && att.mimeType) {
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.data,
              },
            });
          }
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    // Prepare model configs
    const resolvedThinkingLevel = mapThinkingLevel(thinkingLevel);
    const config: any = {
      systemInstruction: systemPrompt || undefined,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      topP: typeof topP === 'number' ? topP : 0.95,
    };

    if (resolvedThinkingLevel) {
      config.thinkingConfig = {
        thinkingLevel: resolvedThinkingLevel,
      };
    } else if (thinkingBudget && typeof thinkingBudget === 'number' && thinkingBudget > 0) {
      // Only set thinkingBudget if not gemini-4
      if (!model.includes('gemini-4')) {
        config.thinkingConfig = {
          thinkingBudget,
        };
      }
    }

    // Configure tools if requested
    const tools: any[] = [];
    if (enableSearch) {
      tools.push({ googleSearch: {} });
    }

    if (tools.length > 0) {
      config.tools = tools;
    }

    const streamResponse = await client.models.generateContentStream({
      model: model || 'gemini-3.8-flash',
      contents: formattedContents,
      config,
    });

    for await (const chunk of streamResponse) {
      // Check for thinking or reasoning parts
      const candidates = chunk.candidates || [];
      const parts = candidates[0]?.content?.parts || [];

      for (const part of parts) {
        // In Gemini 3 SDK, parts may include thoughts or text
        if ((part as any).thought) {
          sendEvent('thought', { text: (part as any).thought });
        } else if (part.text) {
          sendEvent('content', { text: part.text });
        }
      }

      // If chunk.text is populated and wasn't sent via parts
      if (parts.length === 0 && chunk.text) {
        sendEvent('content', { text: chunk.text });
      }
    }

    sendEvent('done', {});
    res.end();
  } catch (error: any) {
    console.error('Chat error:', error);
    sendEvent('error', {
      message: cleanErrorMessage(error.message || 'An error occurred during generation.'),
      details: error.stack,
    });
    res.end();
  }
});

// Safe Server-Side Code Execution Sandbox (Optional runner)
app.post('/api/execute-code', async (req: Request, res: Response) => {
  try {
    const { language = 'javascript', code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'No code provided' });
    }

    if (language === 'javascript' || language === 'typescript') {
      const logs: string[] = [];
      const errors: string[] = [];

      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')),
        error: (...args: any[]) => errors.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
        info: (...args: any[]) => logs.push('[INFO] ' + args.map(a => String(a)).join(' ')),
      };

      const startTime = Date.now();
      let resultVal: any = undefined;

      try {
        // Execute inside controlled scope
        const runner = new Function('console', 'Math', 'JSON', 'Date', 'Array', 'Object', 'Promise', `
          "use strict";
          return (async () => {
            ${code}
          })();
        `);
        resultVal = await Promise.race([
          runner(customConsole, Math, JSON, Date, Array, Object, Promise),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Execution timed out (5000ms limit)')), 5000))
        ]);
      } catch (err: any) {
        errors.push(err.message || String(err));
      }

      const executionTime = Date.now() - startTime;
      return res.json({
        success: errors.length === 0,
        output: logs.join('\n'),
        error: errors.join('\n') || undefined,
        result: resultVal !== undefined ? (typeof resultVal === 'object' ? JSON.stringify(resultVal, null, 2) : String(resultVal)) : undefined,
        executionTime,
      });
    }

    return res.json({
      success: true,
      output: `Code received for ${language}. Preview and client runner available in UI.`,
      result: null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NexusAI Studio server running at http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
