// preview.js - LED Display Preview System for 32x24 display with .raw file saving

class LEDPreviewSystem {
  // Make constructor async to handle async init
  constructor() {
    this.canvas = document.getElementById('previewCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    
    // GPIO State Management
    this.gpioStates = {};
    this.gpioGrid = document.getElementById('gpioGrid');
    
    // Image Storage
    this.loadedImages = new Map();
    this.loadedAnimations = new Map();
    this.previewRunning = false;
    this.currentAnimationTimeout = null;
    this.currentWaitTimeout = null; // Separate timeout for waits
    this.currentColor = '#FFFFFF';
    this.variables = new Map();
    this.errorImageData = null; // Store error image data
    
    // Timer and status tracking
    this.startTime = 0;
    this.timerInterval = null;
    
    this.initGPIOControls();
    this.initDisplay();
    this.setupEventListeners();
    this.initStatusDisplay();
    this.loadErrorImage(); // Load error image during initialization
  }

  // Initialize GPIO controls (pins 0-9 for common use)
  initGPIOControls() {
    for (let pin = 0; pin <= 9; pin++) {
      this.gpioStates[pin] = false;
      
      const gpioItem = document.createElement('div');
      gpioItem.className = 'gpio-item';
      
      gpioItem.innerHTML = `
        <div class="gpio-label">GPIO ${pin}</div>
        <div class="gpio-toggle" id="gpio-${pin}"></div>
        <div class="gpio-state">LOW</div>
      `;
      
      const toggle = gpioItem.querySelector('.gpio-toggle');
      const state = gpioItem.querySelector('.gpio-state');
      
      toggle.addEventListener('click', () => {
        this.gpioStates[pin] = !this.gpioStates[pin];
        toggle.classList.toggle('active', this.gpioStates[pin]);
        state.textContent = this.gpioStates[pin] ? 'HIGH' : 'LOW';
        console.log(`GPIO ${pin} set to ${this.gpioStates[pin] ? 'HIGH' : 'LOW'}`);
      });
      
      this.gpioGrid.appendChild(gpioItem);
    }
  }

  // Load error image asynchronously
  async loadErrorImage() {
    try {
      const response = await fetch('./scr/error.raw');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        this.errorImageData = new Uint8Array(arrayBuffer);
        console.log('Error image loaded successfully');
      } else {
        console.warn('Could not load error.raw file');
      }
    } catch (error) {
      console.warn('Failed to load error.raw:', error);
    }
  }

  // Initialize the LED display with a test pattern
  initDisplay() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, 32, 24);
    
    // Add just a few test pixels using current color (white by default)
    this.ctx.fillStyle = this.currentColor;
    // Corner pixels
    this.ctx.fillRect(0, 0, 1, 1);       // Top-left
    this.ctx.fillRect(31, 0, 1, 1);      // Top-right
    this.ctx.fillRect(0, 23, 1, 1);      // Bottom-left
    this.ctx.fillRect(31, 23, 1, 1);     // Bottom-right
    // Center pixel
    this.ctx.fillRect(16, 12, 1, 1);     // Center
  }

  // Initialize status display
  initStatusDisplay() {
    // Create status elements if they don't exist
    let statusElement = document.getElementById('previewStatus');
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.id = 'previewStatus';
      statusElement.className = 'preview-status';
      statusElement.innerHTML = `
        <div class="status-text">
          <span id="statusText">Stopped</span>
          <span id="statusTimer">00:00</span>
        </div>
      `;
      
      // Insert after the display-info div
      const displayInfo = document.querySelector('.display-info');
      displayInfo.parentNode.insertBefore(statusElement, displayInfo.nextSibling);
    }
    
    this.updateStatusDisplay('Stopped', '00:00');
  }

  // Update status display
  updateStatusDisplay(status, time = null) {
    const statusText = document.getElementById('statusText');
    const timerText = document.getElementById('statusTimer');
    
    if (statusText) {
      statusText.textContent = status;
    }
    
    if (time !== null && timerText) {
      timerText.textContent = time;
    }
  }

  // Format time for display
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Start timer
  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      if (this.previewRunning) {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.updateStatusDisplay('Running', this.formatTime(elapsed));
      }
    }, 1000);
  }

  // Stop timer
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Setup event listeners
  setupEventListeners() {
    document.getElementById('loadSingleRawBtn').addEventListener('change', (event) => {
      this.loadSingleRawFiles(event);
    });

    document.getElementById('loadRawFolderBtn').addEventListener('change', (event) => {
      this.loadImages(event);
    });

    document.getElementById('loadPngBtn').addEventListener('change', (event) => {
      this.loadPngFiles(event);
    });

    document.getElementById('loadZipBtn').addEventListener('change', (event) => {
      this.loadZipFile(event);
    });

    document.getElementById('runPreviewBtn').addEventListener('click', () => {
      this.runPreview();
    });

    document.getElementById('stopPreviewBtn').addEventListener('click', () => {
      this.stopPreview();
    });
  }

  // Create a save dialog for a single file
  saveRawFile(filename, data) {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Create a save dialog for multiple files as a ZIP
  async saveRawFilesAsZip(files, zipName = 'converted_raw_files.zip') {
    try {
      // Load JSZip if not already loaded
      if (typeof JSZip === 'undefined') {
        await this.loadJSZip();
      }

      const zip = new JSZip();
      
      // Add each file to the ZIP
      files.forEach(file => {
        zip.file(file.name, file.data);
      });
      
      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create download
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      console.log(`Created download for ${zipName}`);
    } catch (error) {
      console.error('Error creating ZIP download:', error);
      alert('Error creating ZIP file: ' + error.message);
    }
  }

  // Load and convert ZIP file containing PNG frames to raw files
  async loadZipFile(event) {
    const file = event.target.files[0];
    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      alert('Please select a ZIP file');
      return;
    }

    try {
      // Load JSZip dynamically if not already loaded
      if (typeof JSZip === 'undefined') {
        await this.loadJSZip();
      }

      const zip = new JSZip();
      const zipContents = await zip.loadAsync(file);
      
      const pngFrames = [];
      const framePattern = /^pixil-frame-(\d+)\.png$/i;
      
      // Find all PNG frames
      zipContents.forEach((relativePath, zipEntry) => {
        const match = relativePath.match(framePattern);
        if (match && !zipEntry.dir) {
          const frameNumber = parseInt(match[1]);
          pngFrames.push({
            number: frameNumber,
            name: relativePath,
            entry: zipEntry
          });
        }
      });
      
      if (pngFrames.length === 0) {
        alert('No PNG frames found in ZIP file. Expected files named pixil-frame-0.png, pixil-frame-1.png, etc.');
        return;
      }
      
      // Sort frames by number
      pngFrames.sort((a, b) => a.number - b.number);
      
      console.log(`Found ${pngFrames.length} PNG frames in ZIP file`);
      
      const convertedFrames = [];
      const animationName = file.name.replace('.zip', '');
      
      // Convert each frame
      for (const frame of pngFrames) {
        try {
          const pngBlob = await frame.entry.async('blob');
          const rawData = await this.convertPngBlobToRaw(pngBlob);
          
          const rawFilename = `frame${frame.number}.raw`;
          convertedFrames.push({
            name: rawFilename,
            data: rawData,
            originalName: frame.name
          });
          
          console.log(`Converted ${frame.name} -> ${rawFilename}`);
        } catch (error) {
          console.warn(`Failed to convert frame ${frame.name}:`, error);
        }
      }
      
      if (convertedFrames.length > 0) {
        // Add to loaded animations for preview
        this.loadedAnimations.set(animationName, convertedFrames);
        
        // Show save dialog for .raw files
        const shouldSave = confirm(`Converted ${convertedFrames.length} frames from ZIP file.\nAnimation '${animationName}' is now available for preview.\n\nWould you like to download the converted .raw files as a ZIP?`);
        
        if (shouldSave) {
          await this.saveRawFilesAsZip(convertedFrames, `${animationName}_raw_files.zip`);
        }
        
        alert(`Conversion complete! ${convertedFrames.length} frames ready for use.`);
      } else {
        alert('Failed to convert any frames from ZIP file');
      }
      
    } catch (error) {
      console.error('Error processing ZIP file:', error);
      alert('Error processing ZIP file: ' + error.message);
    }
    
    // Reset file input
    event.target.value = '';
  }

  // Load JSZip library dynamically
  async loadJSZip() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Convert PNG blob to raw data
  async convertPngBlobToRaw(blob, threshold = 128) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        try {
          // Set canvas to 32x24
          canvas.width = 32;
          canvas.height = 24;
          
          // Draw image scaled to fit
          ctx.drawImage(img, 0, 0, 32, 24);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, 32, 24);
          const pixels = imageData.data;
          
          // Create output data array (96 bytes for 768 pixels)
          const rawData = new Uint8Array(96);
          
          // Convert each pixel to 1-bit
          for (let y = 0; y < 24; y++) {
            for (let x = 0; x < 32; x++) {
              const pixelIndex = (y * 32 + x) * 4;
              const r = pixels[pixelIndex];
              const g = pixels[pixelIndex + 1];
              const b = pixels[pixelIndex + 2];
              const alpha = pixels[pixelIndex + 3];
              
              // Convert to grayscale using luminance formula
              const brightness = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
              
              // Apply alpha channel (transparent pixels = black)
              const isOn = (alpha > 128) && (brightness > threshold);
              
              if (isOn) {
                const bitIndex = y * 32 + x;
                const byteIndex = Math.floor(bitIndex / 8);
                const bitOffset = bitIndex % 8;
                rawData[byteIndex] |= (0x80 >> bitOffset);
              }
            }
          }
          
          resolve(rawData);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Load the image from blob
      img.src = URL.createObjectURL(blob);
    });
  }

  async loadPngFiles(event) {
    const files = Array.from(event.target.files);
    let convertedCount = 0;
    let animationFolders = new Map();
    const convertedFiles = [];
    
    for (const file of files) {
      if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
        try {
          const rawData = await this.convertPngToRaw(file);
          const path = file.webkitRelativePath || file.name;
          const pathParts = path.split('/');
          const rawFilename = file.name.replace('.png', '.raw');
          
          // Store for saving
          convertedFiles.push({
            name: rawFilename,
            data: rawData,
            path: path,
            isAnimation: pathParts.length > 1
          });
          
          if (pathParts.length > 1) {
            // Animation frame
            const folderName = pathParts[pathParts.length - 2];
            
            if (!animationFolders.has(folderName)) {
              animationFolders.set(folderName, []);
            }
            
            animationFolders.get(folderName).push({
              name: rawFilename,
              data: rawData
            });
            
            if (!this.loadedAnimations.has(folderName)) {
              this.loadedAnimations.set(folderName, []);
            }
            this.loadedAnimations.get(folderName).push({
              name: rawFilename,
              data: rawData
            });
          } else {
            // Single image
            this.loadedImages.set(rawFilename, rawData);
          }
          
          convertedCount++;
        } catch (error) {
          console.warn(`Failed to convert ${file.name}:`, error);
        }
      }
    }
    
    // Sort animation frames
    for (const [folderName, frames] of this.loadedAnimations) {
      frames.sort((a, b) => {
        const aNum = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const bNum = parseInt(b.name.match(/\d+/)?.[0] || '0');
        return aNum - bNum;
      });
    }
    
    if (convertedFiles.length > 0) {
      const shouldSave = confirm(`Converted ${convertedCount} PNG files to 1-bit monochrome format.\n\nWould you like to download the converted .raw files?`);
      
      if (shouldSave) {
        if (convertedFiles.length === 1) {
          // Single file - direct download
          this.saveRawFile(convertedFiles[0].name, convertedFiles[0].data);
        } else {
          // Multiple files - ZIP download
          await this.saveRawFilesAsZip(convertedFiles, 'converted_png_to_raw.zip');
        }
      }
      
      alert(`Conversion complete! ${convertedCount} files ready for preview and use.`);
    } else {
      alert('No PNG files were successfully converted.');
    }
    
    // Reset file input
    event.target.value = '';
  }

  // Convert PNG file to 1-bit monochrome raw data
  async convertPngToRaw(file, threshold = 128) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        try {
          // Set canvas to 32x24
          canvas.width = 32;
          canvas.height = 24;
          
          // Draw image scaled to fit
          ctx.drawImage(img, 0, 0, 32, 24);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, 32, 24);
          const pixels = imageData.data;
          
          // Create output data array (96 bytes for 768 pixels)
          const rawData = new Uint8Array(96);
          
          // Convert each pixel to 1-bit
          for (let y = 0; y < 24; y++) {
            for (let x = 0; x < 32; x++) {
              const pixelIndex = (y * 32 + x) * 4;
              const r = pixels[pixelIndex];
              const g = pixels[pixelIndex + 1];
              const b = pixels[pixelIndex + 2];
              const alpha = pixels[pixelIndex + 3];
              
              // Convert to grayscale using luminance formula
              const brightness = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
              
              // Apply alpha channel (transparent pixels = black)
              const isOn = (alpha > 128) && (brightness > threshold);
              
              if (isOn) {
                const bitIndex = y * 32 + x;
                const byteIndex = Math.floor(bitIndex / 8);
                const bitOffset = bitIndex % 8;
                rawData[byteIndex] |= (0x80 >> bitOffset);
              }
            }
          }
          
          resolve(rawData);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Load the image
      img.src = URL.createObjectURL(file);
    });
  }

  async loadImages(event) {
    const files = Array.from(event.target.files);
    this.loadedImages.clear();
    this.loadedAnimations.clear();
    
    for (const file of files) {
      if (file.name.endsWith('.raw') || file.name.endsWith('.bmp')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const path = file.webkitRelativePath || file.name;
          const pathParts = path.split('/');
          
          // Check if file is in a subfolder (more than just root folder + filename)
          if (pathParts.length > 2) {
            // Animation frame in subfolder
            const folderName = pathParts[pathParts.length - 2];
            const filename = pathParts[pathParts.length - 1];
            
            if (!this.loadedAnimations.has(folderName)) {
              this.loadedAnimations.set(folderName, []);
            }
            
            this.loadedAnimations.get(folderName).push({
              name: filename,
              data: new Uint8Array(arrayBuffer)
            });
          } else {
            // Single image (either no folder or just in root folder)
            this.loadedImages.set(file.name, new Uint8Array(arrayBuffer));
          }
        } catch (error) {
          console.warn(`Failed to load ${file.name}:`, error);
        }
      }
    }
    
    // Sort animation frames
    for (const [folderName, frames] of this.loadedAnimations) {
      frames.sort((a, b) => {
        const aNum = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const bNum = parseInt(b.name.match(/\d+/)?.[0] || '0');
        return aNum - bNum;
      });
    }
    
    alert(`Loaded ${this.loadedImages.size} images and ${this.loadedAnimations.size} animations (1-bit monochrome format)`);
    // Reset file input
    event.target.value = '';
  }

  // Load individual .raw files (not in folders)
  async loadSingleRawFiles(event) {
    const files = Array.from(event.target.files);
    let loadedCount = 0;
    
    console.log(`Attempting to load ${files.length} individual .raw files:`);
    
    for (const file of files) {
      if (file.name.endsWith('.raw') || file.name.endsWith('.bmp')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const data = new Uint8Array(arrayBuffer);
          
          console.log(`Loading ${file.name}: ${data.length} bytes`);
          
          // Validate file size (should be 96 bytes for 32x24 1-bit)
          if (data.length !== 96) {
            console.warn(`Warning: ${file.name} is ${data.length} bytes, expected 96 bytes for 32x24 1-bit image`);
          }
          
          // Store as individual image (always goes to loadedImages)
          this.loadedImages.set(file.name, data);
          loadedCount++;
          
        } catch (error) {
          console.warn(`Failed to load ${file.name}:`, error);
        }
      } else {
        console.warn(`Skipping ${file.name}: not a .raw or .bmp file`);
      }
    }
    
    console.log(`Successfully loaded ${loadedCount} individual images`);
    console.log('Available images:', Array.from(this.loadedImages.keys()));
    
    alert(`Loaded ${loadedCount} individual .raw files for use with Display Image blocks`);
    
    // Reset file input
    event.target.value = '';
    this.resetFocusState();
  }

  // Render monochrome 1-bit image data to canvas with current color
  renderImage(imageData) {
    const totalPixels = 32 * 24;
    const expectedBytes = Math.ceil(totalPixels / 8); // 96 bytes for 768 pixels
    
    if (!imageData || imageData.length !== expectedBytes) {
      console.warn(`Invalid image data. Expected ${expectedBytes} bytes for 1-bit monochrome, got ${imageData?.length || 0}`);
      // Use preloaded error image if available, otherwise fallback
      if (this.errorImageData && this.errorImageData.length === expectedBytes) {
        imageData = this.errorImageData;
      } else {
        // Fallback error pattern
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(0, 0, 32, 24);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '8px monospace';
        this.ctx.fillText('ERR', 12, 14);
        return;
      }
    }
    
    const imageDataArray = this.ctx.createImageData(32, 24);
    const data = imageDataArray.data;
    
    // Parse current color
    const color = this.hexToRgb(this.currentColor) || { r: 255, g: 255, b: 255 };
    
    // Process 1-bit per pixel format (packed bits)
    for (let i = 0; i < totalPixels; i++) {
      const byteIndex = Math.floor(i / 8);
      const bitIndex = i % 8;
      const isOn = (imageData[byteIndex] & (0x80 >> bitIndex)) !== 0;
      
      data[i * 4] = isOn ? color.r : 0;     // Red
      data[i * 4 + 1] = isOn ? color.g : 0; // Green
      data[i * 4 + 2] = isOn ? color.b : 0; // Blue
      data[i * 4 + 3] = 255;                // Alpha
    }
    
    this.ctx.putImageData(imageDataArray, 0, 0);
  }

  // Display a single image
  displayImage(filename) {
    const imageData = this.loadedImages.get(filename);
    if (imageData) {
      this.renderImage(imageData);
      console.log(`Displayed image: ${filename}`);
    } else {
      console.warn(`Image not found: ${filename}`);
      
      // Try to display error image if available
      if (this.errorImageData) {
        this.renderImage(this.errorImageData);
        console.log('Displayed error image');
      } else {
        // Fallback to the current red square with "?"
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(0, 0, 32, 24);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '8px monospace';
        this.ctx.fillText('?', 14, 14);
      }
    }
  }

  // Play animation with improved timing
  playAnimation(folderName, duration = 2000) {
    const animation = this.loadedAnimations.get(folderName);
    if (!animation || animation.length === 0) {
      console.warn(`Animation not found: ${folderName}`);
      return Promise.resolve();
    }

    console.log(`Starting animation '${folderName}' for ${duration}ms with ${animation.length} frames`);

    return new Promise((resolve) => {
      const frameTime = duration / animation.length;
      let currentFrame = 0;
      const startTime = Date.now();

      const playFrame = () => {
        if (!this.previewRunning) {
          console.log(`Animation '${folderName}' stopped early`);
          resolve();
          return;
        }

        // Check if we've played for the requested duration
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
          console.log(`Animation '${folderName}' completed after ${elapsed}ms`);
          resolve();
          return;
        }

        // Show current frame
        this.renderImage(animation[currentFrame].data);
        console.log(`Animation '${folderName}' showing frame ${currentFrame + 1}/${animation.length}`);
        
        // Move to next frame (loop back to 0 if at end)
        currentFrame = (currentFrame + 1) % animation.length;
        
        this.currentAnimationTimeout = setTimeout(playFrame, frameTime);
      };

      playFrame();
    });
  }

  // Wait function
  wait(ms) {
    return new Promise(resolve => {
      if (this.previewRunning) {
        this.currentAnimationTimeout = setTimeout(resolve, ms);
      } else {
        resolve();
      }
    });
  }

  // Set color filter
  setColor(color) {
    if (color === 'RANDOM') {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'];
      this.currentColor = colors[Math.floor(Math.random() * colors.length)];
    } else if (typeof color === 'object' && color.type === 'rgb_color') {
      this.currentColor = `rgb(${color.red}, ${color.green}, ${color.blue})`;
    } else {
      this.currentColor = color;
    }
    console.log(`Color set to: ${this.currentColor}`);
  }

  // Helper function to convert hex to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Execute a single block instruction
  async executeBlock(block) {
    if (!this.previewRunning) return;

    console.log(`Executing block: ${block.type}`);

    switch (block.type) {
      case 'display_image':
        this.displayImage(block.filename);
        break;

      case 'play_animation':
        await this.playAnimation(block.folder, block.play_for);
        break;

      case 'wait':
        const waitTime = this.evaluateValue(block.time);
        console.log(`Waiting ${waitTime}ms`);
        await this.wait(waitTime);
        break;

      case 'set_color':
        const color = this.evaluateValue(block.color);
        this.setColor(color);
        break;

      case 'set_variable':
        const value = this.evaluateValue(block.value);
        this.variables.set(block.var_name, value);
        console.log(`Variable ${block.var_name} set to:`, value);
        break;

      case 'gpio':
        this.setGPIO(block.pin, block.state);
        break;

      case 'if':
        const condition = this.evaluateValue(block.condition);
        if (condition) {
          if (block.true_branch) {
            await this.executeBlocks(block.true_branch);
          }
        } else {
          if (block.false_branch) {
            await this.executeBlocks(block.false_branch);
          }
        }
        break;

      case 'if_gpio':
        const gpioState = this.gpioStates[block.pin];
        const expectedState = block.state === 'HIGH';
        if (gpioState === expectedState) {
          if (block.true_branch) {
            await this.executeBlocks(block.true_branch);
          }
        } else {
          if (block.false_branch) {
            await this.executeBlocks(block.false_branch);
          }
        }
        break;

      case 'repeat':
        const times = this.evaluateValue(block.times);
        console.log(`Starting repeat loop ${times} times`);
        for (let i = 0; i < times && this.previewRunning; i++) {
          if (block.loop_body) {
            await this.executeBlocks(block.loop_body);
          }
        }
        console.log(`Repeat loop completed`);
        break;

      case 'forever':
        console.log(`Starting forever loop`);
        while (this.previewRunning) {
          if (block.loop_body) {
            await this.executeBlocks(block.loop_body);
          }
        }
        console.log(`Forever loop exited`);
        break;

      case 'while':
        console.log(`Starting while loop`);
        while (this.previewRunning && this.evaluateValue(block.condition)) {
          if (block.loop_body) {
            await this.executeBlocks(block.loop_body);
          }
        }
        console.log(`While loop completed`);
        break;

      default:
        console.log(`Unhandled block type: ${block.type}`);
    }

    // Execute next block in chain
    if (block.next && this.previewRunning) {
      await this.executeBlock(block.next);
    }
  }

  // Execute a list of blocks
  async executeBlocks(blocks) {
    if (!Array.isArray(blocks) || blocks.length === 0) {
      console.log('executeBlocks: No blocks to execute');
      return;
    }
    
    console.log(`executeBlocks: Starting execution of ${blocks.length} blocks`);
    
    // Only execute the first block in the array - the rest should be connected via 'next' chain
    if (blocks.length > 0) {
      await this.executeBlock(blocks[0]);
    }
    
    console.log('executeBlocks: Completed block chain execution');
  }

  // Evaluate a value (number, variable, expression)
  evaluateValue(value) {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      switch (value.type) {
        case 'random_range':
          return Math.floor(Math.random() * (value.max - value.min + 1)) + value.min;
        
        case 'get_variable':
          return this.variables.get(value.var_name) || 0;
        
        case 'compare':
          const left = this.evaluateValue(value.left);
          const right = this.evaluateValue(value.right);
          switch (value.operator) {
            case 'EQ': return left === right;
            case 'NEQ': return left !== right;
            case 'LT': return left < right;
            case 'GT': return left > right;
            case 'LTE': return left <= right;
            case 'GTE': return left >= right;
            default: return false;
          }
        
        case 'rgb_color':
          return `#${value.red.toString(16).padStart(2, '0')}${value.green.toString(16).padStart(2, '0')}${value.blue.toString(16).padStart(2, '0')}`;
        
        default:
          return value;
      }
    }

    return 0;
  }

  // Set GPIO pin state (visual only)
  setGPIO(pin, state) {
    if (pin >= 0 && pin <= 9) {
      const isHigh = state === 'HIGH';
      this.gpioStates[pin] = isHigh;
      
      const toggle = document.getElementById(`gpio-${pin}`);
      const stateElement = toggle?.parentElement?.querySelector('.gpio-state');
      
      if (toggle && stateElement) {
        toggle.classList.toggle('active', isHigh);
        stateElement.textContent = state;
      }
      
      console.log(`GPIO ${pin} set to ${state}`);
    }
  }

  // Run preview of the current Blockly program
  async runPreview() {
    // Prevent multiple simultaneous executions
    if (this.previewRunning) {
      console.log('Preview already running, stopping current execution first');
      this.stopPreview();
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      const json = generateJson(workspace);
      
      if (json.includes('"error"')) {
        alert('Error: No start block found or invalid program structure');
        return;
      }

      const program = JSON.parse(json);
      console.log('Program to execute:', program);
      
      this.previewRunning = true;
      this.updateStatusDisplay('Running', '00:00');
      this.startTimer();
      console.log('Starting preview execution, previewRunning =', this.previewRunning);
      
      // Clear display
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, 32, 24);
      
      // Reset state
      this.variables.clear();
      this.currentColor = '#FFFFFF';
      
      // Execute the program
      if (program.actions) {
        console.log('About to execute program actions');
        await this.executeBlocks(program.actions);
        console.log('Finished executing program actions, previewRunning =', this.previewRunning);
      } else {
        console.log('No actions to execute in program');
      }
      
      // Stop preview automatically when execution completes (unless there was a forever loop)
      if (this.previewRunning) {
        console.log('Auto-stopping preview after completion');
        this.stopPreview();
        console.log('Preview completed - stopped automatically');
      } else {
        console.log('Preview was already stopped (probably by forever loop or manual stop)');
      }
      
    } catch (error) {
      console.error('Preview execution error:', error);
      alert('Preview execution failed: ' + error.message);
      this.stopPreview();
    }
  }

  // Stop preview execution
  stopPreview() {
    this.previewRunning = false;
    this.stopTimer();
    
    if (this.currentAnimationTimeout) {
      clearTimeout(this.currentAnimationTimeout);
      this.currentAnimationTimeout = null;
    }
    
    const elapsed = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    this.updateStatusDisplay('Stopped', this.formatTime(elapsed));
    
    console.log('Preview stopped');
  }

  // Reset focus state to fix Electron text field issues
  resetFocusState() {
    // Force blur all elements first
    if (document.activeElement) {
      document.activeElement.blur();
    }
    
    // Wait a tick then try to restore normal focus behavior
    setTimeout(() => {
      // Re-enable text selection and input
      document.body.style.userSelect = 'auto';
      document.body.style.webkitUserSelect = 'auto';
      
      // Force a window focus event
      window.focus();
      
      // Try clicking somewhere neutral to reset focus
      const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      document.body.dispatchEvent(event);
    }, 100);
  }
}

// Initialize the preview system when the page loads
let previewSystem;

document.addEventListener('DOMContentLoaded', async () => {
  // Wait a bit to ensure other scripts are loaded
  setTimeout(async () => {
    previewSystem = await new LEDPreviewSystem();
  }, 100);
});

// Export for global access
window.LEDPreviewSystem = LEDPreviewSystem;