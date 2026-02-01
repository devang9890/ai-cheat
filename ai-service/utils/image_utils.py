import base64
import re
import cv2
import numpy as np

def base64_to_image(base64_str: str):
    # 1. Handle Data URI Scheme (e.g., "data:image/jpeg;base64,")
    if "," in base64_str:
        base64_str = re.sub(r'^data:image/.+;base64,', '', base64_str)

    try:
        # 2. Decode Base64
        image_bytes = base64.b64decode(base64_str)
        np_arr = np.frombuffer(image_bytes, np.uint8)

        # 3. Decode Image and Validate
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Invalid image data: failed to decode.")
        
        return image

    except (base64.binascii.Error, ValueError) as e:
        # Re-raise with a clear message for the API layer
        raise ValueError(f"Invalid base64 string or image format: {e}")

