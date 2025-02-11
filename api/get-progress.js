export default async function handler(req, res) {
    const { studentId } = req.query;
    
    if (!studentId) {
        return res.status(400).json({ error: "Thiếu studentId" });
    }

    try {
        const githubUrl = "https://raw.githubusercontent.com/OnToanAnhDuong/LuyenToan6/main/data/progress.json";
        const response = await fetch(githubUrl, { cache: "no-store" }); // ⚠ Tắt cache!
        if (!response.ok) throw new Error("Không thể tải JSON từ GitHub.");

        const allProgress = await response.json();
        const studentProgress = allProgress[studentId] || {};

        console.log(`📌 Tiến trình của ${studentId}:`, studentProgress);
        res.status(200).json(studentProgress);
    } catch (error) {
        console.error("❌ Lỗi khi lấy tiến trình:", error);
        res.status(500).json({ error: error.message });
    }
}
