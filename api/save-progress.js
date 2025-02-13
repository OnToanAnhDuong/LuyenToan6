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
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { studentId, problemId, completedExercises, totalScore, averageScore, problemsDone } = req.body;
    
    if (!studentId || !problemId) {
        return res.status(400).json({ error: "Thiếu thông tin bắt buộc." });
    }

    try {
        console.log(`🔄 Đang cập nhật tiến trình cho học sinh: ${studentId}`);

        // 📝 Cập nhật dữ liệu vào Firebase
        await db.ref(`progress/${studentId}`).set({
            completedExercises,
            totalScore,
            averageScore,
            problemsDone
        });

        console.log(`✅ Cập nhật thành công cho ${studentId}`);
        res.status(200).json({ message: "Cập nhật thành công!", progress: { completedExercises, totalScore, averageScore, problemsDone } });
    } catch (error) {
        console.error("❌ Lỗi khi lưu tiến trình:", error);
        res.status(500).json({ error: error.message });
    }
}
