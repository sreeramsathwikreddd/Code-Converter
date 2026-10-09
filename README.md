# Code Converter

A compact, responsive, AI-assisted code conversion web app. Paste source code, choose a target language, convert, and copy the result.

## Features

- Responsive dark UI with source and output editors
- Multiple source and target language choices
- AI-assisted conversion using Google's Gemini API
- Copy output, load an example, clear editors, swap languages
- Keyboard shortcut: Ctrl+Enter (Windows/Linux) or Cmd+Enter (macOS)
- Request validation, size limits, timeouts, readable error messages, and a health endpoint
- API key stays on the server; it is never sent to the browser

## Requirements

- Node.js 18.17 or newer (Node 20 LTS recommended)
- npm (included with Node.js)
- A Gemini API key for live conversion. Check current access, models, quotas, and pricing in Google AI Studio / Gemini API documentation; availability and free-tier limits may change.

## Setup

1. Extract the ZIP and open a terminal in the `Code Converter Fullstack` folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and add your key as `GEMINI_API_KEY=your_key_here`.
   - Windows PowerShell: `Copy-Item .env.example .env`
   - macOS/Linux: `cp .env.example .env`
4. Start the app:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000`.

## Verify your setup

Run the following from the project folder.

**Windows PowerShell:**

```powershell
node --version; npm --version; npm run check; if (Test-Path node_modules) { "node_modules exists" } else { "node_modules missing — run npm install" }; if (Test-Path .env) { " .env exists" } else { ".env missing — copy .env.example to .env and add your key" }
```

**macOS/Linux shell:**

```bash
node --version && npm --version && npm run check && test -d node_modules && echo "node_modules exists" || echo "Check output above; install dependencies with npm install"
```

To install dependencies after verifying Node/npm are available:

```bash
npm install
```

Then run:

```bash
npm start
```

## API

- `GET /api/health` reports server status and whether an API key is configured. It never returns the key.
- `POST /api/convert` accepts JSON: `{ "code": "...", "sourceLanguage": "Python", "targetLanguage": "C++" }`.

## Accuracy and safety

AI conversion is not guaranteed to be semantically identical or compile successfully. Always inspect the generated code and test it with representative inputs. Do not paste secrets, private keys, credentials, or sensitive proprietary code. API quotas and provider terms apply.

## Project files

- `Code Converter Main.html` — page structure
- `Code Converter Main.css` — UI and responsive styling
- `Code Converter Main.js` — browser behavior
- `Code Converter Backend.js` — server and conversion API
- `package.json` — dependencies and scripts
- `.env.example` — configuration template
