# Archtalk System Architecture

## 1. Overview

Archtalk is an architectural visualization and design platform that integrates 3D modeling, real-time editing, and natural language interaction to enable users to create and modify building designs. The system connects a React-based frontend with a Node.js backend that leverages the OpenAI API for natural language processing and understanding of architectural concepts.

## 2. System Components

### 2.1 Frontend Architecture

The frontend is built with React and Three.js and follows a component-based architecture with state management through Zustand.

#### Core Components:

- **App**: Main application container that coordinates all components
- **BuildingModel**: 3D visualization engine built with Three.js
- **LeftPanel**: Control panel for view modes, object manipulation, and visualization options
- **ChatInterface**: Natural language interaction with the AI assistant
- **ParameterControls**: UI controls for adjusting building parameters
- **SlideSelector**: Provides options for various building elements
- **ObjectTransformer**: Handles selection and transformation of 3D objects
- **ClippingPlane**: Creates section views of the building model
- **ViewCube**: Navigation aid for 3D view orientation

#### State Management:

- **Zustand Store**: Central state management for application data
  - Building data structure
  - UI state and controls
  - Chat message history
  - Parameter settings

### 2.2 Backend Architecture

The backend server is built with Node.js and Express, providing API endpoints for the frontend.

#### Key Components:

- **Express Server**: Handles HTTP requests and manages API routes
- **OpenAI Integration**: Processes natural language requests and generates building modifications
- **JSON Model Processor**: Transforms building descriptions into renderable 3D models

### 2.3 Data Flow

1. User interacts with the UI or sends text through the chat interface
2. Frontend components update the Zustand store or send requests to the backend
3. For chat requests, the backend processes the message using OpenAI API
4. Backend returns building data modifications to the frontend
5. Frontend updates the 3D model and UI based on the new data

## 3. Key Technologies

- **Frontend**:
  - React (UI framework)
  - Three.js (3D rendering)
  - Zustand (State management)
  - CSS3 (Styling)

- **Backend**:
  - Node.js (Runtime)
  - Express (Web framework)
  - OpenAI API (Natural language processing)

- **Data Format**:
  - JSON (Building data structure)

## 4. Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND                              │
│                                                             │
│  ┌─────────────┐      ┌───────────────┐    ┌────────────┐  │
│  │   LeftPanel │      │ BuildingModel │    │ ChatInterface│ │
│  │ - ViewCube  │      │ - 3D Renderer │    │ - Messages  │ │
│  │ - Controls  │      │ - Object      │    │ - User Input│ │
│  └─────┬───────┘      │   Management  │    └──────┬─────┘  │
│        │              └───────┬───────┘           │        │
│        │                      │                   │        │
│        │                      ▼                   │        │
│        │              ┌───────────────┐           │        │
│        └──────────────►   Zustand     ◄───────────┘        │
│                       │  Store State  │                    │
│                       └───────┬───────┘                    │
│                               │                            │
└───────────────────────────────┼────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────┐
│                        BACKEND                            │
│                                                           │
│  ┌─────────────┐       ┌──────────────┐                   │
│  │ Express     │       │  OpenAI API  │                   │
│  │ API Server  ├───────►  Integration │                   │
│  └─────────────┘       └──────────────┘                   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## 5. Building Data Structure

The building model uses a hierarchical JSON structure to represent architectural elements:

```
building
  ├── name
  ├── floors[]
  │     ├── name
  │     ├── level
  │     ├── height
  │     ├── material
  │     └── rooms[]
  │           ├── name
  │           ├── footprint[]
  │           └── walls[]
  │                 ├── start[]
  │                 ├── end[]
  │                 ├── thickness
  │                 ├── window{}
  │                 └── door{}
  └── roof
        ├── type
        ├── height
        ├── pitch
        └── material
```

## 6. Communication Mechanisms

### 6.1 Component Communication

- **Event-Based**: Components communicate through custom events (e.g., toggleOutlines, changeViewMode)
- **State-Based**: Components react to changes in the Zustand store
- **Ref-Based**: Direct references to Three.js objects for specialized interactions

### 6.2 Frontend-Backend Communication

- **REST API**: HTTP requests for building data retrieval and updates
- **Chat API**: Natural language processing through OpenAI integration

## 7. Rendering Pipeline

1. **JSON Parsing**: Convert building data to 3D objects
2. **Geometry Creation**: Generate meshes for walls, floors, roofs, etc.
3. **Material Assignment**: Apply colors, textures, and transparency
4. **Scene Composition**: Organize objects in 3D space
5. **Lighting Setup**: Add ambient and directional lights
6. **Camera Configuration**: Set perspective or orthographic views
7. **Rendering Loop**: Continuously update and render the scene

## 8. User Interaction Patterns

- **Direct Manipulation**: Select and transform objects using ObjectTransformer
- **Control Panel**: Toggle view modes and visualization options via LeftPanel
- **Natural Language**: Modify building design through conversation with ChatInterface
- **Parameter Adjustment**: Fine-tune building properties with sliders and controls

## 9. Extensibility

The architecture is designed for extensibility through:

- **Component Modularity**: New UI controls can be added without modifying existing ones
- **Rendering Abstractions**: The BuildingModel component can render different architectural elements
- **Event System**: Custom events allow for loose coupling between components
- **JSON Schema**: The building data structure can be extended with new properties

## 10. Future Enhancements

- **Real-time Collaboration**: Multiple users working on the same model
- **VR/AR Support**: Immersive architectural visualization
- **Building Code Compliance**: Automated checking against regulations
- **Expanded AI Features**: More sophisticated design suggestions and optimizations
- **Performance Optimization**: Improved rendering for complex buildings 