
function createBlockFromJson(workspace, json, processedBlocks = new Set()) {
  if (!json || !json.type) {
    console.warn('Invalid block JSON:', json);
    return null;
  }

  if (json.id && processedBlocks.has(json.id)) {
    console.warn(`Block ${json.id} already processed, skipping`);
    return workspace.getBlockById(json.id);
  }

  let block;
  try {
    block = workspace.newBlock(json.type);
    if (json.id) {
      processedBlocks.add(json.id);
    }
    console.debug(`Created block ${block.id} of type ${json.type}`);
  } catch (e) {
    console.warn(`Failed to create block of type ${json.type}:`, e);
    return null;
  }

  try {
    switch (json.type) {
      case 'display_image':
        block.setFieldValue(json.filename || 'image.bmp', 'FILENAME');
        break;

      case 'play_animation':
        block.setFieldValue(json.folder || 'animation_folder', 'FOLDER');
        block.setFieldValue(json.play_for || 500, 'PLAY_FOR');
        break;

      case 'wait':
        if (typeof json.time === 'number') {
          const numberBlock = workspace.newBlock('number');
          numberBlock.setFieldValue(json.time, 'NUMBER');
          numberBlock.initSvg();
          block.getInput('TIME').connection.connect(numberBlock.outputConnection);
        } else if (json.time && typeof json.time === 'object') {
          const valueBlock = createValueBlockFromJson(workspace, json.time, processedBlocks);
          if (valueBlock) {
            block.getInput('TIME').connection.connect(valueBlock.outputConnection);
          }
        }
        break;

      case 'random_range':
        block.setFieldValue(json.min || 0, 'MIN');
        block.setFieldValue(json.max || 1000, 'MAX');
        break;

      case 'number':
        block.setFieldValue(json.value || 0, 'NUMBER');
        break;

      case 'if':
        if (json.condition) {
          const conditionBlock = createValueBlockFromJson(workspace, json.condition, processedBlocks);
          if (conditionBlock) {
            block.getInput('CONDITION').connection.connect(conditionBlock.outputConnection);
          }
        }
        if (json.true_branch) {
          const trueBlock = createBlockFromJson(workspace, json.true_branch, processedBlocks);
          if (trueBlock && block.getInput('TRUE') && trueBlock.previousConnection) {
            block.getInput('TRUE').connection.connect(trueBlock.previousConnection);
          }
        }
        if (json.false_branch) {
          const falseBlock = createBlockFromJson(workspace, json.false_branch, processedBlocks);
          if (falseBlock && block.getInput('FALSE') && falseBlock.previousConnection) {
            block.getInput('FALSE').connection.connect(falseBlock.previousConnection);
          }
        }
        break;

      case 'compare':

        if (json.left !== undefined) {
          if (typeof json.left === 'number') {
            const numberBlock = workspace.newBlock('number');
            numberBlock.setFieldValue(json.left, 'NUMBER');
            numberBlock.initSvg();
            block.getInput('LEFT').connection.connect(numberBlock.outputConnection);
          } else if (json.left && typeof json.left === 'object') {
            const leftBlock = createValueBlockFromJson(workspace, json.left, processedBlocks);
            if (leftBlock) {
              block.getInput('LEFT').connection.connect(leftBlock.outputConnection);
            }
          }
        }
        
        block.setFieldValue(json.operator || 'EQ', 'OPERATOR');

        if (json.right !== undefined) {
          if (typeof json.right === 'number') {
            const numberBlock = workspace.newBlock('number');
            numberBlock.setFieldValue(json.right, 'NUMBER');
            numberBlock.initSvg();
            block.getInput('RIGHT').connection.connect(numberBlock.outputConnection);
          } else if (json.right && typeof json.right === 'object') {
            const rightBlock = createValueBlockFromJson(workspace, json.right, processedBlocks);
            if (rightBlock) {
              block.getInput('RIGHT').connection.connect(rightBlock.outputConnection);
            }
          }
        }
        break;

      case 'set_variable':
        block.setFieldValue(json.var_name || 'myVar', 'VAR_NAME');
        if (json.value !== undefined) {
          if (typeof json.value === 'number') {
            const numberBlock = workspace.newBlock('number');
            numberBlock.setFieldValue(json.value, 'NUMBER');
            numberBlock.initSvg();
            block.getInput('VALUE').connection.connect(numberBlock.outputConnection);
          } else if (typeof json.value === 'string') {
            const customColorBlock = workspace.newBlock('custom_color');
            customColorBlock.setFieldValue(json.value, 'COLOR');
            customColorBlock.initSvg();
            block.getInput('VALUE').connection.connect(customColorBlock.outputConnection);
          } else {
            const valueBlock = createValueBlockFromJson(workspace, json.value, processedBlocks);
            if (valueBlock) {
              block.getInput('VALUE').connection.connect(valueBlock.outputConnection);
            }
          }
        }
        break;

      case 'get_variable':
        block.setFieldValue(json.var_name || 'myVar', 'VAR_NAME');
        break;

      case 'forever':
        if (json.loop_body) {
          const loopBlock = createBlockFromJson(workspace, json.loop_body, processedBlocks);
          if (loopBlock && block.getInput('DO') && loopBlock.previousConnection) {
            block.getInput('DO').connection.connect(loopBlock.previousConnection);
          }
        }
        break;

      case 'repeat':
        if (typeof json.times === 'number') {
          const numberBlock = workspace.newBlock('number');
          numberBlock.setFieldValue(json.times, 'NUMBER');
          numberBlock.initSvg();
          block.getInput('TIMES').connection.connect(numberBlock.outputConnection);
        } else if (json.times && typeof json.times === 'object') {
          const valueBlock = createValueBlockFromJson(workspace, json.times, processedBlocks);
          if (valueBlock) {
            block.getInput('TIMES').connection.connect(valueBlock.outputConnection);
          }
        }
        if (json.loop_body) {
          const loopBlock = createBlockFromJson(workspace, json.loop_body, processedBlocks);
          if (loopBlock && block.getInput('DO') && loopBlock.previousConnection) {
            block.getInput('DO').connection.connect(loopBlock.previousConnection);
          }
        }
        break;

      case 'while':
        if (json.condition) {
          const conditionBlock = createValueBlockFromJson(workspace, json.condition, processedBlocks);
          if (conditionBlock) {
            block.getInput('CONDITION').connection.connect(conditionBlock.outputConnection);
          }
        }
        if (json.loop_body) {
          const loopBlock = createBlockFromJson(workspace, json.loop_body, processedBlocks);
          if (loopBlock && block.getInput('DO') && loopBlock.previousConnection) {
            block.getInput('DO').connection.connect(loopBlock.previousConnection);
          }
        }
        break;

      case 'break':

        break;

      case 'gpio':
        block.setFieldValue(json.pin || 0, 'PIN');
        block.setFieldValue(json.state || 'HIGH', 'STATE');
        break;

      case 'if_gpio':
        block.setFieldValue(json.pin || 0, 'PIN');
        block.setFieldValue(json.state || 'HIGH', 'STATE');
        if (json.true_branch) {
          const trueBlock = createBlockFromJson(workspace, json.true_branch, processedBlocks);
          if (trueBlock && block.getInput('TRUE') && trueBlock.previousConnection) {
            block.getInput('TRUE').connection.connect(trueBlock.previousConnection);
          }
        }
        if (json.false_branch) {
          const falseBlock = createBlockFromJson(workspace, json.false_branch, processedBlocks);
          if (falseBlock && block.getInput('FALSE') && falseBlock.previousConnection) {
            block.getInput('FALSE').connection.connect(falseBlock.previousConnection);
          }
        }
        break;

      case 'gpio_trigger':
        block.setFieldValue(json.pin || 0, 'PIN');
        block.setFieldValue(json.trigger || 'RISING', 'TRIGGER');
        if (json.actions) {
          const actionBlock = createBlockFromJson(workspace, json.actions, processedBlocks);
          if (actionBlock && block.getInput('DO') && actionBlock.previousConnection) {
            block.getInput('DO').connection.connect(actionBlock.previousConnection);
          }
        }
        break;

      case 'start':
        if (json.actions) {
          const actionBlock = createBlockFromJson(workspace, json.actions, processedBlocks);
          if (actionBlock && block.getInput('DO') && actionBlock.previousConnection) {
            block.getInput('DO').connection.connect(actionBlock.previousConnection);
          }
        }
        break;

      case 'set_color':
        if (json.color && typeof json.color === 'string') {

          const predefinedColors = [
            "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", 
            "#FFFFFF", "#FF8000", "#FF69B4", "#32CD32", "#8B4513", "#000000", "RANDOM"
          ];
          
          if (predefinedColors.includes(json.color)) {
            const colorBlock = workspace.newBlock('color_value');
            colorBlock.setFieldValue(json.color, 'COLOR');
            colorBlock.initSvg();
            block.getInput('COLOR').connection.connect(colorBlock.outputConnection);
          } else {
            const colorBlock = workspace.newBlock('custom_color');
            colorBlock.setFieldValue(json.color, 'COLOR');
            colorBlock.initSvg();
            block.getInput('COLOR').connection.connect(colorBlock.outputConnection);
          }
        } else if (json.color) {
          const colorBlock = createValueBlockFromJson(workspace, json.color, processedBlocks);
          if (colorBlock) {
            block.getInput('COLOR').connection.connect(colorBlock.outputConnection);
          }
        }
        break;

      case 'color_value':
        block.setFieldValue(json.color || '#FF0000', 'COLOR');
        break;

      case 'custom_color':
        block.setFieldValue(json.color || '#FF0000', 'COLOR');
        break;

      case 'rgb_color':
        block.setFieldValue(json.red || 0, 'RED');
        block.setFieldValue(json.green || 0, 'GREEN');
        block.setFieldValue(json.blue || 0, 'BLUE');
        break;

      default:
        console.warn(`Unknown block type: ${json.type}`);
        return null;
    }
  } catch (e) {
    console.warn(`Error setting fields for block ${block.id} (${json.type}):`, e);
    return null;
  }

  try {
    block.initSvg();
  } catch (e) {
    console.warn(`Failed to initialize SVG for block ${block.id}:`, e);
    return null;
  }

  if (json.next) {
    const nextBlock = createBlockFromJson(workspace, json.next, processedBlocks);
    if (nextBlock && block.nextConnection && nextBlock.previousConnection) {
      try {
        block.nextConnection.connect(nextBlock.previousConnection);
        console.debug(`Connected next block ${nextBlock.id} to ${block.id}`);
      } catch (e) {
        console.warn(`Failed to connect next block ${nextBlock.id} to ${block.id}:`, e);
      }
    }
  }

  return block;
}

function createValueBlockFromJson(workspace, json, processedBlocks = new Set()) {
  if (!json || !json.type) {
    console.warn('Invalid value block JSON:', json);
    return null;
  }

  if (json.id && processedBlocks.has(json.id)) {
    return workspace.getBlockById(json.id);
  }

  let block;
  try {
    switch (json.type) {
      case 'number':
        block = workspace.newBlock('number');
        block.setFieldValue(json.value || 0, 'NUMBER');
        break;
      case 'random_range':
        block = workspace.newBlock('random_range');
        block.setFieldValue(json.min || 0, 'MIN');
        block.setFieldValue(json.max || 1000, 'MAX');
        break;
      case 'get_variable':
        block = workspace.newBlock('get_variable');
        block.setFieldValue(json.var_name || 'myVar', 'VAR_NAME');
        break;
      case 'color_value':
        block = workspace.newBlock('color_value');
        block.setFieldValue(json.color || '#FF0000', 'COLOR');
        break;
      case 'custom_color':
        block = workspace.newBlock('custom_color');
        block.setFieldValue(json.color || '#FF0000', 'COLOR');
        break;
      case 'rgb_color':
        block = workspace.newBlock('rgb_color');
        block.setFieldValue(json.red || 0, 'RED');
        block.setFieldValue(json.green || 0, 'GREEN');
        block.setFieldValue(json.blue || 0, 'BLUE');
        break;
      case 'compare':
        block = workspace.newBlock('compare');
        block.setFieldValue(json.operator || 'EQ', 'OPERATOR');

        if (json.left !== undefined) {
          if (typeof json.left === 'number') {
            const numberBlock = workspace.newBlock('number');
            numberBlock.setFieldValue(json.left, 'NUMBER');
            numberBlock.initSvg();
            block.getInput('LEFT').connection.connect(numberBlock.outputConnection);
          } else if (json.left && typeof json.left === 'object') {
            const leftBlock = createValueBlockFromJson(workspace, json.left, processedBlocks);
            if (leftBlock) {
              block.getInput('LEFT').connection.connect(leftBlock.outputConnection);
            }
          }
        }

        if (json.right !== undefined) {
          if (typeof json.right === 'number') {
            const numberBlock = workspace.newBlock('number');
            numberBlock.setFieldValue(json.right, 'NUMBER');
            numberBlock.initSvg();
            block.getInput('RIGHT').connection.connect(numberBlock.outputConnection);
          } else if (json.right && typeof json.right === 'object') {
            const rightBlock = createValueBlockFromJson(workspace, json.right, processedBlocks);
            if (rightBlock) {
              block.getInput('RIGHT').connection.connect(rightBlock.outputConnection);
            }
          }
        }
        break;
      default:
        console.warn(`Unknown value block type: ${json.type}`);
        return null;
    }
  } catch (e) {
    console.warn(`Error creating value block ${json.type}:`, e);
    return null;
  }

  if (json.id) {
    processedBlocks.add(json.id);
  }

  try {
    block.initSvg();
    console.debug(`Initialized SVG for value block ${block.id}`);
  } catch (e) {
    console.warn(`Failed to initialize SVG for value block ${block.id}:`, e);
    return null;
  }

  return block;
}

function resetWorkspaceState(workspace) {
  try {

    if (workspace.currentGesture_) {
      workspace.currentGesture_.cancel();
      workspace.currentGesture_ = null;
      console.debug('Cancelled and cleared active gesture');
    }

    if (workspace.gestureMap_) {
      workspace.gestureMap_.clear();
    }

    workspace.isDragging_ = false;

    setTimeout(() => {
      try {
        workspace.resize();
        workspace.resizeContents();
        console.debug('Workspace resized and contents adjusted');
      } catch (e) {
        console.warn('Error during workspace resize:', e);
      }
    }, 100);
    
  } catch (e) {
    console.warn('Failed to reset workspace state:', e);
  }
}

function loadJson(workspace, jsonString) {
  console.debug('Starting JSON load process');
  
  try {

    const json = JSON.parse(jsonString);
    if (json.error) {
      console.error('Invalid JSON: No start block found');
      return false;
    }

    Blockly.Events.disable();
    console.debug('Disabled Blockly events');

    workspace.clear();
    console.debug('Cleared workspace');

    resetWorkspaceState(workspace);

    const processedBlocks = new Set();

    console.debug('Creating blocks from JSON...');
    const startBlock = createBlockFromJson(workspace, json, processedBlocks);
    if (!startBlock) {
      console.error('Failed to create start block');
      return false;
    }

    console.debug(`Created start block: ${startBlock.id}`);

    startBlock.moveBy(50, 50);
    console.debug('Positioned start block');

    const allBlocks = workspace.getAllBlocks(false);
    console.debug(`Total blocks created: ${allBlocks.length}`);

    allBlocks.forEach((block, index) => {
      console.debug(`Block ${index}: ${block.type} (${block.id})`);
    });

    console.debug('Rendering all blocks...');
    allBlocks.forEach((block, index) => {
      try {
        block.render();
        console.debug(`Rendered block ${index}: ${block.type}`);
      } catch (e) {
        console.error(`Failed to render block ${block.id} (${block.type}):`, e);
      }
    });

    setTimeout(() => {
      try {
        workspace.scrollCenter();
        console.debug('Centered workspace on content');
      } catch (e) {
        console.warn('Failed to center workspace:', e);
      }
    }, 300);

    console.debug('JSON loaded successfully');
    return true;
    
  } catch (e) {
    console.error('Error loading JSON:', e);
    console.error('JSON that failed to load:', jsonString);
    return false;
  } finally {

    setTimeout(() => {
      Blockly.Events.enable();
      console.debug('Re-enabled Blockly events');

      resetWorkspaceState(workspace);

      const visibleBlocks = workspace.getTopBlocks(true);
      console.debug(`Visible top-level blocks: ${visibleBlocks.length}`);
      visibleBlocks.forEach(block => {
        console.debug(`Visible block: ${block.type} at (${block.getRelativeToSurfaceXY().x}, ${block.getRelativeToSurfaceXY().y})`);
      });
      
    }, 500);
  }
}

window.loadJson = loadJson;
