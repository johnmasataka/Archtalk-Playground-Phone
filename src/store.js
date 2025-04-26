import { create } from 'zustand';

// Parameter name mapping table for normalizing parameter names
const parameterNameMap = {
  // Roof-related parameters
  'pitch_roof': 'roofPitch',
  'roof_pitch': 'roofPitch',
  'height_roof': 'roofHeight',
  'roof_height': 'roofHeight',
  'overhang_roof': 'roofOverhang',
  'roof_overhang': 'roofOverhang',
  'type_roof': 'roofType',
  'roof_type': 'roofType',
  
  // Wall-related parameters
  'thickness_wall': 'wallThickness',
  'wall_thickness': 'wallThickness',
  
  // Floor-related parameters
  'height_floor': 'floorHeight',
  'floor_height': 'floorHeight',
  
  // Window-related parameters
  'width_window': 'windowWidth',
  'window_width': 'windowWidth',
  'height_window': 'windowHeight',
  'window_height': 'windowHeight',
  
  // Door-related parameters
  'width_door': 'doorWidth',
  'door_width': 'doorWidth',
  'height_door': 'doorHeight',
  'door_height': 'doorHeight'
};

// Function to normalize parameter names
const normalizeParameterName = (paramName) => {
  // If it exists in the mapping table, return the mapped result
  if (parameterNameMap[paramName]) {
    return parameterNameMap[paramName];
  }
  
  // Remove duplicate parts, e.g., width_window_window => width_window
  const parts = paramName.split('_');
  if (parts.length > 1) {
    const uniqueParts = [];
    for (let i = 0; i < parts.length; i++) {
      if (i === 0 || parts[i] !== parts[i-1]) {
        uniqueParts.push(parts[i]);
      }
    }
    
    // Check if the normalized name is in the mapping table
    const normalizedName = uniqueParts.join('_');
    if (parameterNameMap[normalizedName]) {
      return parameterNameMap[normalizedName];
    }
    
    // Try converting to camelCase
    if (uniqueParts.length > 1) {
      const camelCaseName = uniqueParts[0] + uniqueParts.slice(1).map(
        part => part.charAt(0).toUpperCase() + part.slice(1)
      ).join('');
      return camelCaseName;
    }
    
    return normalizedName;
  }
  
  // If there's only one part, return it directly
  return paramName;
};

// Function to normalize parameter data
const normalizeParameterData = (paramData) => {
  if (!paramData || typeof paramData !== 'object') {
    return paramData;
  }
  
  // Create a new object to avoid modifying the original
  const normalizedData = { ...paramData };
  
  // Normalize parameter names
  if (normalizedData.key) {
    normalizedData.key = normalizeParameterName(normalizedData.key);
  }
  
  return normalizedData;
};

// Default building data
const defaultBuildingData = {
  building: {
    name: "SimpleHouse",
    floors: [
      {
        name: "FirstFloor",
        level: 0,
        height: 3000,
        material: {
          color: "#cccccc",
          opacity: 0.75
        },
        rooms: [
          {
            name: "LivingRoom",
            footprint: [
              [0, 0],
              [10000, 0],
              [10000, 8000],
              [0, 8000]
            ],
            walls: [
              {
                start: [0, 0],
                end: [10000, 0],
                thickness: 150,
                material: {
                  color: "#e8e8e8",
                  opacity: 0.5
                }
              },
              {
                start: [10000, 0],
                end: [10000, 8000],
                thickness: 150,
                material: {
                  color: "#e8e8e8",
                  opacity: 0.5
                },
                window: {
                  position: 1000,
                  verticalPosition: 1000,
                  width: 1500,
                  height: 1200,
                  depth: 155,
                  material: {
                    color: "#6fa7d1",
                    opacity: 0.3
                  }
                }
              },
              {
                start: [10000, 8000],
                end: [0, 8000],
                thickness: 150,
                material: {
                  color: "#e8e8e8",
                  opacity: 0.5
                },
                door: {
                  position: 1000,
                  width: 900,
                  height: 2100,
                  depth: 155,
                  material: {
                    color: "#8b4513",
                    opacity: 0.75
                  }
                }
              },
              {
                start: [0, 8000],
                end: [0, 0],
                thickness: 150,
                material: {
                  color: "#e8e8e8",
                  opacity: 0.5
                }
              }
            ]
          }
        ],
        roof: {
          type: "gabled",
          height: 1500,
          overhang: 500,
          pitch: 30,
          thickness: 50,
          material: {
            color: "#8b4513",
            opacity: 0.75
          }
        }
      }
    ]
  }
};

// Predefined responses for chat messages
const chatResponses = {
  "hello": "Hello! I'm your architectural assistant. How can I help you design your building today?",
  "hi": "Hi there! I'm ready to help with your architectural design. What would you like to create or modify?",
  "increase roof height": "I've updated the roof height to be taller. The gabled roof now has more presence in the design.",
  "make the roof taller": "I've increased the roof height to make it more prominent in the design.",
  "change roof type to flat": "I've changed the roof type from gabled to flat. The building now has a more modern appearance.",
  "make windows bigger": "I've increased the window size to allow more natural light into the building.",
  "add a window": "I've added a new window to improve natural lighting and ventilation.",
  "change wall color": "I've updated the wall color to your preference.",
  "add a room": "I've added a new adjoining room to the existing structure.",
  "make the building bigger": "I've increased the overall dimensions of the building while maintaining its proportions.",
  "add another floor": "I've added a second floor to the building with the same footprint as the ground floor."
};

// Function to get a response based on user input
const getResponseForInput = (input) => {
  input = input.toLowerCase().trim();
  
  // Check for exact matches
  if (chatResponses[input]) {
    return chatResponses[input];
  }
  
  // Check for partial matches
  for (const key in chatResponses) {
    if (input.includes(key)) {
      return chatResponses[key];
    }
  }
  
  // Default response if no match found
  return "I understand you want to modify the building design. I've made some adjustments based on your request. What do you think?";
};

// Function to modify building data based on user input
const modifyBuildingData = (buildingData, message) => {
  const lowerMessage = message.toLowerCase();
  let modified = JSON.parse(JSON.stringify(buildingData)); // Deep clone
  
  if (lowerMessage.includes("roof height") || lowerMessage.includes("taller roof")) {
    // Increase roof height
    modified.building.floors.forEach(floor => {
      if (floor.roof) {
        floor.roof.height = Math.min(floor.roof.height * 1.5, 3000);
      }
    });
  }
  
  if (lowerMessage.includes("flat roof") || (lowerMessage.includes("change") && lowerMessage.includes("roof") && lowerMessage.includes("flat"))) {
    // Change roof type to flat
    modified.building.floors.forEach(floor => {
      if (floor.roof) {
        floor.roof.type = "flat";
        floor.roof.pitch = 0;
      }
    });
  }
  
  if (lowerMessage.includes("bigger window") || lowerMessage.includes("larger window")) {
    // Make windows bigger
    modified.building.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        room.walls.forEach(wall => {
          if (wall.window) {
            wall.window.width = Math.min(wall.window.width * 1.3, 2500);
            wall.window.height = Math.min(wall.window.height * 1.3, 2000);
          }
        });
      });
    });
  }
  
  if (lowerMessage.includes("add window") || lowerMessage.includes("new window")) {
    // Add a window to a wall that doesn't have one
    modified.building.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        let windowAdded = false;
        room.walls.forEach(wall => {
          if (!wall.window && !wall.door && !windowAdded) {
            wall.window = {
              position: Math.floor((wall.end[0] - wall.start[0]) / 2),
              verticalPosition: 1000,
              width: 1500,
              height: 1200,
              depth: 155,
              material: {
                color: "#6fa7d1",
                opacity: 0.3
              }
            };
            windowAdded = true;
          }
        });
      });
    });
  }
  
  if (lowerMessage.includes("wall color") || lowerMessage.includes("change color")) {
    // Change wall color
    const colors = ["#f5f5f5", "#e0e0e0", "#d2b48c", "#a9a9a9"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    modified.building.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        room.walls.forEach(wall => {
          wall.material.color = randomColor;
        });
      });
    });
  }
  
  return modified;
};

// Create Zustand store
const useStore = create((set, get) => ({
  // States
  buildingData: null,
  initialBuildingData: null,
  isLoading: true,
  error: null,
  
  // UI States
  viewMode: '3d', // '3d', 'top', 'front', 'side'
  enableOutlines: true,
  enableShadows: true,
  enableWireframe: false,
  selectedObjects: [],
  
  // Chat states
  messages: [],
  isLoadingChat: false,
  
  // Parameters
  availableParameters: [],
  availableSlides: [],
  
  // Initialize App
  initializeApp: () => {
    console.log("Initializing app with default building data");
    
    try {
      // Use default building data (no API call)
      const buildingData = defaultBuildingData;
      
      console.log("Building data:", buildingData);
      
      set({
        buildingData: buildingData,
        initialBuildingData: JSON.parse(JSON.stringify(buildingData)),
        isLoading: false,
        error: null,
        messages: [
          {
            role: 'assistant',
            content: 'Welcome to Archtalk! I can help you design and modify buildings. Try asking things like "make the roof taller" or "add a window".'
          }
        ]
      });
      
      // Extract parameters from building data
      get().extractParametersFromBuildingData(buildingData);
      
    } catch (error) {
      console.error("Error initializing app:", error);
      set({
        isLoading: false,
        error: "Failed to initialize app with building data."
      });
    }
  },
  
  // Set building data
  setBuildingData: (buildingData) => {
    console.log("Setting building data:", buildingData);
    set({ buildingData });
    
    // Extract parameters from new building data
    get().extractParametersFromBuildingData(buildingData);
  },
  
  // Reset building data
  resetBuildingData: () => {
    const { initialBuildingData } = get();
    
    if (initialBuildingData) {
      set({
        buildingData: JSON.parse(JSON.stringify(initialBuildingData))
      });
    } else {
      set({ buildingData: defaultBuildingData });
    }
  },
  
  // Extract parameters from building data
  extractParametersFromBuildingData: (buildingData) => {
    if (!buildingData || !buildingData.building) return;
    
    const building = buildingData.building;
    const parameters = [];
    
    // Extract roof parameters
    if (building.floors && building.floors.length > 0) {
      const firstFloor = building.floors[0];
      
      if (firstFloor.roof) {
        const roof = firstFloor.roof;
        
        if (roof.type) {
          parameters.push({
            key: 'roofType',
            label: 'Roof Type',
            value: roof.type,
            options: ['flat', 'gabled', 'pitched'],
            type: 'select'
          });
        }
        
        if (roof.height) {
          parameters.push({
            key: 'roofHeight',
            label: 'Roof Height (mm)',
            value: roof.height,
            min: 0,
            max: 5000,
            step: 100,
            type: 'slider'
          });
        }
        
        if (roof.pitch) {
          parameters.push({
            key: 'roofPitch',
            label: 'Roof Pitch (degrees)',
            value: roof.pitch,
            min: 0,
            max: 45,
            step: 1,
            type: 'slider'
          });
        }
        
        if (roof.material && roof.material.color) {
          parameters.push({
            key: 'roofColor',
            label: 'Roof Color',
            value: roof.material.color,
            type: 'color'
          });
        }
      }
      
      // Extract wall parameters
      if (firstFloor.rooms && firstFloor.rooms.length > 0) {
        const firstRoom = firstFloor.rooms[0];
        
        if (firstRoom.walls && firstRoom.walls.length > 0) {
          const firstWall = firstRoom.walls[0];
          
          if (firstWall.thickness) {
            parameters.push({
              key: 'wallThickness',
              label: 'Wall Thickness (mm)',
              value: firstWall.thickness,
              min: 50,
              max: 500,
              step: 10,
              type: 'slider'
            });
          }
          
          if (firstWall.material && firstWall.material.color) {
            parameters.push({
              key: 'wallColor',
              label: 'Wall Color',
              value: firstWall.material.color,
              type: 'color'
            });
          }
          
          // Find a wall with a window
          const wallWithWindow = firstRoom.walls.find(wall => wall.window);
          
          if (wallWithWindow && wallWithWindow.window) {
            const window = wallWithWindow.window;
            
            if (window.width) {
              parameters.push({
                key: 'windowWidth',
                label: 'Window Width (mm)',
                value: window.width,
                min: 500,
                max: 3000,
                step: 100,
                type: 'slider'
              });
            }
            
            if (window.height) {
              parameters.push({
                key: 'windowHeight',
                label: 'Window Height (mm)',
                value: window.height,
                min: 500,
                max: 2500,
                step: 100,
                type: 'slider'
              });
            }
            
            if (window.material && window.material.color) {
              parameters.push({
                key: 'windowColor',
                label: 'Window Color',
                value: window.material.color,
                type: 'color'
              });
            }
          }
          
          // Find a wall with a door
          const wallWithDoor = firstRoom.walls.find(wall => wall.door);
          
          if (wallWithDoor && wallWithDoor.door) {
            const door = wallWithDoor.door;
            
            if (door.width) {
              parameters.push({
                key: 'doorWidth',
                label: 'Door Width (mm)',
                value: door.width,
                min: 600,
                max: 1500,
                step: 50,
                type: 'slider'
              });
            }
            
            if (door.height) {
              parameters.push({
                key: 'doorHeight',
                label: 'Door Height (mm)',
                value: door.height,
                min: 1800,
                max: 2400,
                step: 50,
                type: 'slider'
              });
            }
            
            if (door.material && door.material.color) {
              parameters.push({
                key: 'doorColor',
                label: 'Door Color',
                value: door.material.color,
                type: 'color'
              });
            }
          }
        }
        
        // Extract room parameters
        if (firstFloor.height) {
          parameters.push({
            key: 'floorHeight',
            label: 'Floor Height (mm)',
            value: firstFloor.height,
            min: 2400,
            max: 5000,
            step: 100,
            type: 'slider'
          });
        }
      }
    }
    
    set({ availableParameters: parameters });
  },
  
  // Update parameter value
  updateParameterValue: (key, value) => {
    console.log(`Updating parameter: ${key} = ${value}`);
    
    // Clone building data to avoid direct state modification
    const buildingData = JSON.parse(JSON.stringify(get().buildingData));
    
    // Process the parameter update
    switch (key) {
      case 'roofType':
        buildingData.building.floors.forEach(floor => {
          if (floor.roof) {
            floor.roof.type = value;
            
            // Update roof pitch based on type
            if (value === 'flat') {
              floor.roof.pitch = 0;
            } else if (value === 'pitched' && floor.roof.pitch < 10) {
              floor.roof.pitch = 15;
            } else if (value === 'gabled' && floor.roof.pitch < 10) {
              floor.roof.pitch = 30;
            }
          }
        });
        break;
      
      case 'roofHeight':
        buildingData.building.floors.forEach(floor => {
          if (floor.roof) {
            floor.roof.height = value;
          }
        });
        break;
      
      case 'roofPitch':
        buildingData.building.floors.forEach(floor => {
          if (floor.roof) {
            floor.roof.pitch = value;
            
            // Update roof type if needed
            if (value === 0 && floor.roof.type !== 'flat') {
              floor.roof.type = 'flat';
            } else if (value > 0 && floor.roof.type === 'flat') {
              floor.roof.type = 'gabled';
            }
          }
        });
        break;
      
      case 'roofColor':
        buildingData.building.floors.forEach(floor => {
          if (floor.roof && floor.roof.material) {
            floor.roof.material.color = value;
          }
        });
        break;
      
      case 'wallThickness':
        buildingData.building.floors.forEach(floor => {
          floor.rooms.forEach(room => {
            room.walls.forEach(wall => {
              wall.thickness = value;
            });
          });
        });
        break;
      
      case 'wallColor':
        buildingData.building.floors.forEach(floor => {
          floor.rooms.forEach(room => {
            room.walls.forEach(wall => {
              if (wall.material) {
                wall.material.color = value;
              }
            });
          });
        });
        break;
      
      case 'windowWidth':
        buildingData.building.floors.forEach(floor => {
          floor.rooms.forEach(room => {
            room.walls.forEach(wall => {
              if (wall.window) {
                wall.window.width = value;
              }
            });
          });
        });
        break;
      
      case 'windowHeight':
        buildingData.building.floors.forEach(floor => {
          floor.rooms.forEach(room => {
            room.walls.forEach(wall => {
              if (wall.window) {
                wall.window.height = value;
              }
            });
          });
        });
        break;
      
      case 'windowColor':
        buildingData.building.floors.forEach(floor => {
          floor.rooms.forEach(room => {
            room.walls.forEach(wall => {
              if (wall.window && wall.window.material) {
                wall.window.material.color = value;
              }
            });
          });
        });
        break;
      
      case 'doorWidth':
        buildingData.building.floors.forEach(floor => {
          floor.rooms.forEach(room => {
            room.walls.forEach(wall => {
              if (wall.door) {
                wall.door.width = value;
              }
            });
          });
        });
        break;
      
      case 'doorHeight':
        buildingData.building.floors.forEach(floor => {
          floor.rooms.forEach(room => {
            room.walls.forEach(wall => {
              if (wall.door) {
                wall.door.height = value;
              }
            });
          });
        });
        break;
      
      case 'doorColor':
        buildingData.building.floors.forEach(floor => {
          floor.rooms.forEach(room => {
            room.walls.forEach(wall => {
              if (wall.door && wall.door.material) {
                wall.door.material.color = value;
              }
            });
          });
        });
        break;
      
      case 'floorHeight':
        buildingData.building.floors.forEach(floor => {
          floor.height = value;
        });
        break;
      
      default:
        console.warn(`Unknown parameter: ${key}`);
        return;
    }
    
    // Update building data
    set({ buildingData });
    
    // Update parameters
    get().extractParametersFromBuildingData(buildingData);
  },
  
  // Update available slides
  updateAvailableSlides: (slides) => {
    set({ availableSlides: slides.map(normalizeParameterData) });
  },
  
  // Set view mode
  setViewMode: (mode) => {
    set({ viewMode: mode });
  },
  
  // Toggle outlines
  toggleOutlines: () => {
    set(state => ({ enableOutlines: !state.enableOutlines }));
  },
  
  // Toggle shadows
  toggleShadows: () => {
    set(state => ({ enableShadows: !state.enableShadows }));
  },
  
  // Toggle wireframe
  toggleWireframe: () => {
    set(state => ({ enableWireframe: !state.enableWireframe }));
  },
  
  // Send message to chat (now static responses)
  sendMessage: (message) => {
    set(state => ({
      isLoadingChat: true,
      messages: [...state.messages, { role: 'user', content: message }]
    }));
    
    // Simulate a processing delay
    setTimeout(() => {
      // Get response based on user input
      const response = getResponseForInput(message);
      
      // Modify building data based on message
      const modifiedBuildingData = modifyBuildingData(get().buildingData, message);
      
      set(state => ({
        messages: [...state.messages, { role: 'assistant', content: response }],
        isLoadingChat: false,
        buildingData: modifiedBuildingData
      }));
      
      // Update parameters based on modified building data
      get().extractParametersFromBuildingData(modifiedBuildingData);
    }, 1500);
  }
}));

export default useStore; 