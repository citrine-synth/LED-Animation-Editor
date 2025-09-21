# LED Display Editor

A visual programming environment for creating animations on 32x24 LED displays. Built with Blockly and Electron.

## What it does

This editor lets you create LED display animations using drag-and-drop blocks instead of writing code. You can:

- Load images and convert them to the 1-bit format needed for LED displays
- Create animation sequences with timing, loops, and conditionals
- Preview your animations in real-time
- Control GPIO pins for additional hardware
- Export your program as JSON for use with microcontrollers

## Getting started

Download the latest release and run the executable. No installation needed.

### Loading images

The editor supports several ways to load images:

- **Load Single .raw**: Individual 96-byte raw image files
- **Load .raw Folder**: Folders containing raw files and animation sequences
- **Load PNGs**: Convert regular PNG files to raw format
- **Load ZIP**: Convert PIXILART animation exports (frame1.png, frame2.png, etc.)

All images are converted to 32x24 pixels in 1-bit monochrome format.

### Creating programs

Drag blocks from the toolbox to create your animation sequence. The program always starts with a "Start Program" block. Common patterns:
