// Khởi tạo Firebase (thay bằng thông tin của bạn)
const firebaseConfig = {
    apiKey: "AIzaSyDO95ccGCuaIGTyGeQ5oh3ho1H6mTN7upU",
        authDomain: "chuong-123.firebaseapp.com",
        databaseURL: "https://chuong-123-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "chuong-123",
        storageBucket: "chuong-123.appspot.com",
        messagingSenderId: "261814561451",
        appId: "1:261814561451:web:324d304e75ba126dc065ee",
        measurementId: "G-P9G5EQWKHY"
};

// Khởi tạo Firebase App
firebase.initializeApp(firebaseConfig);

// Tham chiếu đến Database
const db = firebase.database();
let currentKeyIndex = 0;  // Biến để theo dõi API key đang sử dụng
let base64Image = ""; // Biến toàn cục để lưu ảnh bài làm
let progressData = {}; // Biến lưu tiến trình học sinh
let currentProblem = null; // Biến lưu bài tập hiện tại
let isGrading = false; // Biến trạng thái để chống spam
let apiKey = ""; // Khai báo biến toàn cục để lưu API Key

function formatProblemText(problemText) {
    return problemText.replace(/\n/g, '<br>').replace(/([a-d]\))/g, '<br>$1');
}
// Tải API key từ server
async function loadApiKey() {
    try {
        const response = await fetch('/api/get-api-keys'); // Gọi API get-api-keys
        if (!response.ok) {
            throw new Error('Không thể tải API key');
        }
        const data = await response.json();
        apiKey = data.apiKey;  // Lưu API key duy nhất
        console.log('✅ API Key:', apiKey);

        if (!apiKey) {
            console.error("Không có API Key hợp lệ.");
        }
    } catch (error) {
        console.error('❌ Lỗi khi tải API Key:', error);
    }
}

// Hàm khởi tạo trang học sinh
async function initStudentPage() {
    const studentId = localStorage.getItem("studentId");
    if (!studentId) {
        alert("⚠ Bạn chưa đăng nhập! Vui lòng đăng nhập lại.");
        window.location.href = "index.html"; // Chuyển hướng về trang đăng nhập
        return;
    }

    console.log(`🔹 Đang tải dữ liệu học sinh: ${studentId}`);
    await loadStudentData(studentId);
    await loadProblems();
    await loadProgress(studentId);     
    console.log("✅ Trang học sinh đã khởi tạo hoàn tất!");
}

// Hàm tải dữ liệu học sinh từ `students.json`
const loadStudentData = async (studentId) => {
    try {
        const response = await fetch('/api/get-students');
        if (!response.ok) {
            throw new Error("Không thể tải danh sách học sinh.");
        }
        const studentsObject = await response.json();  // Lấy dữ liệu từ API

        const students = Object.keys(studentsObject).map(key => ({
            id: key,
            name: studentsObject[key].name,
            role: studentsObject[key].role
        }));

        console.log("✅ Danh sách học sinh:", students);
        return students;
    } catch (error) {
        console.error("❌ Lỗi khi tải danh sách học sinh:", error);
        return [];
    }
};

// Hàm tải danh sách bài tập từ `problems.json`
const loadProblems = async () => {
    try {
        const response = await fetch('/api/get-problems');
        if (!response.ok) {
            throw new Error("Không thể tải danh sách bài tập!");
        }
        const problems = await response.json();
        console.log("✅ Danh sách bài tập:", problems);
        displayProblemList(problems);
    } catch (error) {
        console.error("❌ Lỗi khi tải danh sách bài tập:", error);
    }
};
// Hiển thị danh sách bài tập
function displayProblemList(problems) {
    const problemContainer = document.getElementById("problemList");
    problemContainer.innerHTML = ""; // Xóa danh sách cũ nếu có

    console.log("📌 Tổng số bài tập:", problems.length);
    
    problems.forEach(problem => {
        console.log(`📝 Đang tạo bài tập: ${problem.index} - ${problem.problem}`);

        const problemBox = document.createElement("div");
        problemBox.textContent = `Bài ${problem.index}`;
        problemBox.className = "problem-box";
        problemBox.dataset.id = String(problem.index); // Chuyển thành string để so sánh đúng

        // Kiểm tra xem bài tập này đã làm chưa
        if (progressData.problemsDone && progressData.problemsDone.includes(problem.index)) {
            problemBox.style.backgroundColor = "green"; // Bài đã làm
            console.log(`🟢 Bài ${problem.index} đã làm`);
        } else {
            problemBox.style.backgroundColor = "yellow"; // Bài chưa làm
            console.log(`🟡 Bài ${problem.index} chưa làm`);
        }

        problemBox.addEventListener("click", async () => {
            if (progressData.problemsDone && progressData.problemsDone.includes(problem.index)) {
                alert("📌 Bài tập này đã làm! Vui lòng chọn bài tập khác hoặc chọn bài tương tự.");
                return;
            }
            displayProblem(problem); // Hiển thị nội dung bài tập
        });

        problemContainer.appendChild(problemBox);
    });

    console.log("✅ Danh sách bài tập đã cập nhật.");
}

// Hiển thị nội dung bài tập khi học sinh chọn bài
function displayProblem(problem) {
    document.getElementById("problemText").innerHTML = problem.problem; // Hiển thị đề bài
    currentProblem = problem; // Lưu bài tập hiện tại
    MathJax.typesetPromise([document.getElementById("problemText")]).catch(err => console.error("MathJax lỗi:", err));
}

// Tải tiến trình học sinh
let isLoadingProgress = false; // 🆕 Biến kiểm soát trạng thái tải tiến trình

async function loadProgress(studentId) {
    try {
        console.log(`🔄 Đang tải tiến trình từ Firebase cho học sinh: ${studentId}`);

        // Đọc dữ liệu từ Firebase
        const progressRef = db.ref(`progress/${studentId}`);
        const snapshot = await progressRef.once("value");

        if (!snapshot.exists()) {
            console.warn(`⚠ Không tìm thấy tiến trình của ${studentId}, tạo dữ liệu mới.`);
            progressData = { completedExercises: 0, totalScore: 0, averageScore: 0, problemsDone: [] };
            await progressRef.set(progressData);
        } else {
            progressData = snapshot.val();
        }

        console.log("✅ Dữ liệu tiến trình tải về:", progressData);
        updateProgressUI();
        updateProblemColors();
    } catch (error) {
        console.error("❌ Lỗi khi tải tiến trình:", error);
    }
}
// ✅ Cập nhật màu sắc bài tập dựa trên tiến trình học sinh
function updateProblemColors() {
    const problemBoxes = document.querySelectorAll(".problem-box");

    console.log("📌 Đang cập nhật màu bài tập...");
    console.log("📌 Danh sách bài đã làm trước khi cập nhật màu:", progressData.problemsDone);

    if (!Array.isArray(progressData.problemsDone)) {
        console.warn("⚠ `progressData.problemsDone` không phải là mảng hoặc chưa có dữ liệu.");
        return;
    }

    problemBoxes.forEach(box => {
        let problemKey = `Bài ${box.dataset.id}`;

        if (progressData.problemsDone.includes(problemKey)) {
            box.style.backgroundColor = "green";
            console.log(`🟢 Đổi màu xanh: ${problemKey}`);
        } else {
            box.style.backgroundColor = "yellow";
            console.log(`🟡 Đổi màu vàng: ${problemKey}`);
        }
    });
}


// Cập nhật tiến trình UI
function updateProgressUI() {
    document.getElementById("completedExercises").textContent = progressData.completedExercises ?? 0;
    document.getElementById("averageScore").textContent = (progressData.averageScore ?? 0).toFixed(2);

}

// Lưu tiến trình học sinh vào `progress.json`
async function saveProgress(studentId, problemId, score) {
    try {
        if (!studentId || !problemId) {
            console.error("❌ Thiếu studentId hoặc problemId!");
            return;
        }

        // Lấy tiến trình hiện tại
        const progressRef = db.ref(`progress/${studentId}`);
        const snapshot = await progressRef.once("value");
        let progressData = snapshot.val() || {
            completedExercises: 0,
            totalScore: 0,
            averageScore: 0,
            problemsDone: []
        };

        // Cập nhật tiến trình
        let problemKey = `Bài ${problemId}`;
        if (!progressData.problemsDone.includes(problemKey)) {
            progressData.problemsDone.push(problemKey);
            progressData.completedExercises += 1;
            progressData.totalScore += score;
            progressData.averageScore = progressData.totalScore / progressData.completedExercises;
        }

        // Ghi dữ liệu lên Firebase
        await progressRef.set(progressData);
        console.log(`✅ Tiến trình đã lưu thành công:`, progressData);

        // Cập nhật UI sau khi lưu
        updateProgressUI();
        updateProblemColors();
    } catch (error) {
        console.error("❌ Lỗi khi lưu tiến trình:", error);
    }
}

// Chuyển đổi ảnh thành Base64
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = error => reject(error);
    });
}

document.addEventListener("DOMContentLoaded", async function () {
    await loadApiKey(); // Tải API Key duy nhất khi trang được tải
    await initStudentPage();
});
// Hàm gửi yêu cầu API với API Key
async function makeApiRequest(apiUrl, requestBody) {
    console.log("🔹 Đang gửi request đến Gemini API:", JSON.stringify(requestBody, null, 2)); // Log request
    try {
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API lỗi ${response.status}:`, errorText); // Log lỗi chi tiết
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('❌ API error:', error);
        throw error;
    }
}

// Hàm gọi API Gemini để chấm bài
async function gradeWithGemini(base64Image, problemText, studentId) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent';

    const promptText = `
Học sinh: ${studentId}
📌 Đề bài:
${problemText}

🔹 **Yêu cầu chấm bài:**
1️⃣ Nhận diện bài làm từ ảnh và gõ lại **chính xác từng ký tự, công thức Toán viết dưới dạng LaTeX**.
2️⃣ Giải bài toán theo đúng yêu cầu đề bài, cung cấp lời giải **chi tiết từng bước**.
3️⃣ So sánh bài làm của học sinh với đáp án đúng, **chấm điểm từng bước** theo mức độ chính xác.
4️⃣ Chấm điểm trên thang **10**, cho **0 điểm nếu bài làm sai hoàn toàn hoặc không khớp đề bài**.
5️⃣ Đưa ra **nhận xét chi tiết** về bài làm và **đề xuất cách cải thiện**.

⚠ **Chú ý:**  
- Không tự suy luận nội dung từ ảnh, chỉ gõ lại chính xác các nội dung nhận diện được.  
- Nếu ảnh không rõ hoặc không thể nhận diện, hãy trả về:  
\`\`\`json
{ "studentAnswer": "Không nhận diện được bài làm", "score": 0 }
\`\`\`
- Nếu bài làm không khớp với đề bài, vẫn phải **chấm điểm công bằng** dựa trên nội dung học sinh làm được.

📌 **Định dạng JSON phản hồi bắt buộc:**
\`\`\`json
{
  "studentAnswer": "[Nội dung nhận diện từ ảnh]",
  "detailedSolution": "[Lời giải từng bước]",
  "gradingDetails": "[Cách chấm điểm]",
  "score": [Số từ 0-10],
  "feedback": "[Nhận xét chi tiết]",
  "suggestions": "[Đề xuất cải thiện]"
}
\`\`\`
`;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: promptText },
                    { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                ]
            }
        ]
    };

    console.log("📌 Đang gửi request đến Gemini API...");
    console.log(JSON.stringify(requestBody, null, 2));

    try {
        const data = await makeApiRequest(apiUrl, requestBody);

        if (!data?.candidates?.length || !data.candidates[0]?.content?.parts?.length) {
            throw new Error("API không trả về dữ liệu hợp lệ.");
        }

        let responseText = data.candidates[0].content.parts[0].text;
        console.log("📌 Phản hồi từ API:", responseText);

        // 🛑 Tìm JSON hợp lệ trong phản hồi từ API
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("API không trả về đúng định dạng JSON.");

        let parsedResponse = JSON.parse(jsonMatch[0]);

        // 🛑 Kiểm tra nếu `studentAnswer` rỗng
        if (!parsedResponse.studentAnswer || parsedResponse.studentAnswer.trim() === "") {
            console.warn("⚠ API không nhận diện được bài làm từ ảnh.");
            parsedResponse.studentAnswer = "⚠ Không nhận diện được bài làm. Vui lòng kiểm tra lại ảnh.";
            parsedResponse.score = 0;
            parsedResponse.feedback = "Hệ thống không thể nhận diện bài làm của bạn từ ảnh. Hãy thử tải lên ảnh rõ ràng hơn.";
            parsedResponse.suggestions = "Vui lòng sử dụng ảnh có độ phân giải cao, không bị mờ hoặc bị che khuất.";
        }

        // 🔹 Chuyển đổi dấu xuống dòng "\n" thành "<br>" trước khi hiển thị
        function formatText(text) {
            return text.replace(/\n/g, "<br>");
        }

        parsedResponse.studentAnswer = formatText(parsedResponse.studentAnswer);
        parsedResponse.detailedSolution = formatText(parsedResponse.detailedSolution);
        parsedResponse.gradingDetails = formatText(parsedResponse.gradingDetails);
        parsedResponse.feedback = formatText(parsedResponse.feedback);
        parsedResponse.suggestions = formatText(parsedResponse.suggestions);

        console.log("📌 Kết quả chấm bài sau khi xử lý:", parsedResponse);
        return parsedResponse;

    } catch (error) {
        console.error('❌ Lỗi khi chấm bài:', error);
        return {
            studentAnswer: "Lỗi xử lý",
            detailedSolution: "Lỗi xử lý",
            gradingDetails: "Lỗi xử lý",
            score: 0,
            feedback: `Lỗi: ${error.message}`,
            suggestions: "Lỗi xử lý"
        };
    }
}
function displayResult(response) {
    const resultContainer = document.getElementById("result");

    if (!response || typeof response !== "object") {
        resultContainer.innerHTML = "<p>❌ Lỗi: Không có dữ liệu phản hồi từ API.</p>";
        return;
    }

    function formatText(text) {
        return text.replace(/\n/g, "<br>");
    }

    const formattedResponse = `
        <div class="result-box">
            <div class="result-section">
                <h3>📌 Bài làm của học sinh:</h3>
                <p>${formatText(response.studentAnswer)}</p>
            </div>
            
            <div class="result-section">
                <h3>📝 Lời giải chi tiết:</h3>
                <p>${formatText(response.detailedSolution)}</p>
            </div>

            <div class="result-section">
                <h3>📊 Cách chấm điểm:</h3>
                <p>${formatText(response.gradingDetails)}</p>
            </div>

            <div class="result-section">
                <h3>🎯 Điểm số: <span style="color: #d9534f; font-weight: bold;">${response.score}/10</span></h3>
            </div>

            <div class="result-section">
                <h3>📢 Nhận xét:</h3>
                <p>${formatText(response.feedback)}</p>
            </div>

            <div class="result-section">
                <h3>🔍 Gợi ý cải thiện:</h3>
                <p>${formatText(response.suggestions)}</p>
            </div>
        </div>
    `;

    resultContainer.innerHTML = formattedResponse;
    MathJax.typesetPromise([resultContainer]).catch(err => console.error("MathJax rendering error:", err));
}


// Hàm xử lý ảnh trước khi gửi lên AI (ĐÃ SỬA LẠI)
async function preprocessImage(imageFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function () {
            console.log("📷 Đã đọc ảnh thành công!");

            const img = new Image();
            img.src = reader.result;

            img.onload = function () {
                console.log(`📏 Kích thước ảnh gốc: ${img.width}x${img.height}`);

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                // Resize ảnh nếu quá lớn
                const maxSize = 800;
                let width = img.width;
                let height = img.height;
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height *= maxSize / width;
                        width = maxSize;
                    } else {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                console.log(`📏 Ảnh sau khi resize: ${canvas.width}x${canvas.height}`);

                // Chuyển ảnh sang grayscale
                const imageData = ctx.getImageData(0, 0, width, height);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
                    imageData.data[i] = avg; // R
                    imageData.data[i + 1] = avg; // G
                    imageData.data[i + 2] = avg; // B
                }
                ctx.putImageData(imageData, 0, 0);

                console.log("✅ Ảnh đã xử lý thành công!");

                // Lấy dữ liệu Base64, loại bỏ tiền tố "data:image/jpeg;base64,"
                const base64Image = canvas.toDataURL("image/jpeg").split(",")[1];
                console.log("📌 Base64 đã xử lý:", base64Image.substring(0, 100) + "..."); // Log 100 ký tự đầu để kiểm tra

                resolve(base64Image);
            };

            img.onerror = function (err) {
                console.error("❌ Lỗi khi tải ảnh:", err);
                reject("Lỗi khi tải ảnh.");
            };
        };

        reader.onerror = function (err) {
            console.error("❌ Lỗi khi đọc ảnh:", err);
            reject("Lỗi khi đọc ảnh.");
        };

        reader.readAsDataURL(imageFile);
    });
}


// Hàm khi nhấn nút "Chấm bài"
document.getElementById("submitBtn").addEventListener("click", async () => {
    if (isGrading) {
        alert("⏳ Hệ thống đang chấm bài, vui lòng đợi...");
        return;
    }

    if (!currentProblem) {
        alert("⚠ Vui lòng chọn bài tập trước khi chấm.");
        return;
    }

    const studentId = localStorage.getItem("studentId");
    const problemText = document.getElementById("problemText").innerText.trim();
    const studentFileInput = document.getElementById("studentImage");

    if (!problemText) {
        alert("⚠ Đề bài chưa được tải.");
        return;
    }

    let base64Image = null;

    if (studentFileInput.files.length > 0) {
        try {
            base64Image = await preprocessImage(studentFileInput.files[0]); // Dùng ảnh đã xử lý
        } catch (error) {
            alert("❌ Lỗi khi xử lý ảnh. Vui lòng thử lại.");
            console.error("Lỗi khi xử lý ảnh:", error);
            return;
        }
    }

    if (!base64Image) {
        alert("⚠ Vui lòng tải lên ảnh bài làm hoặc chụp ảnh từ camera.");
        return;
    }

    try {
        isGrading = true;
        document.getElementById("result").innerText = "🔄 Đang chấm bài...";

        // Gọi API chấm bài
        const response = await gradeWithGemini(base64Image, problemText, studentId);
        
        // Hiển thị kết quả
        displayResult(response);
        // ✅ Cập nhật tiến trình sau khi chấm bài
        console.log("🔄 Đang lưu tiến trình...");
        await saveProgress(studentId, currentProblem.index, response.score);
        
        // 🔄 Đợi 1 giây để đảm bảo dữ liệu đã được cập nhật
        setTimeout(async () => {
            console.log("🔄 Tải lại tiến trình sau khi lưu...");
            await loadProgress(studentId);
            updateProgressUI();            
        }, 20000); // Đợi 1 giây
       } catch (error) {
        console.error("❌ Lỗi khi chấm bài:", error);
        document.getElementById("result").innerText = `❌ Lỗi: ${error.message}`;
    } finally {
        isGrading = false;
    }
});
 // 🔄 Đợi 1 giây rồi tải lại dữ liệu
//setTimeout(async () => {
//console.log("🔄 Tải lại tiến trình sau khi lưu...");
//await loadProgress(studentId);
           // }, 10000);
