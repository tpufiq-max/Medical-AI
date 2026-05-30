from PIL import Image
import pytesseract
import re

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# 🔥 ADD FUNCTION HERE
def extract_medicine_name(text):
    lines = text.split("\n")

    for line in lines:
        line = line.strip()

        if len(line) > 3 and not any(char.isdigit() for char in line):
            return line

    return text.split()[0] if text else "Unknown"

# 🔥 YOUR EXISTING CODE
img = Image.open("test.png")
text = pytesseract.image_to_string(img)

medicine_name = extract_medicine_name(text)

print("Detected Medicine:", medicine_name)
print("TEXT:", text)