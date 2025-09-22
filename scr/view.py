import sys
import numpy as np
from PIL import Image

def main(path):
    with open(path, "rb") as f:
        data = f.read()

    bits = np.unpackbits(np.frombuffer(data, dtype=np.uint8))

    needed = 32 * 24
    if len(bits) < needed:
        raise ValueError(f"File too small: need {needed} bits, got {len(bits)}")

    grid = bits[:needed].reshape((24, 32))

    img = Image.fromarray(grid * 255).convert("L")
    img = img.resize((320, 240), Image.NEAREST)
    img.show()  # directly open the image viewer

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Drag a binary file onto this exe to view it as an image.")
    else:
        main(sys.argv[1])
