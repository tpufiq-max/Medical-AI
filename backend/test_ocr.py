import os
import re
from PIL import Image, ImageEnhance
import easyocr

reader = None

def get_reader():
    global reader
    if reader is None:
        reader = easyocr.Reader(['en'], gpu=False)
    return reader


def preprocess_image(image_path):
    img = Image.open(image_path).convert("L")

    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2)

    img = img.point(lambda x: 0 if x < 140 else 255)

    temp_path = "processed_test.png"
    img.save(temp_path)

    return temp_path


def extract_medicine_name(text):
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    for line in lines:
        clean = re.sub(r"[^a-zA-Z0-9\s]", "", line)

        if len(clean) < 3:
            continue

        if re.search(r"[A-Za-z]{3,}", clean):
            return clean

    return "Unknown"


if __name__ == "__main__":
    IMAGE_PATH = "test.png"

    if not os.path.exists(IMAGE_PATH):
        print(f"ERROR: {IMAGE_PATH} not found")
    else:
        processed_path = preprocess_image(IMAGE_PATH)
        try:
            reader = get_reader()
            results = reader.readtext(processed_path, detail=0, paragraph=False)

            raw_text = " ".join(results).strip()
        finally:
            if os.path.exists(processed_path):
                os.remove(processed_path)

        medicine_name = extract_medicine_name(raw_text)

        print("OCR RAW TEXT:", raw_text)
        print("Detected Medicine:", medicine_name)