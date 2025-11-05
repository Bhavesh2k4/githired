# 🤖 LLM Provider Setup Guide

## Overview

GitHired supports multiple LLM providers with a unified interface. You can easily switch between providers or use your own fine-tuned models by changing environment variables.

**✅ Supported Providers:**
- **Gemini** (Google AI) - Default, free tier available
- **OpenAI** (GPT-4, GPT-4o, GPT-3.5) - Best quality
- **Anthropic** (Claude) - Excellent reasoning
- **Custom/Hugging Face** - Fine-tuned models, self-hosted, FREE options

---

## 🚀 Quick Setup

### 1. Choose Your Provider

Set the `LLM_PROVIDER` environment variable in your `.env` file:

```bash
# Choose ONE of these:
LLM_PROVIDER=gemini          # Default (recommended for testing)
LLM_PROVIDER=openai          # For GPT models
LLM_PROVIDER=anthropic       # For Claude models
LLM_PROVIDER=custom          # For fine-tuned/Hugging Face/self-hosted
```

### 2. Add Provider-Specific Configuration

Based on your choice, add the required environment variables:

---

## 📋 Provider-Specific Setup

### Gemini (Google AI) ✨ RECOMMENDED

**Why choose Gemini:**
- ✅ **FREE** - Generous free tier with 60 requests/minute
- ✅ Already installed (no additional packages needed)
- ✅ Fast response times
- ✅ Good quality for most use cases

**Setup:**
```bash
# .env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp  # Optional, this is the default
```

**Get your API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy and paste into `.env`

**Available Models:**
- `gemini-2.0-flash-exp` (Default) - Fastest, best value
- `gemini-1.5-pro` - Better reasoning
- `gemini-1.5-flash` - Balance of speed/quality

---

### OpenAI (GPT) 💰 PREMIUM

**Why choose OpenAI:**
- ✅ Best quality responses
- ✅ GPT-4o is very capable
- ✅ Supports fine-tuned models
- ❌ Paid only (no free tier)
- ❌ Requires `npm install openai`

**Setup:**
```bash
# .env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini  # Optional, default is gpt-4o-mini
```

**Install OpenAI package:**
```bash
npm install openai
```

**Get your API key:**
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy and paste into `.env`

**Available Models:**
- `gpt-4o-mini` (Default) - Fast and cheap
- `gpt-4o` - Best quality
- `gpt-4-turbo-preview` - Previous generation
- `ft:gpt-4o-...` - Your fine-tuned models

**For Fine-Tuned GPT Models:**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your_key
OPENAI_MODEL=ft:gpt-4o-mini:your-org:your-model:id
```

---

### Anthropic (Claude) 🧠 PREMIUM

**Why choose Anthropic:**
- ✅ Excellent reasoning and analysis
- ✅ Very detailed responses
- ✅ Good at following instructions
- ❌ Paid only
- ❌ Requires `npm install @anthropic-ai/sdk`

**Setup:**
```bash
# .env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Optional, this is default
```

**Install Anthropic SDK:**
```bash
npm install @anthropic-ai/sdk
```

**Get your API key:**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Navigate to API Keys
3. Create new key
4. Copy and paste into `.env`

**Available Models:**
- `claude-3-5-sonnet-20241022` (Default) - Best overall
- `claude-3-opus-20240229` - Most capable
- `claude-3-sonnet-20240229` - Balanced
- `claude-3-haiku-20240307` - Fastest/cheapest

---

### Custom Provider (Hugging Face / Self-Hosted) 🔧 FREE OPTION

**Use Cases:**
- ✅ **FREE** - Hugging Face free tier available
- ✅ Fine-tuned models from Hugging Face
- ✅ Self-hosted models (LLaMA, Mistral, etc.)
- ✅ Local development with Ollama/LocalAI
- ✅ Any OpenAI-compatible API endpoint

---

#### Option A: Hugging Face Inference API (FREE) ⭐

**Best for:** Free fine-tuned models, no installation needed

**Setup:**
```bash
# .env
LLM_PROVIDER=huggingface
CUSTOM_LLM_API_URL=https://api-inference.huggingface.co/models/YOUR_MODEL_NAME
CUSTOM_LLM_API_KEY=hf_your_huggingface_token
CUSTOM_LLM_MODEL=your-model-name  # Optional
```

**Get your API token:**
1. Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Create new token (read access is enough)
3. Copy and paste into `.env`

**Example - Using Meta LLaMA:**
```bash
LLM_PROVIDER=huggingface
CUSTOM_LLM_API_URL=https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf
CUSTOM_LLM_API_KEY=hf_your_token_here
```

**Example - Using Your Fine-Tuned Model:**
```bash
LLM_PROVIDER=huggingface
CUSTOM_LLM_API_URL=https://api-inference.huggingface.co/models/your-username/your-fine-tuned-model
CUSTOM_LLM_API_KEY=hf_your_token_here
```

**No additional npm packages required for Hugging Face!** ✅

---

#### Option B: Self-Hosted Models (Ollama, LocalAI)

**Best for:** Complete control, privacy, offline development

**Setup for Ollama:**
```bash
# .env
LLM_PROVIDER=custom
CUSTOM_LLM_API_URL=http://localhost:11434/v1
CUSTOM_LLM_API_KEY=ollama  # Can be anything for local
CUSTOM_LLM_MODEL=llama2    # Or mistral, codellama, etc.
```

**Install Ollama:**
```bash
# Mac/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Then pull a model
ollama pull llama2
ollama serve
```

**Requires `npm install openai`** (for OpenAI-compatible client)

---

#### Option C: Custom OpenAI-Compatible Endpoint

**Best for:** Private deployments, custom fine-tuned GPT models

**Setup:**
```bash
# .env
LLM_PROVIDER=custom
CUSTOM_LLM_API_URL=https://your-custom-endpoint.com/v1
CUSTOM_LLM_API_KEY=your_custom_api_key
CUSTOM_LLM_MODEL=your-model-name
```

**Requires `npm install openai`**

---

## 🧪 Testing Your Setup

### 1. Check Environment Variables

```bash
# In your terminal
echo $LLM_PROVIDER
echo $GEMINI_API_KEY  # or whatever provider you chose
```

### 2. Test in Code

Create a test file `test-llm.js`:

```javascript
// test-llm.js
require('dotenv').config();
const { generateCompletion } = require('./lib/ai/llm-provider');

async function test() {
  try {
    console.log(`Testing LLM Provider: ${process.env.LLM_PROVIDER || 'gemini'}`);
    
    const response = await generateCompletion('Say hello and tell me which AI model you are!');
    console.log('✅ Success!');
    console.log('Response:', response);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
```

Run the test:
```bash
node test-llm.js
```

---

## 🔄 Switching Providers

You can switch providers anytime by changing the `LLM_PROVIDER` variable:

```bash
# Switch from Gemini to OpenAI
LLM_PROVIDER=openai  # Change this line in .env

# Restart your development server
npm run dev
```

**Important:** Only the selected provider's package is loaded. You don't need to install packages for providers you're not using!

---

## 💡 Best Practices

### Development vs Production

```bash
# .env.local (Development)
LLM_PROVIDER=gemini  # Free for testing
GEMINI_API_KEY=your_dev_key

# .env.production (Production)
LLM_PROVIDER=openai  # Better quality for production
OPENAI_API_KEY=your_prod_key
OPENAI_MODEL=gpt-4o
```

### Cost Optimization

**Free Options:**
1. **Gemini** - 60 requests/minute free
2. **Hugging Face** - Free inference API with rate limits
3. **Ollama** - Completely free, runs locally

**Paid Options (by cost):**
1. **GPT-4o-mini** - ~$0.15 per 1M input tokens (cheapest paid)
2. **Claude 3 Haiku** - ~$0.25 per 1M input tokens
3. **GPT-4o** - ~$2.50 per 1M input tokens
4. **Claude 3.5 Sonnet** - ~$3 per 1M input tokens

### Rate Limiting

All providers have rate limits. Handle errors gracefully:

```typescript
try {
  const response = await generateCompletion(prompt);
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Wait and retry, or show user-friendly message
  }
}
```

---

## 🛠️ Advanced Configuration

### Model-Specific Overrides

You can override the model per request:

```typescript
import { generateCompletion } from '@/lib/ai/llm-provider';

// Use default model
const response1 = await generateCompletion('Hello');

// Override for this specific request
const response2 = await generateCompletion('Complex task', {
  model: 'gpt-4o',  // Use better model for this
  temperature: 0.3,  // Lower temperature for precision
  maxTokens: 4000,   // Allow longer response
});
```

### Temperature Settings

- `0.0-0.3` - Deterministic, factual (good for structured data)
- `0.4-0.7` - Balanced (default for most use cases)
- `0.8-1.0` - Creative, varied (good for content generation)

---

## 🐛 Troubleshooting

### Error: "Module not found: Can't resolve 'openai'"

**Solution:** You're trying to use OpenAI/Anthropic/Custom but haven't installed the package.

```bash
# For OpenAI or Custom (non-HF)
npm install openai

# For Anthropic
npm install @anthropic-ai/sdk
```

**Or switch to Gemini** (no installation needed):
```bash
LLM_PROVIDER=gemini
```

### Error: "API key not set"

**Solution:** Check your `.env` file has the correct key for your provider:

```bash
# For Gemini
GEMINI_API_KEY=...

# For OpenAI
OPENAI_API_KEY=sk-...

# For Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# For Custom/HF
CUSTOM_LLM_API_KEY=...
```

### Error: "Rate limit exceeded"

**Solutions:**
1. Wait a few seconds and retry
2. Upgrade to paid tier
3. Switch to a different provider
4. Implement request queuing/throttling

### Hugging Face: "Model is loading"

**Solution:** Free tier models may need warmup. Wait 20 seconds and retry.

```bash
# Models sleep after inactivity
# First request wakes them up (may fail)
# Subsequent requests work normally
```

---

## 📊 Feature Comparison

| Feature | Gemini | OpenAI | Anthropic | HuggingFace | Self-Hosted |
|---------|--------|--------|-----------|-------------|-------------|
| **Cost** | Free | Paid | Paid | Free/Paid | Free |
| **Setup Time** | 1 min | 2 min | 2 min | 2 min | 30 min |
| **Quality** | Good | Excellent | Excellent | Varies | Varies |
| **Speed** | Fast | Fast | Medium | Slow | Varies |
| **Privacy** | Cloud | Cloud | Cloud | Cloud | Local |
| **Fine-tuning** | No | Yes | Yes | Yes | Yes |
| **Offline** | No | No | No | No | Yes |

---

## 🎯 Recommendations

### For Quick Testing
→ **Gemini** (free, fast, good quality)

### For Production
→ **OpenAI GPT-4o** (best quality, reliable)

### For Privacy/Compliance
→ **Self-Hosted Ollama** (runs locally, no data leaves your server)

### For Custom Fine-Tuned Models
→ **Hugging Face or OpenAI** (easy fine-tuning workflows)

### For Budget-Conscious
→ **Gemini or Hugging Face** (free tiers available)

---

## 📚 Additional Resources

- [Gemini API Docs](https://ai.google.dev/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference)
- [Ollama Docs](https://ollama.ai/docs)

---

## ✅ Current Configuration

Check which provider you're currently using:

```bash
# View your configuration
cat .env | grep LLM
```

You should see output like:
```
LLM_PROVIDER=gemini
GEMINI_API_KEY=AIza...
```

---

## 🔒 Security Notes

**Never commit API keys to git!**

✅ **Do:**
- Use `.env` file (already in `.gitignore`)
- Use environment variables in production
- Rotate keys regularly
- Use separate keys for dev/prod

❌ **Don't:**
- Hardcode keys in source code
- Commit `.env` file
- Share keys publicly
- Use production keys in development

---

**Need help?** Check the error messages - they include helpful suggestions for fixing common issues!

