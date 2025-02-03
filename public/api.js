const API_KEYS = ['API_K1', 'API_K2', ..., 'API_K10'];
let currentKeyIndex = 0;

// Chọn API key luân phiên
function getNextApiKey() {
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
}

// Gửi yêu cầu API
async function makeApiRequest(apiUrl, requestBody) {
    const apiKey = getNextApiKey();
    try {
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        return response.ok ? await response.json() : null;
    } catch (error) {
        console.error('❌ Lỗi API:', error);
        return null;
    }
}

// Gọi AI chấm bài
async function gradeWithGemini(base64Image, problemText, studentId) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent';
    const promptText = `Học sinh: ${studentId}\nĐề bài:\n${problemText}\nChấm điểm bài làm từ ảnh:\n${base64Image}`;
    
    return await makeApiRequest(apiUrl, { contents: [{ parts: [{ text: promptText }] }] });
}
