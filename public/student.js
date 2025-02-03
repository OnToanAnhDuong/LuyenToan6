document.addEventListener("DOMContentLoaded", async () => {
    console.log("📌 Đang tải giao diện học sinh...");
    await initStudentPage();
});

// 🚀 Hàm khởi động giao diện học sinh
async function initStudentPage() {
    const currentStudentId = localStorage.getItem("studentId");
    if (!currentStudentId) {
        alert("⚠ Bạn chưa đăng nhập. Vui lòng quay lại trang chính để đăng nhập.");
        window.location.href = "index.html"; // Quay về trang đăng nhập
        return;
    }

    console.log(`🔄 Đang tải dữ liệu cho học sinh: ${currentStudentId}`);
    
    await loadProgress(currentStudentId);
    await fetchProblems();
    await displayProblemList();

    // Gán sự kiện cho nút chấm bài
    document.getElementById("submitBtn").addEventListener("click", handleSubmit);
}

// 📥 Hàm tải danh sách bài tập từ JSON
async function fetchProblems() {
    try {
        const response = await fetch("/data/problems.json");
        if (!response.ok) throw new Error("Lỗi tải danh sách bài tập.");
        const problems = await response.json();
        console.log("✅ Danh sách bài tập đã tải:", problems);
    } catch (error) {
        console.error("❌ Lỗi khi tải bài tập:", error);
    }
}

// 📜 Hiển thị danh sách bài tập
async function displayProblemList() {
    try {
        const response = await fetch("/data/progress.json");
        if (!response.ok) throw new Error("Lỗi tải tiến trình.");
        const progressData = await response.json();

        const problemContainer = document.getElementById("problemList");
        problemContainer.innerHTML = ""; // Xóa danh sách cũ

        for (const [index, problem] of Object.entries(progressData)) {
            const problemBox = document.createElement("div");
            problemBox.textContent = `Bài ${index}`;
            problemBox.className = "problem-box";

            // Cập nhật màu sắc bài tập
            if (problem.completed) {
                problemBox.style.backgroundColor = "green"; // Đã làm
            } else {
                problemBox.style.backgroundColor = "yellow"; // Chưa làm
            }

            // Khi học sinh chọn bài
            problemBox.addEventListener("click", () => {
                if (problem.completed) {
                    alert("📌 Bài tập này đã làm! Vui lòng chọn bài tập khác.");
                } else {
                    loadProblem(index);
                    problemBox.style.backgroundColor = "blue"; // Màu xanh khi học sinh đang làm bài
                }
            });

            problemContainer.appendChild(problemBox);
        }
    } catch (error) {
        console.error("❌ Lỗi khi hiển thị danh sách bài tập:", error);
    }
}

// 📖 Hiển thị bài tập theo số thứ tự
async function loadProblem(problemIndex) {
    try {
        const response = await fetch("/data/problems.json");
        if (!response.ok) throw new Error("Lỗi tải bài tập.");
        const problems = await response.json();

        const selectedProblem = problems[problemIndex];
        if (selectedProblem) {
            document.getElementById("problemText").innerHTML = selectedProblem.text;
        } else {
            document.getElementById("problemText").textContent = "Không tìm thấy bài tập.";
        }
    } catch (error) {
        console.error("❌ Lỗi khi tải bài tập:", error);
    }
}

// 📝 Chấm bài
async function handleSubmit() {
    const problemText = document.getElementById("problemText")?.innerHTML?.trim();
    if (!problemText) {
        alert("Vui lòng chọn bài tập trước khi chấm.");
        return;
    }

    try {
        document.getElementById("result").innerText = "Đang chấm bài...";
        const score = Math.floor(Math.random() * 10) + 1; // Giả lập chấm điểm ngẫu nhiên

        alert(`✅ Bài tập đã chấm xong. Điểm: ${score}`);
        updateProgress(score);
    } catch (error) {
        console.error("❌ Lỗi khi chấm bài:", error);
        alert("❌ Lỗi khi chấm bài.");
    }
}

// 📊 Cập nhật tiến trình
async function updateProgress(score) {
    try {
        const response = await fetch("/data/progress.json");
        const progressData = await response.json();

        // Lưu tiến trình
        progressData[currentStudentId] = progressData[currentStudentId] || {};
        progressData[currentStudentId].completed = true;
        progressData[currentStudentId].score = score;

        await saveProgress(progressData);
        console.log("✅ Tiến trình đã được cập nhật:", progressData);
    } catch (error) {
        console.error("❌ Lỗi khi cập nhật tiến trình:", error);
    }
}

// 💾 Lưu tiến trình vào JSON
async function saveProgress(progressData) {
    try {
        const response = await fetch("/api/save-progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(progressData),
        });

        if (!response.ok) throw new Error("Lỗi khi lưu tiến trình.");
        console.log("✅ Tiến trình đã được lưu thành công.");
    } catch (error) {
        console.error("❌ Lỗi khi lưu tiến trình:", error);
    }
}
document.addEventListener('DOMContentLoaded', function() {
    // Các biến DOM
    const selectProblemBtn = document.getElementById('selectProblemBtn');
    const randomProblemBtn = document.getElementById('randomProblemBtn');
    const submitBtn = document.getElementById('submitBtn');
    const hintBtn = document.getElementById('hintBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const problemIndexInput = document.getElementById('problemIndexInput');
    const problemText = document.getElementById('problemText');
    const problemList = document.getElementById('problemList');
    const result = document.getElementById('result');
    const completedExercises = document.getElementById('completedExercises');
    const averageScore = document.getElementById('averageScore');
    
    // Mảng chứa các bài tập mẫu
    const problems = [
        { id: 1, question: "Tính 5 + 3 * 2" },
        { id: 2, question: "Giải phương trình 3x + 4 = 10" },
        { id: 3, question: "Tính diện tích hình chữ nhật với chiều dài 8cm và chiều rộng 5cm" },
    ];

    // Chọn bài theo số thứ tự
    selectProblemBtn.addEventListener('click', function() {
        const index = parseInt(problemIndexInput.value, 10);
        if (index && index <= problems.length) {
            const selectedProblem = problems[index - 1];
            problemText.innerHTML = selectedProblem.question;
        } else {
            alert('Số bài không hợp lệ!');
        }
    });

    // Lấy bài tập ngẫu nhiên
    randomProblemBtn.addEventListener('click', function() {
        const randomIndex = Math.floor(Math.random() * problems.length);
        const randomProblem = problems[randomIndex];
        problemText.innerHTML = randomProblem.question;
    });

    // Chấm bài
    submitBtn.addEventListener('click', function() {
        // Giả sử bạn có kết quả tính toán ở đây
        const score = Math.floor(Math.random() * 10); // Điểm ngẫu nhiên từ 0 đến 10
        result.innerHTML = `Điểm: ${score}/10`;

        // Cập nhật số bài đã làm và điểm trung bình
        let completed = parseInt(completedExercises.textContent, 10);
        let avgScore = parseFloat(averageScore.textContent);
        completed++;
        avgScore = (avgScore * (completed - 1) + score) / completed;

        completedExercises.textContent = completed;
        averageScore.textContent = avgScore.toFixed(2);
    });

    // Gợi ý
    hintBtn.addEventListener('click', function() {
        alert('Gợi ý: Hãy áp dụng quy tắc ưu tiên trong phép tính!');
    });

    // Xóa tất cả
    deleteAllBtn.addEventListener('click', function() {
        problemIndexInput.value = '';
        problemText.innerHTML = '';
        result.innerHTML = '';
        completedExercises.textContent = 0;
        averageScore.textContent = 0;
    });

    // Hiển thị danh sách bài tập trên trang học sinh
    problems.forEach(function(problem) {
        const problemBox = document.createElement('div');
        problemBox.classList.add('problem-box');
        problemBox.textContent = problem.question;
        problemBox.addEventListener('click', function() {
            problemText.innerHTML = problem.question;
        });
        problemList.appendChild(problemBox);
    });
});

