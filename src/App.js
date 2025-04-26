import React, { useEffect, useRef, useState, Component } from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';
import BuildingModel from './components/BuildingModel';
import SlideSelector from './components/SlideSelector';
import ParameterControls from './components/ParameterControls';
import useStore from './store';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import QRCode from './components/QRCode';

// error boundary component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('application error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>application error</h2>
          <p>{this.state.error && this.state.error.toString()}</p>
          <button onClick={() => window.location.reload()}>refresh page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Right Panel Component
const RightPanel = ({ isExpanded, togglePanel }) => {
  const { viewMode, setViewMode, enableOutlines, toggleOutlines } = useStore();
  
  return (
    <div className={`right-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="panel-toggle" onClick={togglePanel}>
        {isExpanded ? <HiChevronRight /> : <HiChevronLeft />}
      </div>
      <div className="panel-content">
        <button 
          className={`panel-btn ${viewMode === '3d' ? 'active' : ''}`}
          onClick={() => setViewMode('3d')}
        >
          3D View
        </button>
        <button 
          className={`panel-btn ${viewMode === 'top' ? 'active' : ''}`}
          onClick={() => setViewMode('top')}
        >
          Top View
        </button>
        <button 
          className={`panel-btn ${viewMode === 'front' ? 'active' : ''}`}
          onClick={() => setViewMode('front')}
        >
          Front View
        </button>
        <button 
          className={`panel-btn ${viewMode === 'side' ? 'active' : ''}`}
          onClick={() => setViewMode('side')}
        >
          Side View
        </button>
        <button 
          className={`panel-btn ${enableOutlines ? 'active' : ''}`}
          onClick={toggleOutlines}
        >
          {enableOutlines ? 'Hide Outlines' : 'Show Outlines'}
        </button>
      </div>
    </div>
  );
};

function App() {
  const { buildingData, isLoading, error, initializeApp, updateAvailableSlides } = useStore();
  const modelContainerRef = useRef(null);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [isMobile, setIsMobile] = useState(false);

  const togglePanel = () => {
    setPanelExpanded(!panelExpanded);
  };
  
  useEffect(() => {
    console.log('App component mounted, starting initialization...');
    initializeApp();
    
    // initialize availableSlides with static data
    updateAvailableSlides([
      {
        key: 'roofType',
        title: 'Roof Type',
        options: [
          { value: 'gabled', label: 'Gabled Roof' },
          { value: 'flat', label: 'Flat Roof' },
          { value: 'pitched', label: 'Pitched Roof' }
        ]
      },
      {
        key: 'wallColor',
        title: 'Wall Color',
        options: [
          { value: '#f5f5f5', label: 'White' },
          { value: '#cccccc', label: 'Gray' },
          { value: '#8b4513', label: 'Brown' }
        ]
      },
      {
        key: 'windowColor',
        title: 'Window Color',
        options: [
          { value: '#88ccff', label: 'Light Blue' },
          { value: '#ffffff', label: 'White' },
          { value: '#cccccc', label: 'Gray' }
        ]
      }
    ]);
    
    // Detect if we're on a mobile device and set appropriate defaults
    const detectMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 844;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    detectMobile();
    window.addEventListener('resize', detectMobile);
    
    if (isMobile) {
      // Set any mobile-specific defaults
      setPanelExpanded(false);
    }
    
    return () => window.removeEventListener('resize', detectMobile);
  }, [initializeApp, updateAvailableSlides]);

  // show loading status
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  // show error message
  if (error) {
    return (
      <div className="error">
        <h2>loading error</h2>
        <p>{error}</p>
        <button onClick={initializeApp}>retry</button>
      </div>
    );
  }

  // check if building data exists
  if (!buildingData || !buildingData.building) {
    return (
      <div className="error">
        <h2>data error</h2>
        <p>building data is invalid or empty</p>
        <button onClick={initializeApp}>retry</button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="main-container">
        <div className="canvas-container">
          <BuildingModel buildingData={buildingData} />
          <RightPanel isExpanded={panelExpanded} togglePanel={togglePanel} />
        </div>
        <div className="controls-container">
          <div className="controls-tabs">
            <div 
              className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </div>
            <div 
              className={`tab ${activeTab === 'controls' ? 'active' : ''}`}
              onClick={() => setActiveTab('controls')}
            >
              Controls
            </div>
          </div>
          <div className="controls-content">
            {activeTab === 'chat' ? (
              <ChatInterface />
            ) : (
              <div className="parameter-section">
                <ParameterControls />
                <SlideSelector />
              </div>
            )}
          </div>
        </div>
        
        {/* Show QR code only on desktop */}
        {!isMobile && <QRCode />}
      </div>
    </ErrorBoundary>
  );
}

export default App; 