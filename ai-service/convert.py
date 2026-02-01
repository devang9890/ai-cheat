import base64

with open("face.jpg", "rb") as f:
    encoded = base64.b64encode(f.read()).decode()

with open("image.txt", "w") as f:
    f.write(encoded)

print("Base64 saved to image.txt")
