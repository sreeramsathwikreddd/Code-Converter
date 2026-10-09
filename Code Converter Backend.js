
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MAX_CODE_CHARS = Number(process.env.MAX_CODE_CHARS) || 30000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/interactions";

app.use(express.json({ limit: "1mb" }));
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "Code Converter Main.html"));
});

app.use(express.static(__dirname));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    configured: Boolean(process.env.GEMINI_API_KEY),
    model: GEMINI_MODEL,
  });
});

app.post("/api/convert", async (req, res) => {
  try {
    const { code, sourceLanguage, targetLanguage } = req.body || {};

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is missing. Add it to your .env file.",
      });
    }

    if (
      typeof code !== "string" ||
      !code.trim() ||
      typeof sourceLanguage !== "string" ||
      typeof targetLanguage !== "string"
    ) {
      return res.status(400).json({
        error: "Provide code, source language, and target language.",
      });
    }

    if (code.length > MAX_CODE_CHARS) {
      return res.status(413).json({
        error: `Code is too long. Maximum allowed length is ${MAX_CODE_CHARS} characters.`,
      });
    }

    if (sourceLanguage === targetLanguage) {
      return res.json({
        convertedCode: code,
        explanation: "Source and target languages are the same.",
      });
    }

    const prompt = `
You are an expert programming language converter.

Convert the following code from ${sourceLanguage} to ${targetLanguage}.

Requirements:
- Return working, idiomatic ${targetLanguage} code.
- Preserve the original program's behavior and functionality.
- Use appropriate standard libraries and language conventions.
- Do not omit important logic.
- Do not include Markdown code fences around the converted code.
- Do not invent unavailable APIs.
- If exact conversion is impossible, explain the limitation briefly.

Return exactly this structure:

CONVERTED_CODE:
[complete converted code]

EXPLANATION:
[brief explanation of the conversion]

SOURCE LANGUAGE: ${sourceLanguage}
TARGET LANGUAGE: ${targetLanguage}

INPUT CODE:
${code}
`.trim();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let apiResponse;

    try {
      apiResponse = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          input: prompt,
          store: false,
          generation_config: {
            max_output_tokens: 8192,
            thinking_level: "low",
          },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const result = await apiResponse.json().catch(() => ({}));

    if (!apiResponse.ok) {
      console.error(
        "Gemini API error:",
        apiResponse.status,
        result.error?.message || "Unknown API error"
      );

      return res.status(502).json({
        error:
          result.error?.message ||
          `Gemini API request failed with status ${apiResponse.status}.`,
      });
    }

    const outputText = (result.steps || [])
      .filter((step) => step.type === "model_output")
      .flatMap((step) => step.content || [])
      .filter((item) => item.type === "text")
      .map((item) => item.text || "")
      .join("\n")
      .trim();

    if (!outputText) {
      console.error("Gemini returned no text output.");
      return res.status(502).json({
        error: "The AI returned an empty response. Please try again.",
      });
    }

    const codeMatch = outputText.match(
      /CONVERTED_CODE:\s*([\s\S]*?)(?:\nEXPLANATION:|$)/i
    );

    const explanationMatch = outputText.match(
      /EXPLANATION:\s*([\s\S]*)$/i
    );

    let convertedCode = codeMatch
      ? codeMatch[1].trim()
      : outputText.trim();

    convertedCode = convertedCode
      .replace(/^```[\w+#.-]*\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const explanation = explanationMatch
      ? explanationMatch[1].trim()
      : "Conversion completed. Review the generated code before using it.";

    return res.json({
      convertedCode,
      explanation,
      sourceLanguage,
      targetLanguage,
      model: GEMINI_MODEL,
    });
  } catch (error) {
    console.error("Conversion error:", error.message);

    if (error.name === "AbortError") {
      return res.status(504).json({
        error: "The AI request timed out. Please try again.",
      });
    }

    return res.status(500).json({
      error: "An unexpected server error occurred during conversion.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Code Converter running at http://localhost:${PORT}`);
  console.log(`AI model: ${GEMINI_MODEL}`);
  console.log(
    `Gemini API key configured: ${Boolean(process.env.GEMINI_API_KEY)}`
  );
});
