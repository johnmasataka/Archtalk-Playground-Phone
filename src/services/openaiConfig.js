// File to manage OpenAI API key configuration
let openaiApiKey = 'placeholder';

// Check if there's a stored key in localStorage
try {
  const storedKey = localStorage.getItem('openai_api_key');
  if (storedKey) {
    openaiApiKey = storedKey;
  }
} catch (e) {
  console.error('Error accessing localStorage:', e);
}

export const getOpenAIApiKey = () => {
  return openaiApiKey;
};

export const setOpenAIApiKey = (newKey) => {
  openaiApiKey = newKey;
  try {
    localStorage.setItem('openai_api_key', newKey);
  } catch (e) {
    console.error('Error storing API key in localStorage:', e);
  }
  return openaiApiKey;
}; 