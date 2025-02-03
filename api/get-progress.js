export default async function handler(req, res) {
    const { studentId } = req.query;
    if (!studentId) {
        return res.status(400).json({ message: 'Thiếu studentId' });
    }

    try {
        // Giả sử bạn lấy dữ liệu tiến trình từ một nguồn (ví dụ file JSON, database, v.v...)
        const progress = await getStudentProgress(studentId);  // Giả sử là hàm lấy dữ liệu tiến trình
        if (!progress) {
            return res.status(404).json({ message: 'Không tìm thấy tiến trình của học sinh.' });
        }
        res.status(200).json(progress);
    } catch (error) {
        console.error("Lỗi khi lấy tiến trình học sinh:", error);
        res.status(500).json({ message: 'Lỗi hệ thống khi lấy tiến trình học sinh.' });
    }
}
