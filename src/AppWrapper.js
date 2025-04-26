import React, { useState } from 'react';
import App from './App';
import PrePage from './components/PrePage';
import { updateOpenAIInstance } from './services/openaiInstance';

const AppWrapper = () => {
  const [showApp, setShowApp] = useState(false);
  
  // Removed the useEffect that checks localStorage
  // This ensures the PrePage is always shown first

  const handleApiKeySubmit = (key) => {
    try {
      // Update the OpenAI instance with the new API key
      updateOpenAIInstance(key);
      
      // Show the main app
      setShowApp(true);
    } catch (error) {
      console.error('Error setting API key:', error);
      alert('Failed to set API key. Please try again.');
    }
  };

  return (
    <>
      {!showApp && <PrePage onApiKeySubmit={handleApiKeySubmit} />}
      {showApp && <App />}
    </>
  );
};

export default AppWrapper; 