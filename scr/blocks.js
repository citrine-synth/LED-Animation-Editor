// blocks.js - Updated Blockly block definitions for LED animation editor with if statements and variables

// ANIMATION BLOCKS
// Display single image
Blockly.Blocks['display_image'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Display Image")
        .appendField(new Blockly.FieldTextInput("image.bmp"), "FILENAME");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("Display a single image on the LED panel");
    this.setHelpUrl("");
  }
};

// Play animation folder
Blockly.Blocks['play_animation'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Play Animation")
        .appendField(new Blockly.FieldTextInput("animation_folder"), "FOLDER")
        .appendField("for")
        .appendField(new Blockly.FieldNumber(500, 0), "PLAY_FOR")
        .appendField("ms");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("Play a folder of images as an animation for specified duration");
    this.setHelpUrl("");
  }
};

// CONTROL BLOCKS
// Wait block
Blockly.Blocks['wait'] = {
  init: function() {
    this.appendValueInput("TIME")
        .setCheck("Number")
        .appendField("Wait");
    this.appendDummyInput()
        .appendField("ms");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(120);
    this.setTooltip("Wait for specified time in milliseconds");
    this.setHelpUrl("");
  }
};

// Random range number generator
Blockly.Blocks['random_range'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Random between")
        .appendField(new Blockly.FieldNumber(100, 0), "MIN")
        .appendField("and")
        .appendField(new Blockly.FieldNumber(1000, 0), "MAX");
    this.setOutput(true, "Number");
    this.setColour(120);
    this.setTooltip("Generate a random number between min and max milliseconds");
    this.setHelpUrl("");
  }
};

// Number input block
Blockly.Blocks['number'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Number")
        .appendField(new Blockly.FieldNumber(1000, 0), "NUMBER");
    this.setOutput(true, "Number");
    this.setColour(120);
    this.setTooltip("Enter a custom number value");
    this.setHelpUrl("");
  }
};

// If statement block
Blockly.Blocks['if'] = {
  init: function() {
    this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("If");
    this.appendStatementInput("TRUE")
        .setCheck(null)
        .appendField("Do");
    this.appendStatementInput("FALSE")
        .setCheck(null)
        .appendField("Else");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("Execute statements based on a condition");
    this.setHelpUrl("");
  }
};

// Comparison block for conditions
Blockly.Blocks['compare'] = {
  init: function() {
    this.appendValueInput("LEFT")
        .setCheck("Number");
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["=", "EQ"],
          ["≠", "NEQ"],
          ["<", "LT"],
          [">", "GT"],
          ["≤", "LTE"],
          ["≥", "GTE"]
        ]), "OPERATOR");
    this.appendValueInput("RIGHT")
        .setCheck("Number");
    this.setOutput(true, "Boolean");
    this.setColour(210);
    this.setTooltip("Compare two numbers with an operator");
    this.setHelpUrl("");
  }
};

// Variable set block
Blockly.Blocks['set_variable'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Set variable")
        .appendField(new Blockly.FieldTextInput("myVar"), "VAR_NAME");
    this.appendValueInput("VALUE")
        .setCheck(["Number", "String"])
        .appendField("to");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(330);
    this.setTooltip("Set a variable to a value");
    this.setHelpUrl("");
  }
};

// Variable get block
Blockly.Blocks['get_variable'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Get variable")
        .appendField(new Blockly.FieldTextInput("myVar"), "VAR_NAME");
    this.setOutput(true, ["Number", "String"]);
    this.setColour(330);
    this.setTooltip("Get the value of a variable");
    this.setHelpUrl("");
  }
};

// GPIO BLOCKS
// Set GPIO pin state
Blockly.Blocks['gpio'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Set GPIO")
        .appendField(new Blockly.FieldNumber(0, 0, 40), "PIN")
        .appendField("to")
        .appendField(new Blockly.FieldDropdown([
          ["HIGH", "HIGH"],
          ["LOW", "LOW"]
        ]), "STATE");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Set a GPIO pin HIGH or LOW");
    this.setHelpUrl("");
  }
};

// GPIO conditional
Blockly.Blocks['if_gpio'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("If GPIO")
        .appendField(new Blockly.FieldNumber(0, 0, 40), "PIN")
        .appendField("is")
        .appendField(new Blockly.FieldDropdown([
          ["HIGH", "HIGH"],
          ["LOW", "LOW"]
        ]), "STATE");
    this.appendStatementInput("TRUE")
        .setCheck(null)
        .appendField("Do");
    this.appendStatementInput("FALSE")
        .setCheck(null)
        .appendField("Else");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("Conditional execution based on GPIO pin state");
    this.setHelpUrl("");
  }
};

// GPIO trigger (interrupt-style)
Blockly.Blocks['gpio_trigger'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("When GPIO")
        .appendField(new Blockly.FieldNumber(0, 0, 40), "PIN")
        .appendField("triggers")
        .appendField(new Blockly.FieldDropdown([
          ["Rising Edge", "RISING"],
          ["Falling Edge", "FALLING"],
          ["Any Change", "BOTH"],
          ["Is HIGH", "HIGH"],
          ["Is LOW", "LOW"]
        ]), "TRIGGER");
    this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("Do");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Trigger actions based on GPIO level or edge changes");
    this.setHelpUrl("");
  }
};

// FLOW CONTROL
// Start block - entry point
Blockly.Blocks['start'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Start Program");
    this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("Do");
    this.setColour(65);
    this.setTooltip("Entry point for the animation sequence");
    this.setHelpUrl("");
    this.setDeletable(true);
    this.setMovable(true);
  }
};

// Forever loop block
Blockly.Blocks['forever'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Forever");
    this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("Do");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(65);
    this.setTooltip("Repeat the enclosed blocks forever");
    this.setHelpUrl("");
  }
};

// Repeat N times loop
Blockly.Blocks['repeat'] = {
  init: function() {
    this.appendValueInput("TIMES")
        .setCheck("Number")
        .appendField("Repeat");
    this.appendDummyInput()
        .appendField("times");
    this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("Do");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(65);
    this.setTooltip("Repeat the enclosed blocks a specified number of times");
    this.setHelpUrl("");
  }
};

// While loop
Blockly.Blocks['while'] = {
  init: function() {
    this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("While");
    this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("Do");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(65);
    this.setTooltip("Repeat the enclosed blocks while condition is true");
    this.setHelpUrl("");
  }
};

// Break out of loop
Blockly.Blocks['break'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Break out of loop");
    this.setPreviousStatement(true, null);
    this.setColour(65);
    this.setTooltip("Exit the current loop");
    this.setHelpUrl("");
  }
};

// COLOR BLOCKS
// Set color for subsequent operations
Blockly.Blocks['set_color'] = {
  init: function() {
    this.appendValueInput("COLOR")
        .setCheck("String")
        .appendField("Set Color to");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(20);
    this.setTooltip("Set the color filter for subsequent images or animations");
    this.setHelpUrl("");
  }
};

// Predefined color values
Blockly.Blocks['color_value'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Color")
        .appendField(new Blockly.FieldDropdown([
          ["Red", "#FF0000"],
          ["Green", "#00FF00"],
          ["Blue", "#0000FF"],
          ["Yellow", "#FFFF00"],
          ["Purple", "#FF00FF"],
          ["Cyan", "#00FFFF"],
          ["White", "#FFFFFF"],
          ["Orange", "#FF8000"],
          ["Pink", "#FF69B4"],
          ["Lime", "#32CD32"],
          ["Brown", "#8B4513"],
          ["Black", "#000000"],
          ["Random", "RANDOM"]
        ]), "COLOR");
    this.setOutput(true, "String");
    this.setColour(20);
    this.setTooltip("Select a predefined color value");
    this.setHelpUrl("");
  }
};

// Custom hex color input
Blockly.Blocks['custom_color'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Custom Color")
        .appendField(new Blockly.FieldTextInput("#FF0000"), "COLOR");
    this.setOutput(true, "String");
    this.setColour(20);
    this.setTooltip("Enter a custom hex color code (e.g., #FF0000 for red)");
    this.setHelpUrl("");
  }
};

// RGB color builder
Blockly.Blocks['rgb_color'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("RGB Color")
        .appendField("R:")
        .appendField(new Blockly.FieldNumber(255, 0, 255), "RED")
        .appendField("G:")
        .appendField(new Blockly.FieldNumber(0, 0, 255), "GREEN")
        .appendField("B:")
        .appendField(new Blockly.FieldNumber(0, 0, 255), "BLUE");
    this.setOutput(true, "String");
    this.setColour(20);
    this.setTooltip("Create a color using RGB values (0-255 each)");
    this.setHelpUrl("");
  }
};