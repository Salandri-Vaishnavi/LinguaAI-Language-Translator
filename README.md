# 🌐 LinguaAI – Language Translation Application

**LinguaAI** is a web-based language translation application developed using Python and Flask. It enables users to translate text between multiple languages through an external translation API. It also provides text-to-speech functionality, allowing users to listen to both their original and translated text.

The application is designed with a simple and user-friendly interface to make multilingual communication easier and more accessible.

## ✨ Features

- **Multi-Language Translation:** Translate text across 15 configured languages.
- **Automatic Language Detection:** Automatically identifies several source languages based on their writing systems.
- **Text-to-Speech:** Listen to original and translated text using Google Text-to-Speech (gTTS).
- **Language Selection:** Choose source and target languages using dropdown menus.
- **Swap Languages:** Quickly switch the selected source and target languages.
- **Copy Translation:** Copy translated text with a single click.
- **Clear Text:** Clear the input and output fields.
- **Character Counter:** Displays the number of entered characters, with a maximum limit of 5,000.
- **Error Handling:** Provides helpful messages for invalid inputs and service errors.
- **Responsive User Interface:** Designed for convenient interaction through the web interface.

## 🖥️ Project Screenshots

### 1. LinguaAI Homepage

The main interface provides language selection, text input, translation controls and the translated output area.

![LinguaAI Homepage](screenshots/01-homepage.png)

### 2. English to Telugu Translation

Demonstrates the translation of English text into Telugu.

![English to Telugu Translation](screenshots/02-english-to-telugu.png)

### 3. Multiple Language Translation

Demonstrates the application's language selection and multilingual translation functionality.

![Multiple Language Translation](screenshots/03-multiple-languages.png)

### 4. Text-to-Speech Functionality

Allows users to listen to the original input and translated output using audio playback.

![Text-to-Speech](screenshots/04-text-to-speech.png)

### 5. Language Controls

Demonstrates the language selection, language swapping and other text management controls.

![Language Controls](screenshots/05-language-controls.png)

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| Flask | Web application framework |
| HTML5 | Webpage structure |
| CSS3 | Styling and layout |
| JavaScript | Frontend functionality |
| MyMemory Translation API | Text translation |
| Google Text-to-Speech (gTTS) | Audio generation |
| Requests | HTTP API communication |

## 🌍 Supported Languages

LinguaAI provides 15 configured language options:

1. English
2. Telugu
3. Hindi
4. Tamil
5. Kannada
6. Malayalam
7. French
8. Spanish
9. German
10. Japanese
11. Chinese
12. Arabic
13. Portuguese
14. Russian
15. Korean

Translation availability depends on the external translation service. Text-to-speech availability depends on the language support provided by the installed gTTS version.

## 📁 Project Structure

```text
language-translation/
│
├── app.py
├── requirements.txt
├── README.md
│
├── templates/
│   └── index.html
│
├── static/
│   ├── style.css
│   └── script.js
│
└── screenshots/
    ├── 01-homepage.png
    ├── 02-english-to-telugu.png
    ├── 03-multiple-languages.png
    ├── 04-text-to-speech.png
    └── 05-language-controls.png
```

## ⚙️ Installation and Setup

Follow these steps to run LinguaAI on your local machine.

### Prerequisites

- Python 3.10 or later
- pip (Python package manager)
- Internet connection
- A modern web browser

### Step 1: Clone the Repository

```bash
git 
```

(https://github.com/Salandri-Vaishnavi/LinguaAI-Language-Translator.git)

### Step 2: Navigate to the Project Folder

```bash
cd language-translation
```

### Step 3: Create a Virtual Environment

```bash
python -m venv .venv
```

### Step 4: Activate the Virtual Environment

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

### Step 5: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 6: Run the Application

```bash
python app.py
```

### Step 7: Open the Application

Open your browser and visit:

```text
http://127.0.0.1:5000
```

LinguaAI is now ready to use!

## 🚀 How to Use

1. Open LinguaAI in your web browser.
2. Enter the text you want to translate.
3. Select the source language or choose automatic detection.
4. Select your desired target language.
5. Click the **Translate Text** button.
6. View the translated result.
7. Use the speaker button to listen to the original or translated text.
8. Use the copy button to copy the translated output.
9. Use the swap button to exchange the source and target languages.

## 🔌 APIs and External Services

**MyMemory Translation API**

LinguaAI uses the MyMemory Translation API to process translation requests and return translated text.

API endpoint:

https://api.mymemory.translated.net/get

**Google Text-to-Speech (gTTS)**

The gTTS Python library generates MP3 audio from text, enabling users to listen to supported languages.

Both services require an active internet connection.

## ⚠️ Limitations

- Translation accuracy depends on the external translation service.
- Automatic language detection is less reliable for short phrases and languages using similar writing systems.
- Text-to-speech availability depends on gTTS language support.
- External API availability and response times may vary.
- The application currently supports text translation rather than document or image translation.

## 🔮 Future Enhancements

- Improve automatic language detection.
- Add translation history and saved translations.
- Introduce user authentication and personalized settings.
- Support document translation.
- Add additional translation providers.
- Improve audio playback controls.
- Deploy the application online for public access.

## 🎯 Project Objective

The main objective of LinguaAI is to develop an accessible language translation platform that simplifies communication across different languages by integrating translation and speech technologies into a single web application.

## 👩‍💻 Developer

**Developed as part of the SAM AI Internship Program.**

**Project Name:** LinguaAI – Language Translation Application

