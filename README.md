
<img width="1922" height="1036" alt="image" src="https://github.com/user-attachments/assets/e1af478b-ad6f-47a7-af5c-3e1aad4d8ae9" />
<img width="1928" height="1040" alt="image" src="https://github.com/user-attachments/assets/45048d3d-55f7-49b2-b41a-1c8bb991febd" />


# LED Display Editor

A visual programming environment for creating animations on 32x24 LED displays. Built with Blockly and Electron.

## What it does

This editor lets you create LED display animations using blocks. You can:

- Load images and convert them to the 1-bit format needed for this LED display
- Create animation sequences with timing, loops, and conditionals
- Preview your animations in real-time
- Control GPIO pins for additional hardware
- Export your program as JSON for use with microcontrollers or to later edit them

## Getting started

- Download the code as a zip file, unzip it then open the "LED Display Editor.exe" shortcut.
- Hit the "Load JSON" button and open the "example_blink.json" file.
- Click on "Load.raw folder", select the "raw_test_images" folder and hit upload.
- That's it, you can start the preview or change the blocks.

### Loading images

The editor supports several ways to load images:

- **Load Single .raw**: Individual 96-byte raw image files
- **Load .raw Folder**: Folders containing raw files and animation sequences
- **Load PNGs**: Convert regular PNG files to raw format
- **Load ZIP**: Convert PIXILART animation exports (pixil-frame-0.png, pixil-frame-1.png, etc.)

  Animations are a sequence of .raw files in a sub folder. this folder can be named anything and you will use that name to play the animation.

All images are converted to 32x24 pixels in 1-bit monochrome format.

### Creating programs

Drag blocks from the toolbox to create your animation sequence. The program always starts with a "Start Program" block.

### TODO:

- fix loop issues where if you don't have a wait in a loop the program crashes
- add support for interrupt gpio triggers so that it doesnt wait when you change a gpio
- add a tool to reverse animations (just re name the files in reverse order)
- add usb upload support for the display
- fix electron focus issue where after loading a folder you need to switch to another window and back to be able to edit text fields

