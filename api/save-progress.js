import { json } from '@vercel/node';
import fetch from 'node-fetch';

export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Phương thức không được hỗ trợ' });
    }

    const { studentId, progressData } = req.body;
    if (!studentId || !progressData) {
        return res.status(400).json({ error: 'Thiếu dữ liệu đầu vào' });
    }

    const PROGRESS_JSON_URL = process.env.PROGRESS_JSON_URL;

    try {
        const response = await fetch(PROGRESS_JSON_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [studentId]: progressData })
        });

        if (!response.ok) {
            throw new Error('Lỗi khi lưu tiến trình học sinh');
        }

        return res.status(200).json({ message: '✅ Tiến trình đã lưu thành công!' });
    } catch (error) {
        return res.status(500).json({ error: '❌ Không thể lưu tiến trình' });
    }
};
