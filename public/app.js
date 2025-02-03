// =====================
// 1️⃣ CẤU HÌNH API & BIẾN TOÀN CỤC
// =====================

const API_KEYS = [
    'API_KEY_1', 'API_KEY_2', 'API_KEY_3', 'API_KEY_4', 'API_KEY_5',
    'API_KEY_6', 'API_KEY_7', 'API_KEY_8', 'API_KEY_9', 'API_KEY_10'
];

const GITHUB_PROGRESS_URL = 'https://raw.githubusercontent.com/YourRepo/main/progress.json';
const GITHUB_SAVE_PROGRESS_URL = '/api/save-progress';

let currentKeyIndex = 0;
let problems = [];
let currentProblem = null;
let progressData = {};
let base64Image = '';
let currentStudentId = null;
let studentName = '';
let completedProblems = 0;
let totalScore = 0;

// =====================
// 2️⃣ HÀM GỌI API
// =====================

function getNextApiKey() {
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
}

// Gửi yêu cầu API Gemini AI
async function makeApiRequest(apiUrl, requestBody) {
    let attempts = 0;
    while (attempts < API_KEYS.length) {
        const apiKey = getNextApiKey();
        try {
            const response = await fetch(`${apiUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                return await response.json();
            } else if (response.status === 403) {
                console.log(`API key expired: ${apiKey}`);
                attempts++;
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('API error:', error);
            attempts++;
        }
    }
    throw new Error('All API keys exhausted.');
}

// =====================
// 3️⃣ HÀM XỬ LÝ BÀI TẬP
// =====================

// Tải danh sách bài tập từ JSON
async function fetchProblems() {
    try {
        const response = await fetch(GITHUB_PROGRESS_URL);
        if (!response.ok) throw new Error('Failed to fetch problems.');

        const data = await response.json();
        problems = data.problems || [];
        console.log('📚 Danh sách bài tập đã tải:', problems);
    } catch (error) {
        console.error('Lỗi tải bài tập:', error);
    }
}

// Hiển thị bài tập
function displayProblemByIndex(index) {
    const problem = problems.find(p => parseInt(p.index) === index);
    if (problem) {
        document.getElementById('problemText').innerHTML = problem.problem;
        MathJax.typesetPromise([document.getElementById('problemText')]);
    } else {
        document.getElementById('problemText').textContent = 'Không tìm thấy bài tập.';
    }
}

// Chấm bài với AI
async function gradeWithGemini(base64Image, problemText, studentId) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent';
    const requestBody = {
        contents: [
            { parts: [{ text: problemText }, { inline_data: { mime_type: "image/jpeg", data: base64Image } }] }
        ]
    };

    try {
        const data = await makeApiRequest(apiUrl, requestBody);
        const response = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return {
            studentAnswer: response.match(/Bài làm của học sinh: ([\s\S]*?)(?=\nLời giải chi tiết:)/)?.[1]?.trim() || '',
            feedback: response.replace(/Bài làm của học sinh: [\s\S]*?\n/, ''),
            score: parseFloat(response.match(/Điểm số: (\d+(\.\d+)?)/)?.[1] || '0')
        };
    } catch (error) {
        console.error('Lỗi:', error);
        return { studentAnswer: '', feedback: `Lỗi: ${error.message}`, score: 0 };
    }
}

// =====================
// 4️⃣ XỬ LÝ DANH SÁCH BÀI TẬP & MÀU SẮC
// =====================

async function displayProblemList() {
    const problemContainer = document.getElementById('problemList');
    problemContainer.innerHTML = '';

    problems.forEach(problem => {
        const problemBox = document.createElement('div');
        problemBox.textContent = problem.index;
        problemBox.className = 'problem-box';

        problemBox.style.backgroundColor = progressData[currentStudentId]?.[problem.index] ? 'green' : 'yellow';

        problemBox.addEventListener("click", () => {
            if (progressData[currentStudentId]?.[problem.index]) {
                alert("📌 Bài tập này đã làm!");
                return;
            }
            displayProblemByIndex(problem.index);
            problemBox.style.backgroundColor = 'blue';
        });

        problemContainer.appendChild(problemBox);
    });
}

// =====================
// 5️⃣ CẬP NHẬT TIẾN TRÌNH & LƯU JSON
// =====================

async function saveProgress() {
    if (!currentStudentId) {
        console.error("❌ Không có ID học sinh.");
        return;
    }

    const completedExercises = Object.values(progressData[currentStudentId] || {}).filter(v => v === true).length;
    const averageScore = completedExercises > 0 ? (totalScore / completedExercises).toFixed(2) : 0;

    try {
        const response = await fetch(GITHUB_SAVE_PROGRESS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId: currentStudentId, progressData, completedExercises, averageScore })
        });

        if (!response.ok) throw new Error("❌ Lỗi khi lưu tiến trình.");

        console.log("✅ Tiến trình đã lưu thành công!");
    } catch (error) {
        console.error("❌ Lỗi ghi dữ liệu:", error);
    }
}

// =====================
// 6️⃣ SỰ KIỆN NÚT "CHẤM BÀI"
// =====================

document.getElementById('submitBtn').addEventListener('click', async () => {
    const problemText = document.getElementById('problemText').innerHTML.trim();
    if (!problemText) return alert('Vui lòng chọn bài tập.');

    const { studentAnswer, feedback, score } = await gradeWithGemini(base64Image, problemText, currentStudentId);
    document.getElementById('result').innerHTML = feedback;

    completedProblems++;
    totalScore += score;
    await saveProgress();
    await displayProblemList();
});
