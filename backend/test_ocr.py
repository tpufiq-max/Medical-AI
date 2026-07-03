import os
from PIL import Image
import pytesseract

# ================= TESSERACT =================
# Only set the Windows binary path when actually running on Windows.
# On Linux/Mac (and Render), tesseract is resolved from PATH instead.
if os.name == "nt":
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def extract_medicine_name(text: str) -> str:
    lines = text.split("\n")

    for line in lines:
        line = line.strip()

        if len(line) > 3 and not any(char.isdigit() for char in line):
            return line

    words = text.split()
    return words[0].strip() if words else "Unknown"


if __name__ == "__main__":
    IMAGE_PATH = "test.png"

    if not os.path.exists(IMAGE_PATH):
        print(f"ERROR: '{IMAGE_PATH}' not found. Put it next to this script or update IMAGE_PATH.")
    else:
        img = Image.open(IMAGE_PATH)
        text = pytesseract.image_to_string(img)

        medicine_name = extract_medicine_name(text)

        print("Detected Medicine:", medicine_name)
        print("TEXT:", text)