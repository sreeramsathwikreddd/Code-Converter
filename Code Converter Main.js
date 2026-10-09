const $ = (id) => document.getElementById(id);
const sourceLanguage = $("sourceLanguage");
const targetLanguage = $("targetLanguage");
const sourceCode = $("sourceCode");
const outputCode = $("outputCode");
const convertButton = $("convertButton");
const copyButton = $("copyButton");
const messageRow = $("messageRow");
const messageText = $("messageText");
const exampleCode = `def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))`;

function setMessage(text, type = "") {
  messageText.textContent = text;
  messageRow.className = `message-row ${type}`.trim();
}
function updateCounts() {
  const source = sourceCode.value;
  const output = outputCode.value;
  $("sourceCount").textContent = `${source ? source.split("\n").length : 0} lines · ${source.length} chars`;
  $("outputCount").textContent = output ? `${output.split("\n").length} lines · ${output.length} chars` : "Waiting for conversion";
  $("outputLanguageLabel").textContent = targetLanguage.value;
  $("sourceMeta").textContent = source ? "Ready to convert" : "Paste your code below";
  copyButton.disabled = !output.trim();
}
function setBusy(busy) {
  convertButton.disabled = busy;
  convertButton.innerHTML = busy ? '<span class="convert-icon">◌</span> Converting…' : '<span class="convert-icon">✦</span> Convert code <span class="shortcut">⌘ ↵</span>';
}
async function convert() {
  const code = sourceCode.value.trim();
  if (!code) {
    setMessage("Paste some source code first, then choose your target language.", "error");
    sourceCode.focus();
    return;
  }
  if (sourceLanguage.value === targetLanguage.value) {
    setMessage("Source and target languages are the same. Choose a different target language.", "error");
    return;
  }
  setBusy(true);
  setMessage(`Converting ${sourceLanguage.value} to ${targetLanguage.value}…`);
  outputCode.value = "";
  updateCounts();
  try {
    const response = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, sourceLanguage: sourceLanguage.value, targetLanguage: targetLanguage.value })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    if (!data.convertedCode || !data.convertedCode.trim()) throw new Error("The conversion service returned an empty result. Please try again.");
    outputCode.value = data.convertedCode.trim();
    $("outputMeta").textContent = "Conversion complete · Review before use";
    updateCounts();
    setMessage("Conversion complete. Review and run the output with representative test cases before relying on it.", "success");
  } catch (error) {
    setMessage(error.message || "Conversion failed. Check your connection and configuration.", "error");
  } finally {
    setBusy(false);
  }
}
convertButton.addEventListener("click", convert);
sourceCode.addEventListener("input", updateCounts);
targetLanguage.addEventListener("change", updateCounts);
$("clearButton").addEventListener("click", () => {
  sourceCode.value = "";
  outputCode.value = "";
  $("outputMeta").textContent = "Your result appears here";
  setMessage("Editors cleared. Paste your code when you're ready.");
  updateCounts();
  sourceCode.focus();
});
$("exampleButton").addEventListener("click", () => {
  sourceLanguage.value = "Python";
  targetLanguage.value = "C++";
  sourceCode.value = exampleCode;
  outputCode.value = "";
  $("outputMeta").textContent = "Your result appears here";
  setMessage("Example loaded. Click Convert code to translate it to C++.");
  updateCounts();
});
copyButton.addEventListener("click", async () => {
  if (!outputCode.value) return;
  try {
    await navigator.clipboard.writeText(outputCode.value);
    copyButton.textContent = "✓ Copied";
    setTimeout(() => { copyButton.textContent = "▢ Copy"; }, 1500);
  } catch {
    outputCode.focus();
    outputCode.select();
    setMessage("Clipboard access was blocked. Select the output and copy it manually.", "error");
  }
});
$("swapButton").addEventListener("click", () => {
  const source = sourceLanguage.value;
  const target = targetLanguage.value;
  if (source === "Auto-detect") {
    setMessage("Choose a specific source language before swapping.", "error");
    return;
  }
  sourceLanguage.value = target;
  if (![...targetLanguage.options].some((option) => option.value === source)) {
    setMessage(`${source} is not available as a target language.`, "error");
    sourceLanguage.value = source;
    return;
  }
  targetLanguage.value = source;
  updateCounts();
  setMessage("Languages swapped. The code in the editors has not been changed.");
});
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    convert();
  }
});
updateCounts();