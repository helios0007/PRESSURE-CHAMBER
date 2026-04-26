import numpy as np
from PIL import Image


class FallbackSimilarity:
    @staticmethod
    def score(image_a_path, image_b_path):
        a = Image.open(image_a_path).convert("RGB").resize((224, 224))
        b = Image.open(image_b_path).convert("RGB").resize((224, 224))
        a_arr = np.asarray(a, dtype=np.float32) / 255.0
        b_arr = np.asarray(b, dtype=np.float32) / 255.0
        mse = float(np.mean((a_arr - b_arr) ** 2))
        return max(0.0, 1.0 - mse * 2.0)