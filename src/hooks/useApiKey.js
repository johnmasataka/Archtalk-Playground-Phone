import { useState, useCallback } from 'react';
import OpenAI from 'openai';

// Custom hook to handle API key management
const useApiKey = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [openaiInstance, setOpenaiInstance] = useState(null);

  // Set up the OpenAI instance with the provided API key
  const updateApiKey = useCallback((newKey) => {
    // Create a new OpenAI instance with the updated API key
    const openai = new OpenAI({
      apiKey: newKey,
      dangerouslyAllowBrowser: true
    });
    
    // Update the hook state
    setApiKey(newKey);
    setOpenaiInstance(openai);
    
    // Store in localStorage for persistence
    localStorage.setItem('openai_api_key', newKey);
    
    // Return the OpenAI instance for immediate use
    return openai;
  }, []);

  return { apiKey, openaiInstance, updateApiKey };
};

export default useApiKey; 