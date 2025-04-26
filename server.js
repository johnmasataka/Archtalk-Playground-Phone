const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 定义系统提示
const systemPrompt = `You are a building design assistant. Your task is to help users modify building designs by updating the building data according to their requirements.

When responding to user requests:
1. Maintain proper relationships between building elements
2. Keep consistent dimensions and proportions
3. Add appropriate walls and openings for each room
4. Consider room types and their functions
5. Return the complete updated JSON data

When modifying the total area:
1. The target area is specified in square meters (m²)
2. Calculate the current total area of all rooms in square meters
3. Calculate the scaling factor needed to achieve the target area
4. Apply the scaling factor to all room dimensions while maintaining their relative proportions
5. Update the building's overall dimensions accordingly
6. Ensure all walls and openings are scaled proportionally
7. IMPORTANT: The target area is in square meters, do not divide by 10 or 100

When modifying the room count:
1. If increasing the room count:
   - Add new rooms adjacent to existing rooms (sharing walls)
   - Ensure new rooms have proper walls, windows, and doors
   - Maintain consistent room heights and materials
   - Adjust the total area proportionally
   - IMPORTANT: New rooms must share at least one wall with existing rooms
2. If decreasing the room count:
   - Remove rooms while maintaining the building's structural integrity
   - Adjust remaining rooms to fill the space
   - Update walls and openings accordingly
3. Always ensure:
   - Each room has a unique name
   - Rooms are properly connected and adjacent
   - Walls have appropriate thickness and materials
   - Windows and doors are placed logically
   - No isolated rooms (all rooms must be connected)

If you receive a request to modify the total area:
1. Extract the target area from the request (in square meters)
2. Calculate the current total area (in square meters)
3. Calculate the scaling factor = target_area / current_area
4. Apply the scaling factor to all dimensions
5. Return the updated building data

If you want to show UI controls to the user, include them in your response using the format: [UI:type:params]
Example: [UI:slider:{"min":1000,"max":5000,"step":100,"label":"Total Area (ft²)"}]

Always respond with valid JSON data that can be parsed by the application.`;

const app = express();
app.use(cors());
app.use(express.json());

// 检查环境变量
console.log('Checking environment variables...');
if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is not set in .env file');
    process.exit(1);
}
console.log('✅ OPENAI_API_KEY is set');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// 读取初始 IFC 文件
let initialTemplate;
try {
    initialTemplate = fs.readFileSync(path.join(__dirname, 'public', 'hs.json'), 'utf8');
    console.log('✅ Successfully loaded hs.json');
} catch (error) {
    console.error('❌ Error loading hs.json:', error);
    process.exit(1);
}

// 存储当前的建筑数据
let currentBuildingData = initialTemplate;

// 添加时间戳函数
const getTimestamp = () => {
    return new Date().toLocaleTimeString();
};

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        console.log('📝 Received chat message:', message);
        console.log('🏗️ Current building data:', currentBuildingData);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: `Current building data: ${currentBuildingData}\n\nUser message: ${message}`
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        console.log('🤖 Raw API response:', JSON.stringify(completion, null, 2));
        
        const response = completion.choices[0].message.content;
        console.log('📤 Raw response content:', response);

        try {
            // 尝试直接解析响应
            const parsedResponse = JSON.parse(response);
            console.log('✅ Successfully parsed response as JSON');
            currentBuildingData = parsedResponse;
            res.json(parsedResponse);
        } catch (parseError) {
            console.log('⚠️ Failed to parse response as JSON, attempting to extract and fix JSON from text');
            
            // 尝试从文本中提取 JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    // 记录提取的 JSON 字符串
                    console.log('📝 Extracted JSON string:', jsonMatch[0]);
                    
                    // 尝试清理和修复 JSON 字符串
                    let cleanedJson = jsonMatch[0]
                        .replace(/\n/g, '')  // 移除换行符
                        .replace(/\r/g, '')  // 移除回车符
                        .replace(/\t/g, '')  // 移除制表符
                        .replace(/,(\s*[}\]])/g, '$1')  // 移除数组或对象末尾的逗号
                        .replace(/\s+/g, ' ')  // 将多个空格替换为单个空格
                        .replace(/\s*([{}[\],:])\s*/g, '$1');  // 移除属性名和值周围的空格
                    
                    // 尝试修复未闭合的数组和对象
                    let openBrackets = 0;
                    let openBraces = 0;
                    let fixedJson = '';
                    
                    for (let i = 0; i < cleanedJson.length; i++) {
                        const char = cleanedJson[i];
                        fixedJson += char;
                        
                        if (char === '[') openBrackets++;
                        if (char === ']') openBrackets--;
                        if (char === '{') openBraces++;
                        if (char === '}') openBraces--;
                        
                        // 如果到达字符串末尾，添加缺失的闭合括号
                        if (i === cleanedJson.length - 1) {
                            while (openBrackets > 0) {
                                fixedJson += ']';
                                openBrackets--;
                            }
                            while (openBraces > 0) {
                                fixedJson += '}';
                                openBraces--;
                            }
                        }
                    }
                    
                    console.log('🧹 Cleaned and fixed JSON string:', fixedJson);
                    
                    const extractedJson = JSON.parse(fixedJson);
                    console.log('✅ Successfully parsed fixed JSON');
                    currentBuildingData = extractedJson;
                    res.json(extractedJson);
                } catch (extractError) {
                    console.error('❌ Error parsing extracted JSON:', extractError);
                    console.error('❌ Error position:', extractError.position);
                    console.error('❌ Error line:', extractError.lineNumber);
                    console.error('❌ Error column:', extractError.columnNumber);
                    throw extractError;
                }
            } else {
                console.error('❌ No JSON found in response text');
                throw new Error('No valid JSON found in response');
            }
        }
    } catch (error) {
        console.error('❌ Error in /api/chat:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: error.message,
            details: {
                position: error.position,
                line: error.lineNumber,
                column: error.columnNumber
            }
        });
    }
});

// 获取当前建筑数据的端点
app.get('/api/building-data', (req, res) => {
    res.json(currentBuildingData);
});

// 重置建筑数据的端点
app.post('/api/reset-building', (req, res) => {
    currentBuildingData = initialTemplate;
    res.json(currentBuildingData);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('📝 Waiting for ChatGPT API calls...\n');
}); 