import { getOpenAIInstance } from './openaiInstance';

// Function to process complex parameter data
const processParameterData = (paramData) => {
  if (!paramData || typeof paramData !== 'object') {
    return paramData;
  }
  
  // Create a new object to avoid modifying the original
  const processedData = { ...paramData };
  
  // Handle complex parameter objects
  if (processedData.value && typeof processedData.value === 'object') {
    console.log('Detected complex parameter value object:', processedData.value);
    const key = processedData.key;
    const value = processedData.value;
    
    // Select value based on parameter type
    if (key.includes('roof')) {
      if (value.height !== undefined) {
        // For roof parameters, use height as the main parameter
        processedData.key = 'roofHeight';
        processedData.label = processedData.label || 'Roof Height';
        processedData.min = value.height - 1000;
        processedData.max = value.height + 1000;
        processedData.value = value.height;
        processedData.step = 100;
        processedData.description = processedData.description || 'Adjust the height of the roof, affecting the overall building silhouette.';
      } else if (value.pitch !== undefined) {
        // Use pitch as the main parameter
        processedData.key = 'roofPitch';
        processedData.label = processedData.label || 'Roof Pitch';
        processedData.min = Math.max(5, value.pitch - 20);
        processedData.max = Math.min(60, value.pitch + 20);
        processedData.value = value.pitch;
        processedData.step = 5;
        processedData.description = processedData.description || 'Adjust the pitch of the roof, affecting drainage and aesthetics.';
      }
    } else if (key.includes('window')) {
      if (value.width !== undefined) {
        // For window parameters, use width as the main parameter
        processedData.key = 'windowWidth';
        processedData.label = processedData.label || 'Window Width';
        processedData.min = Math.max(500, value.width - 500);
        processedData.max = value.width + 500;
        processedData.value = value.width;
        processedData.step = 50;
        processedData.description = processedData.description || 'Adjust the width of the window, affecting lighting and aesthetics.';
      } else if (value.height !== undefined) {
        // Use height as the main parameter
        processedData.key = 'windowHeight';
        processedData.label = processedData.label || 'Window Height';
        processedData.min = Math.max(500, value.height - 500);
        processedData.max = value.height + 500;
        processedData.value = value.height;
        processedData.step = 50;
        processedData.description = processedData.description || 'Adjust the height of the window, affecting lighting and view.';
      }
    } else if (key.includes('wall') && value.thickness !== undefined) {
      // For wall parameters, use thickness as the main parameter
      processedData.key = 'wallThickness';
      processedData.label = processedData.label || 'Wall Thickness';
      processedData.min = Math.max(100, value.thickness - 100);
      processedData.max = value.thickness + 200;
      processedData.value = value.thickness;
      processedData.step = 10;
      processedData.description = processedData.description || 'Adjust the thickness of the wall, affecting insulation and structural strength.';
    } else if (key.includes('door')) {
      if (value.width !== undefined) {
        // For door parameters, use width as the main parameter
        processedData.key = 'doorWidth';
        processedData.label = processedData.label || 'Door Width';
        processedData.min = Math.max(600, value.width - 300);
        processedData.max = value.width + 300;
        processedData.value = value.width;
        processedData.step = 50;
        processedData.description = processedData.description || 'Adjust the width of the door, affecting passage and aesthetics.';
      } else if (value.height !== undefined) {
        // Use height as the main parameter
        processedData.key = 'doorHeight';
        processedData.label = processedData.label || 'Door Height';
        processedData.min = Math.max(1800, value.height - 300);
        processedData.max = value.height + 300;
        processedData.value = value.height;
        processedData.step = 50;
        processedData.description = processedData.description || 'Adjust the height of the door, affecting passage and aesthetics.';
      }
    } else {
      // For other complex parameters, try to find the first numeric property
      const numericProps = Object.entries(value).filter(([_, v]) => typeof v === 'number');
      if (numericProps.length > 0) {
        const [propName, propValue] = numericProps[0];
        processedData.key = `${key}${propName.charAt(0).toUpperCase() + propName.slice(1)}`;
        processedData.label = processedData.label || `${key} ${propName}`;
        processedData.min = Math.max(0, propValue - propValue * 0.3);
        processedData.max = propValue + propValue * 0.3;
        processedData.value = propValue;
        processedData.step = Math.max(1, Math.floor(propValue / 20));
        processedData.description = processedData.description || `Adjust the ${propName} parameter of ${key}.`;
      }
    }
  }
  
  return processedData;
};

// Format parameters into user-friendly natural language
const formatParameterAsMessage = (paramData) => {
  try {
    // Create different friendly messages based on parameter types
    let friendlyMessage = '';
    
    // Check if the parameter is related to color
    const isColorParam = paramData.key.toLowerCase().includes('color') || 
                        paramData.key.toLowerCase().includes('material');
    
    // Check parameter type
    const paramType = paramData.type || 'slider';
    
    if (isColorParam) {
      // Friendly message for color parameters
      const element = paramData.element || 'building element';
      friendlyMessage = `Next, we can adjust the ${paramData.label}. Color selection affects the visual impact and emotional experience of the building. The color of the ${element === 'roof' ? 'roof' : element === 'wall' ? 'wall' : element === 'window' ? 'window' : element === 'door' ? 'door' : 'building element'} should harmonize with the overall environment, considering light reflectance and heat absorption characteristics. ${paramData.description || ''}`;
    } else if (paramType === 'select' && paramData.options) {
      // Friendly message for select-type parameters
      const optionsText = paramData.options.map(opt => opt.label).join(', ');
      friendlyMessage = `Next, we can choose the ${paramData.label}. Options include: ${optionsText}. ${paramData.description || ''}`;
    } else {
      // Friendly message for other numeric-type parameters
      switch(paramData.key) {
        case 'height':
          friendlyMessage = `Next, we can adjust the ceiling height. The current height is ${paramData.value} mm, and you can adjust it between ${paramData.min} and ${paramData.max} mm. Building height affects the overall sense of scale and space utilization efficiency. For residential buildings, a floor height of 3000-3500 mm usually provides a comfortable living space while maintaining good insulation performance. ${paramData.description || ''}`;
          break;
        case 'height_floor':
          friendlyMessage = `Now, we can adjust the specific height of the floor. The current floor height is ${paramData.value} mm, and you can adjust it between ${paramData.min} and ${paramData.max} mm. Floor height directly impacts the spatial feel and comfort of the room. An appropriate floor height can enhance the living experience and help optimize lighting and ventilation. ${paramData.description || ''}`;
          break;
        case 'roofHeight':
          friendlyMessage = `Let's adjust the roof height. The current height is ${paramData.value} mm, and you can adjust it between ${paramData.min} and ${paramData.max} mm. Adjusting the roof height can change the building's silhouette and spatial feel. A higher roof can provide better drainage and insulation performance and increase attic space. It is recommended to choose a suitable roof height based on the overall building height, usually 1/4 to 1/3 of the total height. ${paramData.description || ''}`;
          break;
        case 'roofPitch':
          friendlyMessage = `Next, we can adjust the roof pitch. The current angle is ${paramData.value} degrees, and you can adjust it between ${paramData.min} and ${paramData.max} degrees. The roof pitch determines the drainage effect and style characteristics of the roof. A steeper pitch (30-45 degrees) is suitable for areas with heavy rain and snow, effectively draining water and preventing snow accumulation; a gentler pitch (15-25 degrees) is more suitable for dry climates and can bring a modern minimalist feel. ${paramData.description || ''}`;
          break;
        case 'pitch_roof':
          friendlyMessage = `Next, we can adjust the roof pitch. The current angle is ${paramData.value} degrees, and you can adjust it between ${paramData.min} and ${paramData.max} degrees. The roof pitch determines the drainage effect and style characteristics of the roof. A steeper pitch (30-45 degrees) is suitable for areas with heavy rain and snow, effectively draining water and preventing snow accumulation; a gentler pitch (15-25 degrees) is more suitable for dry climates and can bring a modern minimalist feel. ${paramData.description || ''}`;
          break;
        case 'roofOverhang':
          friendlyMessage = `Next, we can adjust the roof overhang. The current overhang length is ${paramData.value} mm, and you can adjust it between ${paramData.min} and ${paramData.max} mm. The roof overhang refers to the horizontal distance the roof extends beyond the wall boundary, effectively protecting the wall from rain erosion and providing shade for windows. In tropical and subtropical regions, larger overhangs (600-900mm) are more common, while temperate regions are suitable for medium overhangs (300-600mm). ${paramData.description || ''}`;
          break;
        case 'overhang_roof':
          friendlyMessage = `Now, let's adjust the roof overhang. The current overhang is ${paramData.value} mm, and you can adjust it between ${paramData.min} and ${paramData.max} mm. The roof overhang refers to the horizontal distance the roof extends beyond the wall boundary, effectively protecting the wall from rain erosion and providing shade for windows. In tropical and subtropical regions, larger overhangs (600-900mm) are more common, while temperate regions are suitable for medium overhangs (300-600mm). ${paramData.description || ''}`;
          break;
        case 'wallThickness':
          friendlyMessage = `Now, let's adjust the wall thickness. The current thickness is ${paramData.value} mm, and you can adjust it between ${paramData.min} and ${paramData.max} mm. Wall thickness affects the building's insulation performance and structural stability. Generally, an exterior wall thickness of 200-300 mm is reasonable, providing good insulation and heat insulation effects; interior walls can be 100-150 mm, meeting load-bearing and sound insulation needs. ${paramData.description || ''}`;
          break;
        case 'floorCount':
          friendlyMessage = `Next, we can adjust the number of floors. The current number of floors is ${paramData.value}, and you can set it between ${paramData.min} and ${paramData.max} floors. The number of floors directly determines the vertical space distribution and total usable area of the building. Single-story buildings are more suitable for the elderly and people with limited mobility, while multi-story buildings can provide more usable space on a limited footprint. Considering fire safety and structural safety, multi-story residential buildings usually do not exceed 4 floors, while commercial buildings can be higher. ${paramData.description || ''}`;
          break;
        case 'totalArea':
          friendlyMessage = `Let's adjust the total area of the building. The current area is ${paramData.value} square meters, and you can adjust it between ${paramData.min} and ${paramData.max} square meters. The total area is a fundamental parameter for planning building functional zoning. A modern comfortable single-person residence usually requires 60-80 square meters, while a family residence requires more than 100-150 square meters. Increasing the area can provide more spacious living space but will also increase construction and maintenance costs. It is recommended to choose a suitable building area based on actual needs and economic conditions. ${paramData.description || ''}`;
          break;
        case 'windowSize':
          friendlyMessage = `Let's adjust the overall size of the window. The current size is ${paramData.value} mm, and you can adjust it between ${paramData.min} and ${paramData.max} mm. The size of the window affects the amount of natural light and ventilation entering. Larger windows can enhance the view and brightness but may affect insulation performance; smaller windows help with insulation but may limit light and openness. Consider the room's purpose when choosing window size. ${paramData.description || ''}`;
          break;
        case 'windowWidth':
          friendlyMessage = `Let's adjust the width of the window. The current width is ${paramData.value} mm, and you can adjust it between ${paramData.min} and ${paramData.max} mm. The width of the window plays a crucial role in determining the lighting and ventilation of the room. Wider windows can provide more light and a better view but may reduce energy efficiency. Narrower windows help with insulation but may limit natural light. Choose the width based on the room's function and desired atmosphere. ${paramData.description || ''}`;
          break;
        case 'windowHeight':
          friendlyMessage = `Let's adjust the height of the window. The current height is ${paramData.value} mm, and you can adjust it between ${paramData.min} and ${paramData.max} mm. The height of the window affects the flow of light and air within the room. Taller windows can provide more light and a grander view but may lead to higher energy costs. Shorter windows can enhance privacy and insulation. Consider the room's needs when choosing window height. ${paramData.description || ''}`;
          break;
        case 'doorSize':
          friendlyMessage = `Let's adjust the overall size of the door. The current size is ${paramData.value} mm, and you can adjust it between ${paramData.min} and ${paramData.max} mm. The size of the door affects passage convenience and spatial perception. Larger doors can facilitate flow and create a sense of openness, while smaller doors can provide a more intimate feel. Choose the door size based on the room's function and desired level of passage. ${paramData.description || ''}`;
          break;
        case 'doorWidth':
          friendlyMessage = `Let's adjust the width of the door. The current width is ${paramData.value} mm, and you can adjust it between ${paramData.min} and ${paramData.max} mm. The width of the door is crucial for ensuring passage convenience and flow. Wider doors can accommodate larger items and improve passage convenience, while narrower doors can save space. Consider the room's purpose and passage needs when choosing door width. ${paramData.description || ''}`;
          break;
        case 'doorHeight':
          friendlyMessage = `Next, let's adjust the size of the door. The current height is ${paramData.value} mm, and you can adjust it between ${paramData.min} and ${paramData.max} mm. The size of the door relates to passage convenience and spatial perception. Standard interior door heights are usually 2000-2100 mm, with widths of 800-900 mm; entrance doors can be wider, usually 900-1000 mm, to facilitate the entry and exit of large items. The width of doors in public spaces is recommended to be no less than 900 mm to meet wheelchair access needs. ${paramData.description || ''}`;
          break;
        case 'wallHeight':
          friendlyMessage = `Next, let's adjust the wall height. The current height is ${paramData.value} mm, and you can adjust it between ${paramData.min} and ${paramData.max} mm. Wall height affects the overall visual effect and internal spatial perception of the building. Standard floor heights are usually between 2700-3000 mm, and higher walls bring a more spacious feel but may increase construction and maintenance costs. ${paramData.description || ''}`;
          break;
        default: 
          const unit = paramData.unit ? `${paramData.unit}` : '';
          // friendlyMessage = `Welcome to Archtalk! Next, we can adjust the ${paramData.label || paramData.key}. The current value is ${paramData.value}${unit}, and you can adjust it between ${paramData.min} and ${paramData.max}${unit}. This parameter will affect the overall appearance and functionality of the building. Try different values to find the setting that best suits your needs. ${paramData.description || ''}`;
          friendlyMessage = `Welcome to Archtalk! Let's Talk to Build, Build to Think, Think to Create! Please use the controls below or the textbox to build your own house.`;
      }
    }
    
    return friendlyMessage;
  } catch (error) {
    console.error('Error formatting parameter message:', error);
    return 'Let’s adjust the next parameter. Please use the controls to adjust the parameter value.';
  }
};

// Send request to OpenAI API
export const sendToGPT = async (userMessage, buildingData, systemPromptText) => {
  try {
    // Construct system prompt
    const finalSystemPrompt = systemPromptText || `You are a building design assistant. Your task is to help modify building designs based on user requests.
You must ALWAYS respond with valid JSON data that follows this exact structure:
{
  "building": {
    "name": string,
    "floors": [
      {
        "name": string,
        "level": number,
        "height": number,
        "material": {
          "color": string (hex color),
          "opacity": number
        },
        "rooms": [
          {
            "name": string,
            "footprint": [[number, number], [number, number], [number, number], [number, number]],
            "walls": [
              {
                "start": [number, number],
                "end": [number, number],
                "thickness": number,
                "material": {
                  "color": string (hex color),
                  "opacity": number
                },
                "window": {
                  "position": number,
                  "verticalPosition": number,
                  "width": number,
                  "height": number,
                  "depth": number,
                  "material": {
                    "color": string (hex color),
                    "opacity": number
                  }
                },
                "door": {
                  "position": number,
                  "width": number,
                  "height": number,
                  "depth": number,
                  "material": {
                    "color": string (hex color),
                    "opacity": number
                  }
                }
              }
            ]
              }
            ],
            "roof": {
              "type": string,
              "height": number,
              "overhang": number,
              "pitch": number,
              "thickness": number,
              "material": {
                "color": string (hex color),
                "opacity": number
              }
            }
      }
    ]
  }
}

Important rules:
1. When adding new floors (increasing level), you MUST include complete room structures with walls, windows, and doors.
2. Each new floor should have at least one room with the same basic structure as the ground floor.
3. Maintain consistent dimensions and materials across floors unless specifically requested to change.
4. All measurements should be in millimeters.
5. Colors must be in hex format (e.g., "#ffffff").
6. Never include comments or explanations in the JSON.
7. Always maintain the exact structure shown above.
8. When modifying existing floors, preserve their unique features while updating requested changes.
9. Ensure all floors have proper connections (stairs, etc.) if needed.
10. The roof property should be at the floor level, not the room level.
11. When changing the height of a floor, you MUST adjust the position of all floors above it to maintain proper vertical alignment.
12. The "roof" data MUST be in the JSON data and ONLY located at the same height as the highest floor.
13. If the JSON data has multiple floors, a "staircase" property must be included in the JSON data.
14. The floor of the upper floor should attach on the top of the floor of the lower floor.
15. If the building has more than one floor, the rooms called "staircase" (on each floor and align with each other) should be included in the JSON data.
16. Each floor should be the same height.
17. The parameter "verticalPosition" of the window and door should be within the range of the floor height. 
18. Windows and doors should be subordinate to walls. 
19. A roof should be always included in the JSON data.
20. Each room needs to have a door.
21. Think about the circulation for the rooms based on general interior design knowledge. 
22. The rooms should be connected to each other.
23. The minimum length of the room should be 3000mm.
24. DO NOT locate windows and doors outside the wall, meaning that the parameter "position" and "verticalPosition" should be within the range of the wall. 

When asked to recommend the next parameter to adjust, respond with a JSON object in this format:
{
  "key": string (parameter identifier),
  "label": string (human-readable label),
  "min": number (minimum value),
  "max": number (maximum value),
  "value": number (current value),
  "step": number (optional, step size for the slider),
  "description": string (provide a DETAILED and COMPREHENSIVE explanation of this parameter, around 2-3 sentences long, including typical values, impact on building design, and professional recommendations),
  "element": string (optional, specifies the element type such as "roof", "wall", "window", "door", "floor"),
  "elementIndex": number (optional, the index of the element if applicable)
}

Parameter recommendation rules:
1. Consider the current building state when recommending parameters
2. Prioritize parameters that would have the most impact on the current design
3. Ensure parameter ranges are reasonable and consistent
4. Provide DETAILED DESCRIPTIONS that explain the parameter's purpose, impact, and typical values in professional terms
5. Use natural, conversational language in descriptions as if you're a professional architect explaining to a client
6. Consider the order of parameters (e.g., basic structure before aesthetics)
7. Avoid recommending parameters that have already been adjusted
8. Make sure the parameter is relevant to the current building state
9. For color parameters, ALWAYS specify the "element" field to indicate which element's color to change
10. Use specific element identifiers like "roof", "wall", "window", "door", "floor" for color parameters
11. Start from the total floor area, total number of floors, total number of rooms, total length of the building, total width of the building, etc.`;

    // Construct user prompt
    const finalUserPrompt = `Current building model data:
${JSON.stringify(buildingData, null, 2)}

User request: ${userMessage}

Please modify the building model data based on the user request and return the complete JSON data.`;

    // Log request content
    console.log('===== backend > GPT =====');
    console.log('System prompt:', finalSystemPrompt);
    console.log('User prompt:', finalUserPrompt);
    console.log('Building data:', JSON.stringify(buildingData, null, 2));
    console.log('============================');

    // Get the latest OpenAI instance with the current API key
    const openai = getOpenAIInstance();
    console.log('Using OpenAI API key:', openai.apiKey.substring(0, 3) + '...');

    // Send request to OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: finalSystemPrompt },
        { role: "user", content: finalUserPrompt }
      ],
      temperature: 0.7
    });

    // Extract response content
    const content = response.choices[0].message.content;
    
    // Log response content
    console.log('===== GPT > backend =====');
    console.log('Original response:', content);
    console.log('============================');
    
    // Attempt to parse JSON
    try {
      // Preprocess: remove comments and extra whitespace from JSON
      const cleanContent = content
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/```json|```/g, ''); // Remove code block markers
      
      console.log('Cleaned content:', cleanContent);
      
      // First, try to directly parse the entire response
      try {
        const jsonData = JSON.parse(cleanContent);
        console.log('Successfully parsed JSON data:', jsonData);
        
        // Check if it's a parameter recommendation format
        if (jsonData.key && jsonData.label && 
            (jsonData.min !== undefined) && 
            (jsonData.max !== undefined) && 
            (jsonData.value !== undefined)) {
          console.log('Identified as parameter recommendation format');
          
          // Process complex parameter structure
          const processedData = processParameterData(jsonData);
          
          return {
            success: true,
            data: processedData,
            message: formatParameterAsMessage(processedData),
            isParameterRecommendation: true
          };
        }
        
        // Check if it's a building data format (with building property)
        if (jsonData.building) {
          console.log('Identified as building data format');
        return {
          success: true,
          data: jsonData,
            message: "Successfully updated building model",
            isParameterRecommendation: false
          };
        }
        
        // If it doesn't match expected format, try to find nested JSON objects
        if (typeof jsonData === 'object') {
          // Check for building or parameter recommendation in nested structure
          for (const key in jsonData) {
            const value = jsonData[key];
            if (typeof value === 'object' && value !== null) {
              if (value.building) {
                console.log('Found building data in nested structure');
                return {
                  success: true,
                  data: value,
                  message: "Successfully updated building model",
                  isParameterRecommendation: false
                };
              }
              
              if (value.key && value.label && 
                  (value.min !== undefined) && 
                  (value.max !== undefined) && 
                  (value.value !== undefined)) {
                console.log('Found parameter recommendation in nested structure');
                const processedData = processParameterData(value);
                return {
                  success: true,
                  data: processedData,
                  message: formatParameterAsMessage(processedData),
                  isParameterRecommendation: true
                };
              }
            }
          }
        }
        
        // Unrecognized JSON structure
        console.warn('Parsed JSON but does not match expected format:', jsonData);
      } catch (directParseError) {
        console.error('Error parsing JSON directly:', directParseError);
      }
      
      // If direct parsing fails, try extracting JSON from response
      const extractJsonObject = (text) => {
        // Find the largest JSON object
        const bracketPairs = [];
        let openBracketIndex = -1;
        let maxLength = 0;
        let maxJsonStart = -1;
        let maxJsonEnd = -1;
        let bracketCount = 0;
        
        // Find all possible JSON objects
        for (let i = 0; i < text.length; i++) {
          if (text[i] === '{') {
            if (bracketCount === 0) {
              openBracketIndex = i;
            }
            bracketCount++;
          } else if (text[i] === '}') {
            bracketCount--;
            if (bracketCount === 0 && openBracketIndex !== -1) {
              const length = i - openBracketIndex + 1;
              if (length > maxLength) {
                maxLength = length;
                maxJsonStart = openBracketIndex;
                maxJsonEnd = i + 1;
              }
              bracketPairs.push([openBracketIndex, i]);
              openBracketIndex = -1;
            }
          }
        }
        
        // If a complete JSON object is found, try parsing
        if (maxJsonStart !== -1 && maxJsonEnd !== -1) {
          const jsonCandidate = text.substring(maxJsonStart, maxJsonEnd);
          try {
            return JSON.parse(jsonCandidate);
          } catch (e) {
            console.warn('Failed to parse extracted JSON candidate:', e);
            // For all possible JSON fragments, try fixing and parsing
            for (const [start, end] of bracketPairs) {
              try {
                const fragment = text.substring(start, end + 1);
                // Try fixing common issues
                const fixed = fixCommonJsonErrors(fragment);
                return JSON.parse(fixed);
              } catch (err) {
                // Continue trying the next one
              }
            }
          }
        }
        
        return null;
      };
      
      // Fix common JSON errors
      const fixCommonJsonErrors = (jsonStr) => {
        let fixed = jsonStr;
        
        // Fix missing commas
        fixed = fixed.replace(/(["\d])\s*}\s*"/g, '$1,"');
        fixed = fixed.replace(/(["\d])\s*}\s*{/g, '$1},{');
        
        // Fix missing quotes on keys
        fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
        
        // Fix trailing commas
        fixed = fixed.replace(/,\s*}/g, '}');
        fixed = fixed.replace(/,\s*]/g, ']');
        
        // Fix incorrect boolean or null values
        fixed = fixed.replace(/"(true|false|null)"/g, '$1');
        
        return fixed;
      };
      
      // Extract and attempt to parse JSON
      const extractedJson = extractJsonObject(cleanContent);
      if (extractedJson) {
        console.log('Extracted JSON from response:', extractedJson);
        
        // Check if it's a parameter recommendation format
        if (extractedJson.key && extractedJson.label && 
            (extractedJson.min !== undefined) && 
            (extractedJson.max !== undefined) && 
            (extractedJson.value !== undefined)) {
          const processedData = processParameterData(extractedJson);
          return {
            success: true,
            data: processedData,
            message: formatParameterAsMessage(processedData),
            isParameterRecommendation: true
          };
        }
        
        // Check if it's a building data format
        if (extractedJson.building) {
          return {
            success: true,
            data: extractedJson,
            message: "Successfully updated building model",
            isParameterRecommendation: false
          };
        }
      }
      
      // If unable to extract complete JSON, try using regex to find parameter recommendation
      const paramPattern = /"key"\s*:\s*"([^"]+)"\s*,\s*"label"\s*:\s*"([^"]+)"\s*,\s*"min"\s*:\s*(\d+)\s*,\s*"max"\s*:\s*(\d+)\s*,\s*"value"\s*:\s*(\d+)/;
      const paramMatch = cleanContent.match(paramPattern);
      
      if (paramMatch) {
        console.log('Found parameter recommendation via regex:', paramMatch);
        try {
          // Construct parameter object
          const paramData = {
            key: paramMatch[1],
            label: paramMatch[2],
            min: parseInt(paramMatch[3]),
            max: parseInt(paramMatch[4]),
            value: parseInt(paramMatch[5]),
            step: 1,
            description: "Adjust this parameter to modify the building design."
          };
          
          const processedData = processParameterData(paramData);
          return {
            success: true,
            data: processedData,
            message: formatParameterAsMessage(processedData),
            isParameterRecommendation: true
          };
        } catch (paramError) {
          console.error('Error parsing parameter recommendation data:', paramError);
        }
      }
      
      // If all methods fail, return a default parameter recommendation
      console.warn('Unable to parse valid JSON, returning default parameter');
      const defaultParam = {
        key: "height",
        label: "Floor Height",
        min: 2500,
        max: 4000,
        value: 3000,
        step: 100,
        description: "Adjust the height of the floor."
      };
      
      return {
        success: true,
        data: defaultParam,
        message: formatParameterAsMessage(defaultParam),
        isParameterRecommendation: true
      };
    } catch (error) {
      console.error('Error processing GPT response:', error);
      return {
        success: false,
        error: 'Error processing GPT response: ' + error.message
      };
    }
  } catch (error) {
    console.error('Error sending request to GPT:', error);
    return {
      success: false,
      error: 'Error sending request to GPT'
    };
  }
};

// Function to validate building data structure
export const validateBuildingData = (data) => {
  console.log('Starting building data validation...');
  console.log('Input data:', data);
  
  if (!data || typeof data !== 'object') {
    console.error('Data is not a valid object');
    return { valid: false, error: 'Data is not a valid object' };
  }
  
  if (!data.building) {
    console.error('Data is missing building property');
    return { valid: false, error: 'Data is missing building property' };
  }
  
  const building = data.building;
  console.log('Building data:', building);
  
  // Check basic properties
  if (!building.name || typeof building.name !== 'string') {
    console.error('Invalid building name');
    return { valid: false, error: 'Invalid building name' };
  }
  
  if (!Array.isArray(building.floors) || building.floors.length === 0) {
    console.error('Invalid floor data');
    return { valid: false, error: 'Invalid floor data' };
  }

  // Check each floor
  for (let i = 0; i < building.floors.length; i++) {
    const floor = building.floors[i];
    console.log(`Checking floor ${i + 1}:`, floor);
    
    if (!floor.name || typeof floor.name !== 'string') {
      console.error(`Invalid name for floor ${i + 1}`);
      return { valid: false, error: `Invalid name for floor ${i + 1}` };
    }
    
    if (!Array.isArray(floor.rooms) || floor.rooms.length === 0) {
      console.error(`Invalid room data for floor ${i + 1}`);
      return { valid: false, error: `Invalid room data for floor ${i + 1}` };
    }

    // Check each room
    for (let j = 0; j < floor.rooms.length; j++) {
      const room = floor.rooms[j];
      console.log(`Checking room ${j + 1} on floor ${i + 1}:`, room);
      
      if (!room.name || typeof room.name !== 'string') {
        console.error(`Invalid name for room ${j + 1} on floor ${i + 1}`);
        return { valid: false, error: `Invalid name for room ${j + 1} on floor ${i + 1}` };
      }
      
      // Check footprint property
      if (!room.footprint || !Array.isArray(room.footprint) || room.footprint.length < 4) {
        console.error(`Invalid footprint for room ${j + 1} on floor ${i + 1}`);
        return { valid: false, error: `Invalid footprint for room ${j + 1} on floor ${i + 1}` };
      }
      
      // Check walls property
      if (!room.walls || !Array.isArray(room.walls) || room.walls.length === 0) {
        console.error(`Invalid walls for room ${j + 1} on floor ${i + 1}`);
        return { valid: false, error: `Invalid walls for room ${j + 1} on floor ${i + 1}` };
      }
      
      // Check each wall
      for (let k = 0; k < room.walls.length; k++) {
        const wall = room.walls[k];
        if (!wall.start || !Array.isArray(wall.start) || wall.start.length !== 2) {
          console.error(`Invalid start point for wall ${k + 1} in room ${j + 1} on floor ${i + 1}`);
          return { valid: false, error: `Invalid start point for wall ${k + 1} in room ${j + 1} on floor ${i + 1}` };
        }
        
        if (!wall.end || !Array.isArray(wall.end) || wall.end.length !== 2) {
          console.error(`Invalid end point for wall ${k + 1} in room ${j + 1} on floor ${i + 1}`);
          return { valid: false, error: `Invalid end point for wall ${k + 1} in room ${j + 1} on floor ${i + 1}` };
        }
        
        if (!wall.thickness || typeof wall.thickness !== 'number') {
          console.error(`Invalid thickness for wall ${k + 1} in room ${j + 1} on floor ${i + 1}`);
          return { valid: false, error: `Invalid thickness for wall ${k + 1} in room ${j + 1} on floor ${i + 1}` };
        }
        
        if (!wall.material || typeof wall.material !== 'object') {
          console.error(`Invalid material for wall ${k + 1} in room ${j + 1} on floor ${i + 1}`);
          return { valid: false, error: `Invalid material for wall ${k + 1} in room ${j + 1} on floor ${i + 1}` };
        }
      }
    }
  }
  
  console.log('Building data validation passed');
  return { valid: true };
}; 