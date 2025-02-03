import { json } from '@vercel/node';
import fetch from 'node-fetch';

export default async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Phương thức không được hỗ trợ' });
    }

    const PROGRESS_JSON_URL = process.env.PROGRESS_JSON_URL;

    try {
        const response = await fetch(PROGRESS_JSON_URL);
        const progress = await response.json();
        return res.status(200).json(progress);
    } catch (error) {
        return res.status(500).json({ error: '❌ Không thể lấy tiến trình học sinh' });
    }
};
