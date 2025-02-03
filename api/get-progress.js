// api/get-progress.js
const fetch = require('node-fetch');

// Lấy GITHUB_TOKEN từ biến môi trường
const githubToken = process.env.GITHUB_TOKEN;
const repo = "OnToanAnhDuong/LuyenToan6";
const filePath = "data/progress.json";
const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

async function getProgressData() {
    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3.raw',
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu tiến trình từ GitHub');
        }

        const data = await response.json();
        const progressData = JSON.parse(atob(data.content));

        return progressData;
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu tiến trình:', error);
        return {};
    }
}

module.exports = getProgressData;
