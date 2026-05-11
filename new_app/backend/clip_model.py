from functools import lru_cache

import torch
from PIL import Image


@lru_cache(maxsize=1)
def _load_clip():
    from transformers import CLIPModel, CLIPProcessor

    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    model.eval()
    return model, processor


def clip_similarity(image_a_path, image_b_path):
    model, processor = _load_clip()
    img_a = Image.open(image_a_path).convert("RGB")
    img_b = Image.open(image_b_path).convert("RGB")

    with torch.no_grad():
        inputs_a = processor(images=img_a, return_tensors="pt")
        inputs_b = processor(images=img_b, return_tensors="pt")

        emb_a = model.get_image_features(**inputs_a)
        emb_b = model.get_image_features(**inputs_b)

        emb_a = emb_a / emb_a.norm(dim=-1, keepdim=True)
        emb_b = emb_b / emb_b.norm(dim=-1, keepdim=True)

        score = (emb_a @ emb_b.T).item()
        return max(0.0, min(1.0, (score + 1.0) / 2.0))