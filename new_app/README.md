# New App - Pressure Chamber

This is the updated cinematic version of the Pressure Chamber AI Bias Experiment.

It includes:
- Flask backend
- HTML/CSS/JavaScript frontend
- Intro and instruction videos
- Bias Test screen with cinematic image background
- Interactive Three.js particle globe on the intro/ambient screens
- Local JSON data storage
- Gemini API support with offline fallback behavior

## Requirements

Install these before running the app:

- Python 3.10 or newer
- pip
- A modern browser, such as Chrome, Edge, or Firefox

Optional:

- `GEMINI_API_KEY` if you want real Gemini image generation behavior.
- Without the key, the app still runs for local testing.

## Folder

From the repository root, the app lives here:

```powershell
cd new_app
```

If you are starting from the full project path:

```powershell
cd C:\Users\User\github-classroom\Data_for_AI\pressure-chamber\new_app
```

## First-Time Setup

Create a virtual environment:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

## Optional Gemini Setup

If you have a Gemini API key, set it before starting the app:

```powershell
$env:GEMINI_API_KEY="your_api_key_here"
```

This environment variable is only set for the current terminal window.

## Run The App

Start the Flask server:

```powershell
python backend/app.py
```

Open this URL in your browser:

```text
http://127.0.0.1:5000
```

The app also prints the local network URL in the terminal, for example:

```text
http://192.168.x.x:5000
```

Use that network URL if you want to open the app from another device on the same Wi-Fi network.

## Stop The App

In the terminal running the server, press:

```text
Ctrl + C
```

## Important Files

```text
new_app/
  backend/
    app.py                    Flask server and API routes
    image_generator.py         image generation / fallback logic
    similarity.py              similarity scoring
    clip_model.py              CLIP model helper
    fallback_similarity.py     fallback scoring helper
    captions.md                captions for bias tasks

  frontend/
    index.html                 page structure
    style.css                  cinematic UI styling
    app.js                     app logic and screen flow
    globe-background.js        Three.js particle globe background
    media/
      intro-video.mp4
      instruction-video.mp4

  data/
    tasks.json
    tasks_2.json
    translations.json
    leaderboard.json
    prompt_logs.json
    bias_explanations.json

  images/
    targets/                   target images
    tasks/                     task user input images
    new_test_target/           Bias Test target/background images
```

## Visual System Notes

The app uses two separate visual systems:

- Intro/welcome/ambient screens use the interactive Three.js particle globe.
- Bias Test screen keeps the cinematic city/image background and overlays the glass UI panel on top.

Do not replace the Bias Test background image with the globe. Both systems are meant to coexist.

## Troubleshooting

If port `5000` is already in use, stop the existing Flask/Python process first.

In PowerShell, you can inspect port usage with:

```powershell
netstat -ano | Select-String ':5000'
```

If dependencies fail to install, make sure your virtual environment is active and then retry:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If the videos do not load, confirm these files exist:

```text
frontend/media/intro-video.mp4
frontend/media/instruction-video.mp4
```

If the globe does not appear, check that the browser has internet access. The app loads Three.js from a CDN in `frontend/index.html`.

## Quick Run After Setup

Once dependencies are installed, future runs are just:

```powershell
cd C:\Users\User\github-classroom\Data_for_AI\pressure-chamber\new_app
.\.venv\Scripts\Activate.ps1
python backend/app.py
```

Then open:

```text
http://127.0.0.1:5000
```
