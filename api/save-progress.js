// api/save-progress.js
const fetch = require('node-fetch');

// Lấy GITHUB_TOKEN từ biến môi trường
const githubToken = process.env.GITHUB_TOKEN;
const repo = "OnToanAnhDuong/LuyenToan6";
const filePath = "data/progress.json";
const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

async function saveProgress(progressData) {
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3.raw',
            }
        });

        const existingData = await response.json();
        const sha = existingData.sha;  // Lấy sha của file để cập nhật

        const updatedData = {
            message: "Cập nhật tiến trình học sinh",
            content: btoa(JSON.stringify(progressData)),  // Mã hóa nội dung thành base64
            sha: sha,
        };

        const updateResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3.raw',
            },
            body: JSON.stringify(updatedData),
        });

        if (!updateResponse.ok) {
            throw new Error('Không thể lưu tiến trình học sinh');
        }

        console.log('✅ Tiến trình đã được lưu thành công!');
    } catch (error) {
        console.error('Lỗi khi lưu tiến trình:', error);
    }
}

module.exports = saveProgress;
