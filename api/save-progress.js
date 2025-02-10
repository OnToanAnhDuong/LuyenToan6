import fetch from "node-fetch";

const GITHUB_SAVE_PROGRESS_URL = "https://api.github.com/repos/OnToanAnhDuong/LuyenToan6/contents/data/progress.json";

export default async function (req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "❌ Phương thức không hợp lệ! Chỉ hỗ trợ POST." });
    }

    // 🔹 Lấy token từ biến môi trường
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
        return res.status(500).json({ error: "❌ Lỗi: Không tìm thấy GITHUB_TOKEN trong môi trường!" });
    }

    try {
        // 1️⃣ 🟢 Lấy dữ liệu từ request
        const { studentId, problemId, score } = req.body;
        if (!studentId || !problemId) {
            return res.status(400).json({ error: "❌ Thiếu studentId hoặc problemId!" });
        }

        console.log(`📌 Đang cập nhật tiến trình cho học sinh: ${studentId} (Bài: ${problemId})`);

        // 2️⃣ 🟢 Lấy nội dung hiện tại của progress.json từ GitHub
        const response = await fetch(GITHUB_SAVE_PROGRESS_URL, {
            method: "GET",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (!response.ok) {
            throw new Error(`❌ Lỗi khi lấy dữ liệu progress.json: ${response.statusText}`);
        }

        const fileData = await response.json();
        const sha = fileData.sha; // Lấy SHA để cập nhật file
        const currentContent = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

        // 3️⃣ 🟢 Cập nhật dữ liệu tiến trình học sinh
        if (!currentContent[studentId]) {
            currentContent[studentId] = {
                completedExercises: 0,
                totalScore: 0,
                averageScore: 0,
                problemsDone: [] // ✅ Thêm danh sách bài tập đã giải (dưới dạng số)
            };
        }

        let studentProgress = currentContent[studentId];

        // Kiểm tra nếu bài tập chưa có trong danh sách -> thêm mới
        if (!studentProgress.problemsDone.includes(problemId)) {
            studentProgress.problemsDone.push(problemId);
            studentProgress.completedExercises++;
            studentProgress.totalScore += score;
            studentProgress.averageScore = studentProgress.totalScore / studentProgress.completedExercises;
        }

        // 4️⃣ 🟢 Chuyển dữ liệu thành Base64 trước khi ghi lại
        const updatedContent = Buffer.from(JSON.stringify(currentContent, null, 2)).toString("base64");

        // 5️⃣ 🟢 Ghi dữ liệu mới lên GitHub
        const updateResponse = await fetch(GITHUB_SAVE_PROGRESS_URL, {
            method: "PUT",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Cập nhật tiến trình học sinh ${studentId} (Bài ${problemId})`,
                content: updatedContent,
                sha: sha
            })
        });

        if (!updateResponse.ok) {
            throw new Error(`❌ Lỗi khi cập nhật progress.json: ${updateResponse.statusText}`);
        }

        console.log(`✅ Đã cập nhật tiến trình của học sinh ${studentId}`);
        return res.status(200).json({ message: "✅ Cập nhật tiến trình thành công!" });

    } catch (error) {
        console.error("❌ Lỗi khi cập nhật tiến trình:", error);
        return res.status(500).json({ error: error.message });
    }
}
