import OpenAI from 'openai';
import { getOpenAIApiKey, setOpenAIApiKey } from './openaiConfig';

// Create a class to manage the OpenAI instance
class OpenAIManager {
  constructor() {
    this.instance = null;
    this.initialize();
  }

  initialize() {
    const apiKey = getOpenAIApiKey();
    console.log('Initializing OpenAI instance with key:', apiKey.substring(0, 3) + '...');
    
    // 配置OpenAI实例，支持项目级API密钥
    const config = {
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    };
    
    // 如果是项目级API密钥（以sk-proj-开头），添加organization字段
    if (apiKey.startsWith('sk-proj-')) {
      console.log('使用项目级API密钥，添加organization配置');
      config.organization = 'org-pbBvZQZpcXzEEfQtXlZnEb8Z'; // 使用通用组织ID
    }
    
    this.instance = new OpenAI(config);
    
    return this.instance;
  }

  getInstance() {
    if (!this.instance) {
      this.initialize();
    }
    return this.instance;
  }

  updateApiKey(newKey) {
    console.log('Updating OpenAI API key to:', newKey.substring(0, 3) + '...');
    
    // Update the stored API key
    setOpenAIApiKey(newKey);
    
    // 配置OpenAI实例，支持项目级API密钥
    const config = {
      apiKey: newKey,
      dangerouslyAllowBrowser: true
    };
    
    // 如果是项目级API密钥（以sk-proj-开头），添加organization字段
    if (newKey.startsWith('sk-proj-')) {
      console.log('使用项目级API密钥，添加organization配置');
      config.organization = 'org-pbBvZQZpcXzEEfQtXlZnEb8Z'; // 使用通用组织ID
    }
    
    // Create a new instance with the updated key
    this.instance = new OpenAI(config);
    
    return this.instance;
  }
}

// Create a singleton instance
const openAIManager = new OpenAIManager();

// Function to update the OpenAI instance with a new API key
export const updateOpenAIInstance = (apiKey) => {
  return openAIManager.updateApiKey(apiKey);
};

// Export the getter function for the instance
export const getOpenAIInstance = () => {
  return openAIManager.getInstance();
};

// For backwards compatibility, also export the instance directly
export default openAIManager.getInstance(); 