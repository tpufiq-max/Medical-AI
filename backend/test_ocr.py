import os
import sys

from app import extract_medicine_name, extract_text_from_image


if __name__ == "__main__":
    image_path = sys.argv[1] if len(sys.argv) > 1 else "test.png"
    if not os.path.exists(image_path):
        raise SystemExit(f"Image not found: {image_path}")
    if not os.getenv("OCR_SPACE_API_KEY"):
        raise SystemExit("Set OCR_SPACE_API_KEY before running the OCR smoke test.")

    with open(image_path, "rb") as image:
        raw_text = extract_text_from_image(image)

    if not raw_text:
        raise SystemExit("OCR did not detect any text in the image.")

    print("OCR RAW TEXT:", raw_text)
    print("Detected Medicine:", extract_medicine_name(raw_text))
