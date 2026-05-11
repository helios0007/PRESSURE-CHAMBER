# Pressure Chamber - AI Bias Experiment

Interactive local exhibition install that demonstrates bias in generative AI systems.

## Stack
- Frontend: HTML, CSS, JavaScript (SPA)
- Backend: Python Flask
- Image generation: Gemini API (with local mock fallback when unavailable)
- Similarity: CLIP ViT-B/32 (`openai/clip-vit-base-patch32`), with fallback scorer
- Data storage: JSON files

## Project Structure
```text
pressure-chamber/
  backend/
    app.py
    image_generator.py
    similarity.py
    clip_model.py
    fallback_similarity.py
  data/
    tasks.json
    leaderboard.json
    translations.json
  images/
    targets/
    generated/
  frontend/
    index.html
    style.css
    app.js
    noise.png
  requirements.txt
```

## Run Locally
1. Create and activate a virtual environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Optional for real Gemini generation:
   - Set `GEMINI_API_KEY` in your environment.
4. Start app:
   ```bash
   python backend/app.py
   ```
5. Open:
   - `http://127.0.0.1:5000`

## Notes
- If Gemini is not configured, `/generate` still works using a mock image renderer so the full installation flow can be tested.
- Add real target images in `images/targets/` for exhibition-quality results.