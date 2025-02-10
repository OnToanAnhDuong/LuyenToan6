const PROGRESS_URL = '/data/progress.json'; // Đường dẫn file tiến trình

let progressData = {}; // Biến toàn cục lưu tiến trình học sinh

// ✅ Tải tiến trình học sinh
export async function loadProgress(studentId) {
    try {
        const response = await fetch(PROGRESS_URL);
        if (!response.ok) throw new Error('Không thể tải tiến trình học sinh.');
        const data = await response.json();
        
        // Nếu học sinh chưa có tiến trình, tạo mới
        progressData = data[studentId] || { completedExercises: 0, totalScore: 0, averageScore: 0 };
        console.log(`✅ Tiến trình của học sinh ${studentId} đã tải:`, progressData);

        updateProgressUI(); // Cập nhật giao diện
    } catch (error) {
        console.error('❌ Lỗi tải tiến trình:', error);
    }
}

// ✅ Lưu tiến trình học sinh
export async function saveProgress(studentId, score) {
    try {
        // Nếu chưa có dữ liệu, khởi tạo
        if (!progressData) progressData = {};
        if (!progressData[studentId]) {
            progressData[studentId] = { completedExercises: 0, totalScore: 0, averageScore: 0 };
        }

        // Cập nhật tiến trình
        progressData[studentId].completedExercises++;
        progressData[studentId].totalScore += score;
        progressData[studentId].averageScore = progressData[studentId].totalScore / progressData[studentId].completedExercises;

        // Gửi dữ liệu cập nhật lên server
        await fetch('/api/save-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(progressData)
        });

        console.log(`✅ Tiến trình học sinh ${studentId} đã lưu thành công!`);
        updateProgressUI(); // Cập nhật UI sau khi lưu

    } catch (error) {
        console.error('❌ Lỗi lưu tiến trình:', error);
    }
}

// ✅ Cập nhật giao diện UI
function updateProgressUI() {
    document.getElementById("completedExercises").textContent = progressData.completedExercises || 0;
    document.getElementById("averageScore").textContent = progressData.averageScore?.toFixed(2) || 0;
}

