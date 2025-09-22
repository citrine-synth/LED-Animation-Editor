
Blockly.JavaScript = new Blockly.Generator('JavaScript');

function blockToJson(block, processNext = true) {
  if (!block) return null;

  const blockJson = {
    type: block.type,
    id: block.id
  };

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

  if (processNext) {
    const nextBlock = block.getNextBlock();
    if (nextBlock) {
      blockJson.next = blockToJson(nextBlock, true);
    }
  }

  return blockJson;
}

function generateStatementJson(startBlock) {
  if (!startBlock) return null;
  
  const statements = [];
  let currentBlock = startBlock;

  while (currentBlock) {

    const blockJson = blockToJson(currentBlock, false);
    if (blockJson) {
      statements.push(blockJson);
    }

    currentBlock = currentBlock.getNextBlock();
  }

  for (let i = 0; i < statements.length - 1; i++) {
    statements[i].next = statements[i + 1];
  }
  
  return statements.length > 0 ? statements[0] : null;
}

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

function generateJson(workspace) {
  const topBlocks = workspace.getTopBlocks(true);
  const startBlock = topBlocks.find(block => block.type === 'start');
  
  if (!startBlock) {
    return JSON.stringify({ error: 'No start block found' }, null, 2);
  }

  console.log('Generating JSON from workspace...');
  const startTime = performance.now();
  
  const jsonOutput = blockToJson(startBlock, true);
  
  const endTime = performance.now();
  const jsonString = JSON.stringify(jsonOutput, null, 2);
  
  console.log(`JSON generation completed in ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`JSON size: ${jsonString.length} characters`);
  
  return jsonString;
}

window.generateJson = generateJson;
