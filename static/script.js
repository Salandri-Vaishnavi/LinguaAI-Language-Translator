
// ==========================================
// LINGUAAI - LANGUAGE TRANSLATOR
// ==========================================

// Language elements
const sourceLanguage = document.getElementById("sourceLanguage");
const targetLanguage = document.getElementById("targetLanguage");

// Text elements
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");

// Buttons
const translateButton = document.getElementById("translateButton");
const translateButtonText = document.getElementById("translateButtonText");
const clearButton = document.getElementById("clearButton");
const swapButton = document.getElementById("swapButton");
const copyButton = document.getElementById("copyButton");

// Audio buttons
const sourceSpeakButton = document.getElementById("inputSpeakButton");
const targetSpeakButton = document.getElementById("speakButton");

// Information elements
const characterCount = document.getElementById("characterCount");
const resultLanguage = document.getElementById("resultLanguage");
const message = document.getElementById("message");

// ==========================================
// LANGUAGE NAMES
// ==========================================

const languageNames = {
    en: "English",
    te: "Telugu",
    hi: "Hindi",
    ta: "Tamil",
    kn: "Kannada",
    ml: "Malayalam",
    fr: "French",
    es: "Spanish",
    de: "German",
    ja: "Japanese",
    "zh-CN": "Chinese",
    ar: "Arabic",
    pt: "Portuguese",
    ru: "Russian",
    ko: "Korean"
};

// ==========================================
// APPLICATION VARIABLES
// ==========================================

let lastTranslatedText = "";
let lastTargetLanguage = "";
let lastDetectedSourceLanguage = "";

let currentAudio = null;
let currentAudioUrl = null;

let translationRequestId = 0;
let audioRequestId = 0;

// ==========================================
// MESSAGE HANDLING
// ==========================================

function showMessage(text, type = "info") {
    message.textContent = text;
    message.className = `message ${type}`;
}

// ==========================================
// TRANSLATION STATE
// ==========================================

function clearPreviousTranslation() {
    lastTranslatedText = "";
    lastTargetLanguage = "";
    lastDetectedSourceLanguage = "";

    outputText.textContent = "";
    resultLanguage.textContent = "Waiting for translation";
}

function invalidateTranslation() {
    translationRequestId++;

    clearPreviousTranslation();
    stopAudio();
}

// ==========================================
// CHARACTER COUNT
// ==========================================

function updateCharacterCount() {
    characterCount.textContent = `${inputText.value.length} / 5000`;
}

inputText.addEventListener("input", () => {
    updateCharacterCount();
    invalidateTranslation();
});

// ==========================================
// AUDIO MANAGEMENT
// ==========================================

function stopAudio() {
    // Invalidate any audio request still in progress.
    audioRequestId++;

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.removeAttribute("src");
        currentAudio.load();
        currentAudio = null;
    }

    if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
        currentAudioUrl = null;
    }

    sourceSpeakButton.disabled = false;
    targetSpeakButton.disabled = false;
}

async function speakText(text, language, button) {
    if (!text || !text.trim()) {
        showMessage(
            "There is no text available to listen to.",
            "error"
        );
        return;
    }

    if (!language || language === "auto") {
        showMessage(
            "Please translate the text first so the source language can be identified.",
            "error"
        );
        return;
    }

    // Stop previous audio before starting another request.
    stopAudio();

    const currentRequestId = audioRequestId;

    sourceSpeakButton.disabled = true;
    targetSpeakButton.disabled = true;

    showMessage("Generating audio. Please wait...", "info");

    try {
        const response = await fetch("/speak", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: text,
                language: language
            })
        });

        if (currentRequestId !== audioRequestId) {
            return;
        }

        if (!response.ok) {
            let errorMessage = "Unable to generate audio.";

            try {
                const errorData = await response.json();

                errorMessage =
                    errorData.error || errorMessage;

            } catch (error) {
                // Keep the default message.
            }

            throw new Error(errorMessage);
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("audio")) {
            throw new Error(
                "The server did not return a valid audio file."
            );
        }

        const audioBlob = await response.blob();

        if (!audioBlob.size) {
            throw new Error(
                "The audio service returned an empty file."
            );
        }

        if (currentRequestId !== audioRequestId) {
            return;
        }

        currentAudioUrl = URL.createObjectURL(audioBlob);
        currentAudio = new Audio(currentAudioUrl);

        const audioElement = currentAudio;

        audioElement.onended = () => {
            if (currentRequestId !== audioRequestId) {
                return;
            }

            stopAudio();
            showMessage("Audio playback completed.", "success");
        };

        audioElement.onerror = () => {
            if (currentRequestId !== audioRequestId) {
                return;
            }

            stopAudio();

            showMessage(
                "Unable to play the generated audio.",
                "error"
            );
        };

        await audioElement.play();

        if (currentRequestId !== audioRequestId) {
            return;
        }

        showMessage(
            `Playing ${languageNames[language] || language} audio...`,
            "success"
        );

    } catch (error) {
        if (currentRequestId !== audioRequestId) {
            return;
        }

        console.error("Audio Error:", error);

        stopAudio();

        showMessage(
            error.message || "Audio generation failed. Please try again.",
            "error"
        );
    }
}

// Original text audio
sourceSpeakButton.addEventListener("click", () => {
    let language = sourceLanguage.value;

    // If automatic detection was selected, use the language
    // detected during the latest successful translation.
    if (language === "auto") {
        language = lastDetectedSourceLanguage;
    }

    speakText(
        inputText.value.trim(),
        language,
        sourceSpeakButton
    );
});

// Translated text audio
targetSpeakButton.addEventListener("click", () => {
    if (!lastTranslatedText || !lastTargetLanguage) {
        showMessage(
            "Please translate the text before listening.",
            "error"
        );
        return;
    }

    speakText(
        lastTranslatedText,
        lastTargetLanguage,
        targetSpeakButton
    );
});

// ==========================================
// TRANSLATION
// ==========================================

translateButton.addEventListener("click", async () => {
    const text = inputText.value.trim();
    const source = sourceLanguage.value;
    const target = targetLanguage.value;

    if (!text) {
        showMessage(
            "Please enter some text to translate.",
            "error"
        );
        return;
    }

    if (text.length > 5000) {
        showMessage(
            "Text cannot exceed 5000 characters.",
            "error"
        );
        return;
    }

    if (!target) {
        showMessage(
            "Please select a target language.",
            "error"
        );
        return;
    }

    if (source === target) {
        clearPreviousTranslation();

        outputText.textContent = text;

        lastTranslatedText = text;
        lastTargetLanguage = target;
        lastDetectedSourceLanguage = source;

        resultLanguage.textContent =
            languageNames[target] || target;

        showMessage(
            "Source and target languages are the same.",
            "success"
        );

        return;
    }

    // Cancel any older translation or audio operation.
    invalidateTranslation();

    const currentRequestId = translationRequestId;

    const originalText = text;
    const originalSource = source;
    const originalTarget = target;

    translateButton.disabled = true;
    translateButtonText.textContent = "Translating...";

    showMessage("Translating your text...", "info");

    try {
        const response = await fetch("/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: originalText,
                source: originalSource,
                target: originalTarget
            })
        });

        const data = await response.json();

        // Ignore outdated responses.
        if (currentRequestId !== translationRequestId) {
            return;
        }

        if (!response.ok) {
            throw new Error(
                data.error || "Translation failed. Please try again."
            );
        }

        if (
            typeof data.translated_text !== "string" ||
            !data.translated_text.trim()
        ) {
            throw new Error(
                "The translation service returned an empty result."
            );
        }

        // Make sure the displayed input and selections
        // still match the request that was sent.
        if (
            inputText.value.trim() !== originalText ||
            sourceLanguage.value !== originalSource ||
            targetLanguage.value !== originalTarget
        ) {
            return;
        }

        outputText.textContent = data.translated_text;

        lastTranslatedText = data.translated_text;
        lastTargetLanguage = data.target_language || originalTarget;
        lastDetectedSourceLanguage =
            data.source_language || originalSource;

        resultLanguage.textContent =
            languageNames[lastTargetLanguage] || lastTargetLanguage;

        showMessage(
            "Translation completed successfully.",
            "success"
        );

    } catch (error) {
        if (currentRequestId !== translationRequestId) {
            return;
        }

        console.error("Translation Error:", error);

        showMessage(
            error.message || "Unable to translate text.",
            "error"
        );

    } finally {
        if (currentRequestId === translationRequestId) {
            translateButton.disabled = false;
            translateButtonText.textContent = "Translate Text";
        }
    }
});

// ==========================================
// CLEAR TEXT
// ==========================================

clearButton.addEventListener("click", () => {
    invalidateTranslation();

    inputText.value = "";

    updateCharacterCount();

    showMessage("", "info");
});

// ==========================================
// SWAP LANGUAGES
// ==========================================

swapButton.addEventListener("click", () => {
    if (sourceLanguage.value === "auto") {
        showMessage(
            "Please select a source language before swapping.",
            "error"
        );
        return;
    }

    if (!lastTranslatedText) {
        showMessage(
            "Please translate the text before swapping languages.",
            "error"
        );
        return;
    }

    const previousSource = sourceLanguage.value;
    const previousTarget = targetLanguage.value;
    const translatedText = lastTranslatedText;

    invalidateTranslation();

    inputText.value = translatedText;

    sourceLanguage.value = previousTarget;
    targetLanguage.value = previousSource;

    updateCharacterCount();

    showMessage(
        "Languages swapped successfully. Translate again to continue.",
        "success"
    );
});

// ==========================================
// LANGUAGE SELECTION CHANGES
// ==========================================

sourceLanguage.addEventListener("change", () => {
    invalidateTranslation();

    showMessage(
        "Source language changed. Translate again to continue.",
        "info"
    );
});

targetLanguage.addEventListener("change", () => {
    invalidateTranslation();

    showMessage(
        "Target language changed. Translate again to continue.",
        "info"
    );
});

// ==========================================
// COPY TRANSLATION
// ==========================================

copyButton.addEventListener("click", async () => {
    const text = outputText.textContent.trim();

    if (!text) {
        showMessage(
            "There is no translated text to copy.",
            "error"
        );
        return;
    }

    try {
        await navigator.clipboard.writeText(text);

        showMessage(
            "Translated text copied successfully.",
            "success"
        );

    } catch (error) {
        console.error("Copy Error:", error);

        showMessage(
            "Unable to copy text. Please try again.",
            "error"
        );
    }
});

// ==========================================
// CLEANUP
// ==========================================

window.addEventListener("beforeunload", () => {
    if (currentAudio) {
        currentAudio.pause();
    }

    if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
    }
});

// ==========================================
// INITIALIZE
// ==========================================

updateCharacterCount();

console.log("LinguaAI initialized successfully.");
