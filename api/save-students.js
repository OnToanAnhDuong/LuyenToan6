import { json } from '@vercel/node';
import fetch from 'node-fetch';

export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Phương thức không được hỗ trợ' });
    }

    const { students } = req.body;
    if (!students) {
        return res.status(400).json({ error: 'Thiếu danh sách học sinh' });
    }

    const STUDENTS_JSON_URL = process.env.STUDENTS_JSON_URL;

    try {
        const response = await fetch(STUDENTS_JSON_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(students)
        });

        if (!response.ok) {
            throw new Error('Lỗi khi lưu danh sách học sinh');
        }

        return res.status(200).json({ message: '✅ Danh sách học sinh đã lưu thành công!' });
    } catch (error) {
        return res.status(500).json({ error: '❌ Không thể lưu danh sách học sinh' });
    }
};
