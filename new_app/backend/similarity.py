import os

from fallback_similarity import FallbackSimilarity


def calculate_similarity_score(generated_path, target_path):
    use_clip = os.getenv("ENABLE_CLIP", "").strip().lower() in {"1", "true", "yes"}

    if use_clip:
        try:
            from clip_model import clip_similarity

            similarity = clip_similarity(generated_path, target_path)
        except Exception:
            similarity = FallbackSimilarity.score(generated_path, target_path)
    else:
        similarity = FallbackSimilarity.score(generated_path, target_path)

    return int(round(similarity * 100))