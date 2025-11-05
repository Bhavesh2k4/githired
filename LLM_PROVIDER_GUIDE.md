# LLM Provider Guide - Adding Custom LLMs & Fine-tuned Models

> **📖 NEW: Comprehensive Setup Guide Available!**
>
> **See [`LLM_SETUP_GUIDE.md`](./LLM_SETUP_GUIDE.md) for:**
> - ✅ **Hugging Face support** (FREE fine-tuned models!)
> - ✅ **No more module errors** - Only loads configured provider
> - ✅ Step-by-step setup instructions
> - ✅ Troubleshooting guide
> - ✅ Cost comparison & recommendations
>
> This document contains the original technical details. For quick setup, use the new guide above.

---

This guide explains how to add your own LLM providers, fine-tuned models, or switch between different AI providers (Gemini, GPT, Claude, etc.) in GitHired.

## 🎯 Quick Start

### Using Different Providers

Simply set the `LLM_PROVIDER` environment variable:

```bash
# Use Gemini (default)
LLM_PROVIDER=gemini

# Use OpenAI/GPT
LLM_PROVIDER=openai

# Use Anthropic/Claude
LLM_PROVIDER=anthropic

# Use your own fine-tuned/custom model
LLM_PROVIDER=custom
```

## 📋 Supported Providers

### 1. **Gemini (Default)**
```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-2.0-flash-exp  # Optional, defaults to gemini-2.0-flash-exp
```

### 2. **OpenAI / GPT**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
```

**Supported Models:**
- `gpt-4o-mini` (default, fast & cheap)
- `gpt-4o` (more capable)
- `gpt-4-turbo`
- `gpt-3.5-turbo`
- Fine-tuned models: `ft:gpt-3.5-turbo:org:custom-model:123` (your fine-tuned model ID)

**Installation:**
```bash
npm install openai
```

### 3. **Anthropic / Claude**
```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_api_key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Optional
```

**Supported Models:**
- `claude-3-5-sonnet-20241022` (default, best balance)
- `claude-3-opus-20240229`
- `claude-3-5-haiku-20241022`

**Installation:**
```bash
npm install @anthropic-ai/sdk
```

### 4. **Custom / Fine-tuned Models**

This is the most flexible option - use your own:
- Fine-tuned OpenAI models
- Self-hosted models (via OpenAI-compatible API)
- Custom API endpoints
- Other providers (Cohere, Together AI, etc.)

```bash
LLM_PROVIDER=custom
CUSTOM_LLM_API_URL=https://api.your-model.com/v1
CUSTOM_LLM_API_KEY=your_api_key
CUSTOM_LLM_MODEL=your-model-name
```

**Or use OpenAI-compatible format:**
```bash
LLM_PROVIDER=custom
OPENAI_API_BASE=https://api.your-model.com/v1
OPENAI_API_KEY=your_api_key
CUSTOM_LLM_MODEL=your-model-name
```

**Examples:**
- **Fine-tuned OpenAI model**: Set `OPENAI_API_BASE` to OpenAI's API and `CUSTOM_LLM_MODEL` to your fine-tuned model ID
- **Self-hosted model** (e.g., vLLM, Ollama): Set `CUSTOM_LLM_API_URL` to your local/remote endpoint
- **Together AI**: `CUSTOM_LLM_API_URL=https://api.together.xyz/v1` and your Together API key

## 🔧 Implementation Details

### Architecture

The system uses an abstraction layer (`lib/ai/llm-provider.ts`) that provides a unified interface:

```typescript
interface LLMProvider {
  generateCompletion(prompt: string, options?: LLMOptions): Promise<string>;
  generateStructuredResponse<T>(prompt: string, schema: string, options?: LLMOptions): Promise<T>;
}
```

All AI modules (`ats-analyzer.ts`, `query-generator.ts`, `profile-analyzer.ts`) use this abstraction, so switching providers is transparent.

### Usage in Code

All existing code automatically uses the configured provider:

```typescript
// This will use whatever provider is configured
import { generateStructuredResponse } from "./llm-provider";

const result = await generateStructuredResponse<MyType>(prompt, schema);
```

### Advanced Options

You can pass options to customize behavior:

```typescript
import { generateStructuredResponse } from "./llm-provider";

const result = await generateStructuredResponse<MyType>(
  prompt,
  schema,
  {
    temperature: 0.7,        // Creativity level (0-1)
    maxTokens: 2000,        // Max response length
    model: "gpt-4o",       // Override default model
    systemPrompt: "You are a helpful assistant..."
  }
);
```

## 🎓 Using Fine-tuned Models

### Option 1: OpenAI Fine-tuned Models

1. **Train your model** using OpenAI's fine-tuning API
2. **Get your model ID**: `ft:gpt-3.5-turbo:org:custom-model:123`
3. **Configure**:
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key
OPENAI_MODEL=ft:gpt-3.5-turbo:org:custom-model:123
```

### Option 2: Custom API Endpoint

If you have a self-hosted or custom API:

```bash
LLM_PROVIDER=custom
CUSTOM_LLM_API_URL=https://your-api.com/v1
CUSTOM_LLM_API_KEY=your_key
CUSTOM_LLM_MODEL=your-model-name
```

**Requirements:**
- Must be OpenAI-compatible API format
- Should support `/chat/completions` endpoint
- Should support JSON mode for structured responses

### Option 3: Extend the Provider

For non-OpenAI-compatible APIs, extend the provider:

1. **Edit** `lib/ai/llm-provider.ts`
2. **Add your provider** in `getLLMProvider()`:

```typescript
case "my-custom-provider":
  return getMyCustomProvider();
```

3. **Implement** `getMyCustomProvider()`:

```typescript
function getMyCustomProvider(): LLMProvider {
  return {
    async generateCompletion(prompt: string, options?: LLMOptions): Promise<string> {
      // Your custom API call
      const response = await fetch("https://your-api.com/generate", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.MY_API_KEY}` },
        body: JSON.stringify({ prompt, ...options })
      });
      return response.json().text;
    },
    
    async generateStructuredResponse<T>(prompt: string, schema: string, options?: LLMOptions): Promise<T> {
      // Your custom structured response logic
      // ...
    }
  };
}
```

## 📊 Use Cases

### 1. **Cost Optimization**
Use cheaper models for simple tasks:
```bash
# Use GPT-4o-mini for most queries (cheaper)
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini

# Use GPT-4o only for complex ATS analysis
# (modify ats-analyzer.ts to use different model)
```

### 2. **Performance Optimization**
Use faster models:
```bash
# Gemini Flash for speed
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-2.0-flash-exp

# Or Claude Haiku
LLM_PROVIDER=anthropic
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
```

### 3. **Domain-Specific Fine-tuning**
Fine-tune a model for:
- **Resume analysis**: Better ATS scoring
- **SQL generation**: More accurate query generation
- **Profile analysis**: Better gap detection

### 4. **Self-Hosted Models**
Run models locally for:
- **Privacy**: Data never leaves your infrastructure
- **Cost savings**: No API costs
- **Customization**: Full control over model behavior

**Popular self-hosted options:**
- **vLLM**: Fast inference server
- **Ollama**: Easy local model deployment
- **Together AI**: Hosted but dedicated instances

## 🔒 Security Considerations

1. **API Keys**: Store in environment variables, never commit
2. **Rate Limiting**: Implement rate limiting for API calls
3. **Error Handling**: Provider abstraction handles errors gracefully
4. **Fallback**: Consider implementing fallback to default provider on errors

## 🧪 Testing

Test different providers:

```typescript
// Test script
import { getLLMProvider } from "./lib/ai/llm-provider";

const provider = getLLMProvider();

// Test completion
const text = await provider.generateCompletion("Hello, world!");
console.log(text);

// Test structured response
const result = await provider.generateStructuredResponse(
  "Analyze this resume...",
  `{ "score": number, "strengths": string[] }`
);
console.log(result);
```

## 📝 Migration from Gemini-Only

The codebase has been updated to use the abstraction layer. Existing code continues to work:

**Before:**
```typescript
import { generateStructuredResponse } from "./gemini-client";
```

**After (same code, but now provider-agnostic):**
```typescript
import { generateStructuredResponse } from "./llm-provider";
```

## 🐛 Troubleshooting

### "Provider not found"
- Check `LLM_PROVIDER` env variable is set correctly
- Ensure required packages are installed (`npm install openai` for OpenAI)

### "API key not set"
- Verify environment variables are set
- Check `.env` file or deployment environment

### "Model not found"
- Verify model name is correct
- For fine-tuned models, check model ID format
- Some models may require specific API regions

### "Structured response parsing failed"
- Check if model supports JSON mode
- Some older models may need prompt adjustments
- Verify schema format is valid JSON

## 📚 Additional Resources

- **OpenAI Fine-tuning**: https://platform.openai.com/docs/guides/fine-tuning
- **Anthropic Models**: https://docs.anthropic.com/claude/docs/models-overview
- **vLLM**: https://vllm.readthedocs.io/
- **Ollama**: https://ollama.ai/

---

**Need help?** Check the implementation in `lib/ai/llm-provider.ts` for examples.

