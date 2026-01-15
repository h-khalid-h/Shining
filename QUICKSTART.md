# Shining Quick Start Guide

**Status**: 🚀 Platform Ready (API Key Required)

---

## Prerequisites

- Node.js 18+
- Valid Anthropic API key

---

## 5-Minute Setup

### 1. Install Dependencies
```bash
cd /Users/hkhalid/Codebases/Shining
npm install
```

### 2. Configure Environment
Edit `.env` with your API keys:

```bash
# Required - Get from https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE

# Already configured
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEO4J_URI=neo4j+s://...
NEO4J_PASSWORD=...
```

### 3. Start Development Server
```bash
npm run dev
# Visit http://localhost:5174
```

---

## Features

### Working Now ✅
- **Chat** - AI-powered conversation
- **Authentication** - Click "Sign In" (Clerk)
- **Multi-Project** - Use ProjectSwitcher dropdown
- **Error Handling** - User-friendly messages

### After API Key ✅
- **AI Responses** - Claude 3.5 Sonnet
- **Understanding Card** - Shows after 3+ messages
- **Vector Suggestions** - Strategic path options
- **Graph Storage** - Neo4j knowledge base

---

## Testing Flow

1. **Sign In** → Click "Sign In" button
2. **Send Messages** → Type in chat
3. **Wait for Understanding** → After 3+ messages
4. **Confirm Goals** → Card appears bottom-right
5. **Get Suggestions** → Vector options appear

---

## Troubleshooting

### "Model configuration error"
→ Update `ANTHROPIC_API_KEY` in `.env`
→ Restart: `npm run dev`

### "Sign In not working"
→ Check `VITE_CLERK_PUBLISHABLE_KEY` in `.env`

### "Understanding Card not appearing"
→ Send at least 3 messages
→ Ensure you're signed in

---

## Architecture

```
app/
├── components/     # UI Components
│   ├── chat/      # Chat interface
│   ├── header/    # Header with ProjectSwitcher
│   └── intelligence/ # Understanding, Vectors
├── lib/
│   ├── .server/llm/   # Claude integration
│   ├── intelligence/  # AI features
│   └── stores/        # State management
└── routes/
    ├── _index.tsx     # Main page
    └── api.chat.ts    # Chat API
```

---

## Next Steps

1. ✅ Update API key in `.env`
2. ✅ Test chat with AI responses
3. ✅ Complete 3+ message conversation
4. ✅ Verify Understanding Card appears
5. 🔜 Enable Workbench (Code button)

**Questions?** Check the README.md for detailed documentation.
