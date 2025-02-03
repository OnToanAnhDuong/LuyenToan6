document.addEventListener('DOMContentLoaded', async () => {
    await loadStudents();
    await loadProgress();
    await fetchProblems();
    displayProblemList();
});

// Chọn bài tập và hiển thị
async function selectProblem(problemIndex) {
    if (progressData[currentStudentId]?.problems?.includes(problemIndex)) {
        alert("📌 Bài tập này đã làm! Bạn có thể chọn bài tập khác hoặc làm bài tương tự.");
        return;
    }

    currentProblem = problems.find(p => p.index === problemIndex);
    document.getElementById('problemText').innerHTML = formatProblemText(currentProblem.problem);
    updateProblemColor(problemIndex);
}

// Chấm bài, lưu tiến trình
document.getElementById('submitBtn').addEventListener('click', async () => {
    const problemText = document.getElementById('problemText').innerHTML.trim();
    if (!problemText || !base64Image) {
        alert('⚠ Vui lòng chọn bài và tải ảnh bài làm.');
        return;
    }

    try {
        const { studentAnswer, feedback, score } = await gradeWithGemini(base64Image, problemText, currentStudentId);
        document.getElementById('result').innerHTML = feedback;
        await updateStudentProgress(currentStudentId, score);
        progressData[currentStudentId].problems.push(currentProblem.index);
        await saveProgress();
        alert('✅ Bài tập đã được chấm!');
    } catch (error) {
        console.error('❌ Lỗi chấm bài:', error);
    }
});

// Định dạng bài tập
function formatProblemText(text) {
    return text.replace(/\n/g, '<br>').replace(/([a-d]\))/g, '<br>$1');
}
