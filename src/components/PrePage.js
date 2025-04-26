import React, { useState } from 'react';
import './PrePage.css';
import { updateOpenAIInstance } from '../services/openaiInstance';
import { setOpenAIApiKey } from '../services/openaiConfig';

const PrePage = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateApiKey = (key) => {
    if (!key || key.trim() === '') {
      return {valid: false, message: 'Please enter your key'};
    }
    
    // 基本格式检查
    if (!key.startsWith('sk-')) {
      return {valid: false, message: 'API key should start with "sk-"'};
    }
    
    return {valid: true};
  };

  const handleSubmit = () => {
    // 验证API密钥
    const validation = validateApiKey(apiKey);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Submitting API key:', apiKey.substring(0, 3) + '...');
      
      // 检测是否为项目级API密钥
      const isProjectKey = apiKey.startsWith('sk-proj-');
      if (isProjectKey) {
        console.log('检测到项目级API密钥');
      }
      
      // Update the API key in our configuration
      setOpenAIApiKey(apiKey);
      
      // Update the OpenAI instance with the new API key
      const instance = updateOpenAIInstance(apiKey);
      console.log('OpenAI instance updated with new API key:', instance.apiKey.substring(0, 3) + '...');
      
      setError('');
      setIsLoading(false);
      onApiKeySubmit(apiKey);
    } catch (error) {
      setError('Failed to set API key: ' + error.message);
      console.error('API key update error:', error);
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="pre-page">
      <div className="pre-page-container">
        <div className="pre-page-header">
          Please enter your OpenAI API Key to access the playground.
        </div>
        
        <div className="pre-page-input-section">
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="sk-..."
            className="pre-page-input"
            disabled={isLoading}
          />
          <button 
            className="pre-page-button" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'GO'}
          </button>
        </div>
        {error && <div className="pre-page-error">{error}</div>}
        
        <div className="pre-page-warning">
          Note that this isn't best practice to enter an API key into a web app like this.
          While it isn't stored outside of your browser, a malicious script or browser
          extension could still access it. Ensure your account has strict limits on API
          spend and change this API key often.
        </div>
        
        <div className="pre-page-info">
          This application supports both regular API keys (sk-...) and project API keys (sk-proj-...).
        </div>
        
        <div className="pre-page-help">
          <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="pre-page-link">How to get OpenAI API Key?</a>
        </div>
      </div>
    </div>
  );
};

export default PrePage; 