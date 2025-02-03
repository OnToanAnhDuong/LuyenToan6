import { json } from '@vercel/node';
import fetch from 'node-fetch';

export default async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Phương thức không được hỗ trợ' });
    }

    const STUDENTS_JSON_URL = process.env.STUDENTS_JSON_URL;

    try {
        const response = await fetch(STUDENTS_JSON_URL);
        const students = await response.json();
        return res.status(200).json(students);
    } catch (error) {
        return res.status(500).json({ error: '❌ Không thể lấy danh sách học sinh' });
    }
};
