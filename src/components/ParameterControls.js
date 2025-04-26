import React, { useEffect, useState, useRef } from 'react';
import useStore from '../store';
import './ParameterControls.css';

function ParameterControls() {
  const { 
    buildingData, 
    handleParameterChange,
    currentParameterIndex,
    nextParameter,
    setNextParameter,
    completeParameterAdjustment,
    parameterHistory,
    sendToGPT
  } = useStore();
  
  // Track slider value and dragging state separately
  const [sliderValue, setSliderValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [controlValue, setControlValue] = useState(0);
  const sliderRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const welcomeMessageSent = useRef(false);

  // Initialize the first parameter
  useEffect(() => {
    if (!nextParameter) {
      setNextParameter(true);
    }
  }, [nextParameter, setNextParameter]);
  
  // Update slider value when nextParameter changes
  useEffect(() => {
    if (nextParameter) {
      setSliderValue(nextParameter.value);
      setControlValue(nextParameter.value);
    }
  }, [nextParameter]);

  // Send welcome message to conversation area
  useEffect(() => {
    if (!welcomeMessageSent.current && nextParameter) {
      welcomeMessageSent.current = true;
      // 发送欢迎消息
      sendToGPT("Let's start designing the building!").then(() => {
        // 在欢迎消息后添加参数解释信息
        if (nextParameter) {
          // 直接使用来自GPT的消息，不再使用硬编码的介绍文字
          const store = useStore.getState();
          
          // 检查是否已经有GPT生成的消息
          const lastMessage = store.messages[store.messages.length - 1];
          if (!lastMessage || lastMessage.role !== 'assistant' || lastMessage.content === "Let's start designing the building!") {
            // 构建参数介绍消息
            let explanationMessage = "";
            
            // 优先使用GPT生成的描述
            if (nextParameter.description && nextParameter.description.trim() !== '') {
              explanationMessage = nextParameter.description;
            } else {
              // 备用方案：构建基本介绍
              explanationMessage = `现在您可以调整${nextParameter.label || nextParameter.key}参数。`;
              
              // 添加一些基本信息
              if (nextParameter.min !== undefined && nextParameter.max !== undefined) {
                explanationMessage += ` 可调范围为${nextParameter.min}到${nextParameter.max}。`;
              }
              
              explanationMessage += " 这个参数会影响建筑的外观和功能。";
            }
            
            // 添加消息
            store.messages.push({ 
              role: 'assistant', 
              content: explanationMessage
            });
            
            // 触发状态更新
            useStore.setState({ messages: [...store.messages] });
          }
        }
      });
    }
  }, [nextParameter, sendToGPT]);

  // Handle slider change during drag (visual only)
  const handleSliderChange = (e) => {
    const value = parseFloat(e.target.value);
    setSliderValue(value);
  };
  
  // Handle other control changes (non-slider)
  const handleControlChange = (e) => {
    const value = e.target.type === 'range' ? parseFloat(e.target.value) : e.target.value;
    setControlValue(value);
    
    // For non-slider inputs, update immediately
    if (e.target.type !== 'range') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        if (nextParameter) {
          handleChange(nextParameter.key, value);
        }
      }, 300);
    }
  };
  
  // Handle slider mouse down
  const handleSliderMouseDown = () => {
    setIsDragging(true);
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };
  
  // Handle slider mouse up - only now do we send the value
  const handleSliderMouseUp = () => {
    setIsDragging(false);
    
    // Send the final value after dragging stops
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (nextParameter) {
        setControlValue(sliderValue);
        handleChange(nextParameter.key, sliderValue);
      }
    }, 300);
  };

  // Handle touch events for mobile devices
  const handleTouchStart = () => {
    handleSliderMouseDown();
  };

  const handleTouchEnd = () => {
    handleSliderMouseUp();
  };

  // Handle parameter changes
  const handleChange = (param, value) => {
    // Construct user message
    let userMessage = '';
    const element = nextParameter?.element || '';
    const elementIndex = nextParameter?.elementIndex;
    
    switch (param) {
      case 'height':
        userMessage = `Change building height to ${value} millimeters`;
        break;
      case 'floorCount':
        userMessage = `Change floor count to ${value}`;
        break;
      case 'roomCount':
        userMessage = `Change room count to ${value}`;
        break;
      case 'totalArea':
        userMessage = `Change total building area to ${value} square meters`;
        break;
      case 'roofHeight':
        userMessage = `Change roof height to ${value} millimeters`;
        break;
      case 'roofPitch':
        userMessage = `Change roof pitch to ${value} degrees`;
        break;
      case 'roofOverhang':
        userMessage = `Change roof overhang to ${value} millimeters`;
        break;
      case 'wallThickness':
        userMessage = `Change wall thickness to ${value} millimeters`;
        break;
      case 'roofType':
        const roofTypeLabels = {
          'gabled': 'Gabled Roof',
          'flat': 'Flat Roof',
          'pitched': 'Pitched Roof'
        };
        userMessage = `Change roof type to ${roofTypeLabels[value] || value}`;
        break;
      case 'material.color':
      case 'color':
        // Build different messages based on element type
        if (element === 'roof') {
          userMessage = `Change roof color to ${value}`;
        } else if (element === 'wall') {
          const specificWall = elementIndex !== undefined ? `wall #${elementIndex + 1}` : '';
          userMessage = `Change ${specificWall} color to ${value}`;
        } else if (element === 'window') {
          const specificWindow = elementIndex !== undefined ? `window #${elementIndex + 1}` : '';
          userMessage = `Change ${specificWindow} color to ${value}`;
        } else if (element === 'door') {
          const specificDoor = elementIndex !== undefined ? `door #${elementIndex + 1}` : '';
          userMessage = `Change ${specificDoor} color to ${value}`;
        } else if (element === 'floor') {
          const specificFloor = elementIndex !== undefined ? `floor #${elementIndex + 1}` : '';
          userMessage = `Change ${specificFloor} color to ${value}`;
        } else {
          userMessage = `Change color to ${value}`;
        }
        break;
      case 'wallMaterial':
      case 'wallColor':
        userMessage = `Change wall color to ${value}`;
        break;
      case 'windowMaterial':
      case 'windowColor':
        userMessage = `Change window color to ${value}`;
        break;
      case 'doorMaterial':
      case 'doorColor':
        userMessage = `Change door color to ${value}`;
        break;
      default:
        userMessage = `Change ${param} to ${value}`;
    }
    
    // Send to GPT
    handleParameterChange(param, value, userMessage);
    
    // Complete current parameter adjustment
    completeParameterAdjustment(param, element);
  };

  // Generate tick marks for the slider
  const generateTicks = () => {
    if (!nextParameter) return null;
    
    const { min, max, step = 1 } = nextParameter;
    // Calculate appropriate number of ticks based on range
    const range = max - min;
    const maxTicks = 10; // Maximum number of ticks to show
    
    // Calculate optimal number of ticks
    let tickCount;
    if (step > 1) {
      // For larger steps, try to use step value to determine tick count
      tickCount = Math.min(maxTicks, Math.floor(range / step) + 1);
      // If too many ticks, adjust
      if (tickCount > maxTicks) {
        const stepMultiplier = Math.ceil(tickCount / maxTicks);
        tickCount = Math.floor(range / (step * stepMultiplier)) + 1;
      }
    } else {
      // For small steps, use a reasonable number of ticks
      tickCount = Math.min(maxTicks, Math.max(2, Math.ceil(range / 10) + 1));
    }
    
    const ticks = [];
    
    // Create equally spaced ticks
    for (let i = 0; i < tickCount; i++) {
      // Calculate evenly distributed values
      const value = min + (i * (range / (tickCount - 1)));
      
      // Round to appropriate step precision
      const roundedValue = Math.round(value / step) * step;
      
      // Format display value (for large numbers add commas)
      const displayValue = roundedValue >= 1000 ? 
        roundedValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 
        roundedValue;
      
      ticks.push(
        <div 
          key={i} 
          className="tick" 
          style={{ 
            left: `${(i / (tickCount - 1)) * 100}%`,
            position: 'absolute',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="tick-mark"></div>
          <div className="tick-label">{displayValue}</div>
        </div>
      );
    }
    
    return ticks;
  };

  // Render different controls based on parameter type
  const renderControl = () => {
    if (!nextParameter) return null;
    
    const { key, type = 'slider', min, max, step = 1, options = [], element } = nextParameter;
    
    // Check if parameter is color-related
    const isColorParam = key.toLowerCase().includes('color') || 
                         key.toLowerCase().includes('material');
    
    // For color parameters, use color picker
    if (isColorParam) {
      // 根据元素类型添加更具体的标签
      let colorLabel = "Color";
      if (element === 'roof') colorLabel = "Roof Color";
      else if (element === 'wall') colorLabel = "Wall Color";
      else if (element === 'window') colorLabel = "Window Color"; 
      else if (element === 'door') colorLabel = "Door Color";
      else if (element === 'floor') colorLabel = "Floor Color";
      
      return (
        <div className="color-picker-container">
          <div className="color-element-label">{colorLabel}</div>
          <input
            type="color"
            id={key}
            value={controlValue}
            onChange={handleControlChange}
            onBlur={() => handleChange(key, controlValue)}
            className="color-picker"
          />
          <div className="color-value">{controlValue}</div>
        </div>
      );
    }
    
    switch (type) {
      case 'select':
        return (
          <select
            id={key}
            value={controlValue}
            onChange={handleControlChange}
            className="select-control"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'numberInput':
        return (
          <input
            type="number"
            id={key}
            min={min}
            max={max}
            step={step}
            value={controlValue}
            onChange={handleControlChange}
            className="number-input"
          />
        );
      
      case 'slider':
      default:
        return (
          <div className="slider-container">
            <input
              ref={sliderRef}
              type="range"
              id={key}
              min={min}
              max={max}
              step={step}
              value={sliderValue}
              onChange={handleSliderChange}
              onMouseDown={handleSliderMouseDown}
              onMouseUp={handleSliderMouseUp}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={`slider-control ${isDragging ? 'slider-dragging' : ''}`}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={sliderValue}
            />
            <div className="slider-value">
              {sliderValue >= 1000 ? 
                sliderValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 
                sliderValue}
            </div>
            <div className="ticks-container">
              {generateTicks()}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="parameter-controls">
      <h2>Building Parameter Controls</h2>
      
      {nextParameter ? (
        <div className="parameter-group">
          <div className="parameter">
            <label htmlFor={nextParameter.key}>
              {nextParameter.label}
              {nextParameter.unit && <span className="unit">({nextParameter.unit})</span>}
            </label>
            {renderControl()}
            <p className="parameter-description">{nextParameter.description}</p>
          </div>
        </div>
      ) : (
        <div className="parameter-loading">
          <p>Loading parameters...</p>
        </div>
      )}
      
      {parameterHistory.length > 0 && (
        <div className="parameter-history">
          <h3>Adjusted Parameters</h3>
          <ul>
            {parameterHistory.map((param, index) => (
              <li key={index}>{param}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ParameterControls; 