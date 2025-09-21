

// Initialize JavaScript generator
Blockly.JavaScript = new Blockly.Generator('JavaScript');

// Helper function to generate JSON for a block
function blockToJson(block) {
  if (!block) return null;

  const blockJson = {
    type: block.type,
    id: block.id
  };

  // Handle block-specific fields
    // Handle block-specific fields
  switch (block.type) {
    case 'display_image':
      blockJson.filename = block.getFieldValue('FILENAME');
      break;

    case 'play_animation':
      blockJson.folder = block.getFieldValue('FOLDER');
      blockJson.play_for = parseInt(block.getFieldValue('PLAY_FOR'));
      break;

    case 'wait':
      const timeInput = block.getInputTargetBlock('TIME');
      blockJson.time = timeInput ? generateValueJson(timeInput) : parseInt(block.getFieldValue('NUMBER') || 0);
      break;

    case 'random_range':
      blockJson.min = parseInt(block.getFieldValue('MIN'));
      blockJson.max = parseInt(block.getFieldValue('MAX'));
      break;

    case 'number':
      blockJson.value = parseInt(block.getFieldValue('NUMBER'));
      break;

    case 'if':
      const conditionInput = block.getInputTargetBlock('CONDITION');
      blockJson.condition = conditionInput ? generateValueJson(conditionInput) : null;
      blockJson.true_branch = generateStatementJson(block.getInputTargetBlock('TRUE'));
      blockJson.false_branch = generateStatementJson(block.getInputTargetBlock('FALSE'));
      break;

    case 'compare':
      blockJson.left = generateValueJson(block.getInputTargetBlock('LEFT'));
      blockJson.operator = block.getFieldValue('OPERATOR');
      blockJson.right = generateValueJson(block.getInputTargetBlock('RIGHT'));
      break;

    case 'set_variable':
      blockJson.var_name = block.getFieldValue('VAR_NAME');
      blockJson.value = generateValueJson(block.getInputTargetBlock('VALUE'));
      break;

    case 'get_variable':
      blockJson.var_name = block.getFieldValue('VAR_NAME');
      break;

    case 'forever':
      const foreverDoInput = block.getInput('DO');
      blockJson.loop_body = foreverDoInput ? generateStatementJson(foreverDoInput.connection.targetBlock()) : null;
      break;

    case 'repeat':
      const timesInput = block.getInputTargetBlock('TIMES');
      blockJson.times = timesInput ? generateValueJson(timesInput) : 1;
      const repeatDoInput = block.getInput('DO');
      blockJson.loop_body = repeatDoInput ? generateStatementJson(repeatDoInput.connection.targetBlock()) : null;
      break;

    case 'while':
      const whileConditionInput = block.getInputTargetBlock('CONDITION');
      blockJson.condition = whileConditionInput ? generateValueJson(whileConditionInput) : null;
      const whileDoInput = block.getInput('DO');
      blockJson.loop_body = whileDoInput ? generateStatementJson(whileDoInput.connection.targetBlock()) : null;
      break;

    case 'break':
      // No additional fields needed
      break;

    case 'gpio':
      blockJson.pin = parseInt(block.getFieldValue('PIN'));
      blockJson.state = block.getFieldValue('STATE');
      break;

    case 'if_gpio':
      blockJson.pin = parseInt(block.getFieldValue('PIN'));
      blockJson.state = block.getFieldValue('STATE');
      blockJson.true_branch = generateStatementJson(block.getInputTargetBlock('TRUE'));
      blockJson.false_branch = generateStatementJson(block.getInputTargetBlock('FALSE'));
      break;

    case 'gpio_trigger':
      blockJson.pin = parseInt(block.getFieldValue('PIN'));
      blockJson.trigger = block.getFieldValue('TRIGGER');
      blockJson.actions = generateStatementJson(block.getInputTargetBlock('DO'));
      break;

    case 'start':
      blockJson.actions = generateStatementJson(block.getInputTargetBlock('DO'));
      break;

    case 'set_color':
      const colorInput = block.getInputTargetBlock('COLOR');
      blockJson.color = colorInput ? generateValueJson(colorInput) : block.getFieldValue('COLOR');
      break;

    case 'color_value':
      blockJson.color = block.getFieldValue('COLOR');
      break;

    case 'custom_color':
      blockJson.color = block.getFieldValue('COLOR');
      break;

    case 'rgb_color':
      blockJson.red = parseInt(block.getFieldValue('RED'));
      blockJson.green = parseInt(block.getFieldValue('GREEN'));
      blockJson.blue = parseInt(block.getFieldValue('BLUE'));
      break;
  }

  // Handle next block in the chain
  const nextBlock = block.getNextBlock();
  if (nextBlock) {
    blockJson.next = blockToJson(nextBlock);
  }

  return blockJson;
}

// Helper function to generate JSON for statement inputs (e.g., DO, TRUE, FALSE)
function generateStatementJson(startBlock) {
  const statements = [];
  let currentBlock = startBlock;
  while (currentBlock) {
    statements.push(blockToJson(currentBlock));
    currentBlock = currentBlock.getNextBlock();
  }
  return statements.length > 0 ? statements : null;
}

// Helper function to generate JSON for value inputs (e.g., TIME, COLOR, CONDITION, VALUE, LEFT, RIGHT)
function generateValueJson(block) {
  if (!block) return null;

  switch (block.type) {
    case 'number':
      return parseInt(block.getFieldValue('NUMBER'));
    case 'random_range':
      return {
        type: 'random_range',
        min: parseInt(block.getFieldValue('MIN')),
        max: parseInt(block.getFieldValue('MAX'))
      };
    case 'color_value':
      return block.getFieldValue('COLOR');
    case 'custom_color':
      return block.getFieldValue('COLOR');
    case 'rgb_color':
      return {
        type: 'rgb_color',
        red: parseInt(block.getFieldValue('RED')),
        green: parseInt(block.getFieldValue('GREEN')),
        blue: parseInt(block.getFieldValue('BLUE'))
      };
    case 'get_variable':
      return {
        type: 'get_variable',
        var_name: block.getFieldValue('VAR_NAME')
      };
    case 'compare':
      return {
        type: 'compare',
        left: generateValueJson(block.getInputTargetBlock('LEFT')),
        operator: block.getFieldValue('OPERATOR'),
        right: generateValueJson(block.getInputTargetBlock('RIGHT'))
      };
    default:
      return null;
  }
}

// Main function to generate JSON from workspace
function generateJson(workspace) {
  const topBlocks = workspace.getTopBlocks(true);
  const startBlock = topBlocks.find(block => block.type === 'start');
  
  if (!startBlock) {
    return { error: 'No start block found' };
  }

  const jsonOutput = blockToJson(startBlock);
  return JSON.stringify(jsonOutput, null, 2);
}

// Export function for use in index.html
window.generateJson = generateJson;
