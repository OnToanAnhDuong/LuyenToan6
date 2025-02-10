const PROGRESS_API_URL = "/api/get-progress"; // API lấy tiến trình từ GitHub JSON
const SAVE_PROGRESS_API_URL = "/api/save-progress"; // API lưu tiến trình học sinh

let progressData = {}; // Biến toàn cục lưu tiến trình học sinh

// ✅ Tải tiến trình học sinh từ API
export async function loadProgress(studentId) {
    try {
        const response = await fetch(`${PROGRESS_API_URL}?studentId=${studentId}`);
        if (!response.ok) throw new Error("Không thể tải tiến trình học sinh.");

        const data = await response.json();
        
        // Nếu học sinh chưa có tiến trình, tạo mặc định
        progressData = data[studentId] || { completedExercises: 0, totalScore: 0, averageScore: 0, problems: [] };

        console.log(`✅ Tiến trình của học sinh ${studentId} đã tải:`, progressData);
        updateProgressUI(); // Cập nhật giao diện
    } catch (error) {
        console.error("❌ Lỗi tải tiến trình:", error);
    }
}

// ✅ Cập nhật tiến trình học sinh khi hoàn thành bài tập
export async function updateStudentProgress(studentId, problemId, score) {
    if (!progressData[studentId]) {
        progressData[studentId] = { completedExercises: 0, totalScore: 0, averageScore: 0, problems: [] };
    }

    // Kiểm tra xem bài này đã làm chưa
    if (!progressData[studentId].problems.includes(problemId)) {
        progressData[studentId].completedExercises += 1;
        progressData[studentId].totalScore += score;
        progressData[studentId].averageScore = (progressData[studentId].totalScore / progressData[studentId].completedExercises).toFixed(2);
        progressData[studentId].problems.push(problemId); // Lưu bài tập đã làm
    }

    await saveProgress(studentId);
}

// ✅ Lưu tiến trình học sinh vào API GitHub JSON
export async function saveProgress(studentId) {
    try {
        await fetch(SAVE_PROGRESS_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId, progress: progressData[studentId] })
        });

        console.log(`✅ Tiến trình của học sinh ${studentId} đã được lưu.`);
    } catch (error) {
        console.error("❌ Lỗi khi lưu tiến trình:", error);
    }
}

// ✅ Cập nhật giao diện tiến trình học sinh
export function updateProgressUI() {
    document.getElementById("completedExercises").textContent = progressData.completedExercises || 0;
    document.getElementById("averageScore").textContent = progressData.averageScore || 0;
}
