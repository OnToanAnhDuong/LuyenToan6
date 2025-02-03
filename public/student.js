document.addEventListener("DOMContentLoaded", async function () {
    await initStudentPage();
});

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

// 🌟 1. Hàm tải dữ liệu học sinh từ `students.json`
const loadStudentData = async (studentId) => {
    try {
        const response = await fetch('/api/get-students');
        if (!response.ok) {
            throw new Error("Không thể tải danh sách học sinh.");
        }
        const studentsObject = await response.json();  // Lấy dữ liệu từ API

        // Chuyển đối tượng JSON thành mảng
        const students = Object.keys(studentsObject).map(key => ({
            id: key,
            name: studentsObject[key].name,
            role: studentsObject[key].role
        }));

        console.log("✅ Danh sách học sinh:", students);

        // Kiểm tra xem danh sách có hợp lệ không
        if (!Array.isArray(students) || students.length === 0) {
            throw new Error("Dữ liệu học sinh không phải là mảng hoặc rỗng!");
        }

        return students; // Trả về danh sách học sinh đã chuyển đổi
    } catch (error) {
        console.error("❌ Lỗi khi tải danh sách học sinh:", error);
        return [];  // Trả về mảng rỗng để tránh lỗi khi xử lý tiếp
    }
};

// 🌟 2. Hàm tải danh sách bài tập từ `problems.json`
let progressData = {};

// 🌟 2. Hàm tải danh sách bài tập từ `problems.json`
const loadProblems = async () => {
    try {
        const response = await fetch('/api/get-problems');
        if (!response.ok) {
            throw new Error("Không thể tải danh sách bài tập!");
        }
        const problems = await response.json();
        console.log("✅ Danh sách bài tập:", problems);
        displayProblemList(problems); // Hiển thị bài tập lên giao diện
    } catch (error) {
        console.error("❌ Lỗi khi tải danh sách bài tập:", error);
    }
};
// 🌟 3. Hiển thị danh sách bài tập
function displayProblemList(problems) {
    const problemContainer = document.getElementById("problemList");
    problemContainer.innerHTML = ""; // Xóa danh sách cũ nếu có
    
    problems.forEach(problem => {
        const problemBox = document.createElement("div");
        problemBox.textContent = `Bài ${problem.index}: ${problem.problem}`;
        problemBox.className = "problem-box";
        problemBox.dataset.id = problem.index;

        // Màu sắc trạng thái bài tập
        function updateProblemColor() {
            // Kiểm tra nếu progressData đã có dữ liệu trước khi sử dụng
            if (progressData[problem.index]) {
                problemBox.style.backgroundColor = "green";
            } else {
                problemBox.style.backgroundColor = "yellow";
            }
        }

        updateProblemColor(); // Áp dụng màu sắc

        problemBox.addEventListener("click", async () => {
            if (progressData[problem.index]) {
                alert("📌 Bài tập này đã làm! Vui lòng chọn bài tập khác.");
                return;
            }
            displayProblem(problem); // Hiển thị nội dung bài tập
        });

        problemContainer.appendChild(problemBox);
    });

    console.log("✅ Danh sách bài tập đã cập nhật.");
}
// 🌟 4. Hiển thị nội dung bài tập
function displayProblem(problem) {
    document.getElementById("problemText").innerHTML = problem.problem;
    currentProblem = problem;
    MathJax.typesetPromise([document.getElementById("problemText")]).catch(err => console.error("MathJax lỗi:", err));
}

// 🌟 5. Tải tiến trình học sinh từ `progress.json`
async function loadProgress(studentId) {
    try {
        const response = await fetch(`/api/get-progress?studentId=${studentId}`);
        const progress = await response.json();
        progressData = progress || {}; // Lưu vào biến toàn cục
        console.log(`✅ Tiến trình của học sinh ${studentId}:`, progressData);
        updateProgressUI();
    } catch (error) {
        console.error("❌ Lỗi khi tải tiến trình:", error);
    }
}

// 🌟 6. Cập nhật tiến trình UI (số bài đã làm & điểm TB)
function updateProgressUI() {
    document.getElementById("completedExercises").textContent = progressData.completedExercises || 0;
    document.getElementById("averageScore").textContent = progressData.averageScore || 0;
}

// 🌟 7. Sự kiện nút "Chấm bài"
document.getElementById("submitBtn").addEventListener("click", async () => {
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
    if (!base64Image && !studentFileInput.files.length) {
        alert("⚠ Vui lòng tải ảnh bài làm.");
        return;
    }

    // Chuyển ảnh sang Base64
    const imageToProcess = base64Image || (studentFileInput.files.length > 0 ? await getBase64(studentFileInput.files[0]) : null);
    if (!imageToProcess) {
        alert("❌ Không thể lấy ảnh bài làm.");
        return;
    }

    try {
        document.getElementById("result").innerText = "🔄 Đang chấm bài...";
        const { studentAnswer, feedback, score } = await gradeWithGemini(imageToProcess, problemText, studentId);
        await saveProgress(studentId, score);

        document.getElementById("result").innerHTML = feedback;
        MathJax.typesetPromise([document.getElementById("result")]).catch(err => console.error("MathJax lỗi:", err));

        alert(`✅ Bài tập đã được chấm! Bạn đạt ${score}/10 điểm.`);
        progressData[currentProblem.index] = true; // Đánh dấu đã làm bài
        updateProgressUI();
    } catch (error) {
        console.error("❌ Lỗi khi chấm bài:", error);
        document.getElementById("result").innerText = `Lỗi: ${error.message}`;
    }
});

// 🌟 8. Lưu tiến trình học sinh vào `progress.json`
async function saveProgress(studentId, score) {
    try {
        let completedExercises = progressData.completedExercises || 0;
        let totalScore = (progressData.averageScore || 0) * completedExercises;
        completedExercises += 1;
        let averageScore = (totalScore + score) / completedExercises;

        progressData.completedExercises = completedExercises;
        progressData.averageScore = averageScore;

        await fetch("/api/save-progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId, completedExercises, averageScore })
        });

        console.log(`✅ Tiến trình đã được cập nhật: ${completedExercises} bài, Điểm TB: ${averageScore.toFixed(2)}`);
    } catch (error) {
        console.error("❌ Lỗi khi lưu tiến trình:", error);
    }
}

// 🌟 9. Chuyển đổi ảnh thành Base64
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = error => reject(error);
    });
}
