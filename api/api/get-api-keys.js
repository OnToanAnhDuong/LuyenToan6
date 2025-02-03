import { json } from '@vercel/node';

export default async (req, res) => {
    const API_KEYS = [
        process.env.API_K1, process.env.API_K2, process.env.API_K3, process.env.API_K4, process.env.API_K5,
        process.env.API_K6, process.env.API_K7, process.env.API_K8, process.env.API_K9, process.env.API_K10
    ].filter(Boolean);

    if (API_KEYS.length === 0) {
        return res.status(500).json({ error: '❌ Không tìm thấy API Keys' });
    }

    return res.status(200).json({ apiKeys: API_KEYS });
};
