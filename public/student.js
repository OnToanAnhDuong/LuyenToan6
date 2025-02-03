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
