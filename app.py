
from io import BytesIO
from html import unescape
from functools import lru_cache

import requests

from flask import Flask, request, jsonify, render_template, send_file
from gtts import gTTS
from gtts.lang import tts_langs


app = Flask(__name__)

# --------------------------------------------------
# SUPPORTED LANGUAGES
# --------------------------------------------------

LANGUAGES = {
    "English": "en",
    "Telugu": "te",
    "Hindi": "hi",
    "Tamil": "ta",
    "Kannada": "kn",
    "Malayalam": "ml",
    "French": "fr",
    "Spanish": "es",
    "German": "de",
    "Japanese": "ja",
    "Chinese": "zh-CN",
    "Arabic": "ar",
    "Portuguese": "pt",
    "Russian": "ru",
    "Korean": "ko"
}

API_URL = "https://api.mymemory.translated.net/get"

MAX_TEXT_LENGTH = 5000
TRANSLATION_CHUNK_SIZE = 450

# Get the languages supported by the installed gTTS version.
SUPPORTED_TTS_LANGUAGES = tts_langs()


@app.route("/")
def home():
    return render_template("index.html", languages=LANGUAGES)


# --------------------------------------------------
# AUTOMATIC SOURCE-LANGUAGE DETECTION
# --------------------------------------------------

def detect_source_language(text):
    """
    Detect languages with distinctive writing systems.

    Latin-script languages cannot be reliably distinguished
    using this simple method. Latin text defaults to English.
    For French, Spanish, German and Portuguese, users should
    select the source language manually.
    """

    counts = {
        "te": 0,
        "hi": 0,
        "ta": 0,
        "kn": 0,
        "ml": 0,
        "ar": 0,
        "ja": 0,
        "zh-CN": 0,
        "ko": 0,
        "ru": 0
    }

    for character in text:
        code = ord(character)

        if 0x0C00 <= code <= 0x0C7F:
            counts["te"] += 1

        elif 0x0900 <= code <= 0x097F:
            counts["hi"] += 1

        elif 0x0B80 <= code <= 0x0BFF:
            counts["ta"] += 1

        elif 0x0C80 <= code <= 0x0CFF:
            counts["kn"] += 1

        elif 0x0D00 <= code <= 0x0D7F:
            counts["ml"] += 1

        elif 0x0600 <= code <= 0x06FF:
            counts["ar"] += 1

        elif (
            0x3040 <= code <= 0x30FF
            or 0x31F0 <= code <= 0x31FF
        ):
            counts["ja"] += 1

        elif 0x4E00 <= code <= 0x9FFF:
            counts["zh-CN"] += 1

        elif 0xAC00 <= code <= 0xD7AF:
            counts["ko"] += 1

        elif 0x0400 <= code <= 0x04FF:
            counts["ru"] += 1

    detected_language = max(counts, key=counts.get)

    if counts[detected_language] > 0:
        return detected_language

    # Latin-script text defaults to English.
    if any(character.isalpha() for character in text):
        return "en"

    return None


# --------------------------------------------------
# TEXT CHUNKING
# --------------------------------------------------

def split_text(text, max_length=TRANSLATION_CHUNK_SIZE):
    """
    Split long text into smaller pieces without
    unnecessarily breaking words.
    """

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + max_length, len(text))

        if end < len(text):
            split_position = text.rfind(" ", start, end)

            if split_position > start:
                end = split_position + 1

        chunks.append(text[start:end])
        start = end

    return chunks


# --------------------------------------------------
# TRANSLATION API
# --------------------------------------------------

def translate_chunk(text, source, target):
    """Translate one text chunk using MyMemory."""

    params = {
        "q": text,
        "langpair": f"{source}|{target}"
    }

    response = requests.get(
        API_URL,
        params=params,
        timeout=(10, 30)
    )

    response.raise_for_status()

    result = response.json()

    response_status = result.get("responseStatus")

    if str(response_status) != "200":
        error_message = (
            result.get("responseDetails")
            or "The translation service could not process this language pair."
        )

        raise ValueError(error_message)

    response_data = result.get("responseData") or {}

    translated_text = response_data.get("translatedText", "")

    if not translated_text or not translated_text.strip():

        # Try a valid translation match if the main
        # translatedText field is empty.
        for match in result.get("matches", []):
            candidate = match.get("translation", "")

            if candidate and candidate.strip():
                translated_text = candidate
                break

    if not translated_text or not translated_text.strip():
        raise ValueError(
            "The translation service returned an empty result."
        )

    return unescape(translated_text).strip()


def translate_full_text(text, source, target):
    """
    Translate chunks sequentially to reduce API
    rate-limit issues and preserve their original order.
    """

    chunks = split_text(text)

    translated_chunks = []

    for chunk in chunks:
        translated_chunk = translate_chunk(
            chunk,
            source,
            target
        )

        translated_chunks.append(translated_chunk)

    return " ".join(
        part for part in translated_chunks if part
    )


# --------------------------------------------------
# TRANSLATION ROUTE
# --------------------------------------------------

@app.route("/translate", methods=["POST"])
def translate():

    try:
        data = request.get_json(silent=True) or {}

        text = data.get("text", "")
        source = data.get("source", "auto")
        target = data.get("target", "te")

        if not isinstance(text, str):
            return jsonify({
                "error": "Please enter valid text."
            }), 400

        text = text.strip()

        if not text:
            return jsonify({
                "error": "Please enter text to translate."
            }), 400

        if len(text) > MAX_TEXT_LENGTH:
            return jsonify({
                "error": "Please enter no more than 5000 characters."
            }), 400

        if source != "auto" and source not in LANGUAGES.values():
            return jsonify({
                "error": "Invalid source language."
            }), 400

        if target not in LANGUAGES.values():
            return jsonify({
                "error": "Invalid target language."
            }), 400

        # Resolve automatic source-language detection.
        if source == "auto":

            detected_source = detect_source_language(text)

            if detected_source is None:
                return jsonify({
                    "error": "We could not detect the source language. Please select it manually."
                }), 400

            source = detected_source

        # Avoid unnecessary API calls.
        if source == target:
            return jsonify({
                "translated_text": text,
                "source_language": source,
                "target_language": target
            })

        translated_text = translate_full_text(
            text,
            source,
            target
        )

        return jsonify({
            "translated_text": translated_text,
            "source_language": source,
            "target_language": target
        })

    except requests.Timeout:
        app.logger.warning(
            "Translation API request timed out."
        )

        return jsonify({
            "error": "The translation service took too long to respond. Please try again."
        }), 504

    except requests.RequestException:
        app.logger.exception(
            "Translation API connection failed."
        )

        return jsonify({
            "error": "Could not connect to the translation service. Check your internet connection and try again."
        }), 502

    except ValueError as error:
        app.logger.warning(
            "Translation error: %s", error
        )

        return jsonify({
            "error": str(error)
        }), 502

    except Exception:
        app.logger.exception(
            "Unexpected translation error."
        )

        return jsonify({
            "error": "An unexpected error occurred. Please try again."
        }), 500


# --------------------------------------------------
# TEXT-TO-SPEECH
# --------------------------------------------------

@lru_cache(maxsize=16)
def generate_audio(text, language):
    """
    Generate MP3 audio using Google Text-to-Speech.
    Recently generated audio is cached.
    """

    audio_file = BytesIO()

    speech = gTTS(
        text=text,
        lang=language,
        slow=False
    )

    speech.write_to_fp(audio_file)

    return audio_file.getvalue()


@app.route("/speak", methods=["POST"])
def speak():

    try:
        data = request.get_json(silent=True) or {}

        text = data.get("text", "")
        language = data.get("language", "")

        if not isinstance(text, str):
            return jsonify({
                "error": "Please provide valid text for audio."
            }), 400

        text = text.strip()

        if not text:
            return jsonify({
                "error": "There is no text available to listen to."
            }), 400

        if len(text) > MAX_TEXT_LENGTH:
            return jsonify({
                "error": "Audio text cannot exceed 5000 characters."
            }), 400

        if language not in LANGUAGES.values():
            return jsonify({
                "error": "Please select a supported language."
            }), 400

        if language not in SUPPORTED_TTS_LANGUAGES:
            return jsonify({
                "error": "Audio is not currently supported for this language in the installed gTTS version."
            }), 400

        audio_data = generate_audio(
            text,
            language
        )

        if not audio_data:
            raise ValueError(
                "The audio service returned an empty file."
            )

        audio_file = BytesIO(audio_data)

        return send_file(
            audio_file,
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name="linguaai_audio.mp3"
        )

    except Exception:
        app.logger.exception(
            "Audio generation failed."
        )

        return jsonify({
            "error": "Unable to generate audio. Please check your internet connection and try again."
        }), 502


# --------------------------------------------------
# RUN APPLICATION
# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
