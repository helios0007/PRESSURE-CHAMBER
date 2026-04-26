import logging
import os
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from pathlib import Path

from PIL import Image, ImageDraw

logger = logging.getLogger(__name__)


def _mock_image(prompt: str, output_path: Path):
    image = Image.new("RGB", (1024, 1024), (8, 16, 40))
    draw = ImageDraw.Draw(image)
    text = (prompt[:120] + "...") if len(prompt) > 120 else prompt
    draw.rectangle([(40, 40), (984, 984)], outline=(96, 165, 250), width=6)
    draw.text((72, 120), "Gemini unavailable", fill=(226, 232, 240))
    draw.text((72, 170), text, fill=(147, 197, 253))
    image.save(output_path)


def _generate_with_gemini(prompt: str, output_path: Path):
    from google import genai
    from google.genai import types

    api_key = (
        os.getenv("GEMINI_API_KEY", "").strip()
        or os.getenv("GOOGLE_API_KEY", "").strip()
        or os.getenv("API_KEY", "").strip()
    )
    if not api_key:
        raise RuntimeError("Missing GEMINI_API_KEY")

    client = genai.Client(api_key=api_key)
    errors = []

    content_models = [
        os.getenv("GEMINI_IMAGE_MODEL", "").strip(),
        "models/gemini-2.5-flash-image",
        "models/gemini-3-pro-image-preview",
        "models/gemini-3.1-flash-image-preview",
        "gemini-2.5-flash-image",
        "gemini-3-pro-image-preview",
        "gemini-3.1-flash-image-preview",
    ]
    content_models = [m for m in content_models if m]

    for model_name in content_models:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"]),
            )

            for candidate in getattr(response, "candidates", []) or []:
                content = getattr(candidate, "content", None)
                if not content:
                    continue
                for part in getattr(content, "parts", []) or []:
                    inline_data = getattr(part, "inline_data", None)
                    if inline_data and getattr(inline_data, "data", None):
                        output_path.write_bytes(inline_data.data)
                        return model_name

            errors.append(f"{model_name}: no image bytes")
        except Exception as exc:
            errors.append(f"{model_name}: {str(exc)}")

    # Imagen models are optional and usually require a paid plan.
    if os.getenv("ENABLE_IMAGEN", "").strip().lower() in {"1", "true", "yes"}:
        image_models = [
            "models/imagen-4.0-generate-001",
            "models/imagen-4.0-ultra-generate-001",
            "models/imagen-4.0-fast-generate-001",
            "imagen-4.0-generate-001",
            "imagen-4.0-ultra-generate-001",
            "imagen-4.0-fast-generate-001",
        ]

        for model_name in image_models:
            try:
                response = client.models.generate_images(
                    model=model_name,
                    prompt=prompt,
                    config=types.GenerateImagesConfig(number_of_images=1),
                )

                for generated in getattr(response, "generated_images", []) or []:
                    image_obj = getattr(generated, "image", None)
                    if not image_obj:
                        continue
                    image_bytes = getattr(image_obj, "image_bytes", None)
                    if image_bytes:
                        output_path.write_bytes(image_bytes)
                        return model_name
                    save_fn = getattr(image_obj, "save", None)
                    if callable(save_fn):
                        save_fn(str(output_path))
                        if output_path.exists() and output_path.stat().st_size > 0:
                            return model_name

                errors.append(f"{model_name}: no image bytes")
            except Exception as exc:
                errors.append(f"{model_name}: {str(exc)}")

    raise RuntimeError("All Gemini image models failed. " + " | ".join(errors))


def generate_image(prompt: str, output_path: Path, timeout_seconds: int = 20):
    output_path.parent.mkdir(parents=True, exist_ok=True)

    def run_generation():
        try:
            model_used = _generate_with_gemini(prompt, output_path)
            return {"provider": "gemini", "model": model_used}
        except Exception as exc:
            logger.exception("Gemini generation failed; using mock fallback.")
            _mock_image(prompt, output_path)
            reason = str(exc).strip() or exc.__class__.__name__
            return {
                "provider": "mock",
                "warning": "Gemini unavailable; mock image generated.",
                "reason": reason[:1000],
            }

    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(run_generation)
        try:
            return future.result(timeout=timeout_seconds)
        except FuturesTimeoutError as exc:
            raise TimeoutError("Image generation timed out") from exc
