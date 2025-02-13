import admin from "firebase-admin";

// Kiểm tra nếu Firebase chưa được khởi tạo
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL, // URL Database từ Firebase
    });
}

const db = admin.database();

export default async function handler(req, res) {
    const { studentId } = req.query;

    if (!studentId) {
        return res.status(400).json({ error: "Thiếu studentId" });
    }

    try {
        console.log(`🔄 Đang tải tiến trình từ Firebase cho học sinh: ${studentId}`);

        // Đọc dữ liệu từ Firebase Database
        const snapshot = await db.ref(`progress/${studentId}`).once("value");
        const studentProgress = snapshot.val();

        if (!studentProgress) {
            throw new Error(`Không tìm thấy tiến trình của học sinh ${studentId}`);
        }

        console.log(`✅ Tiến trình của ${studentId}:`, studentProgress);
        res.status(200).json(studentProgress);
    } catch (error) {
        console.error("❌ Lỗi khi lấy tiến trình:", error);
        res.status(500).json({ error: error.message });
    }
}
