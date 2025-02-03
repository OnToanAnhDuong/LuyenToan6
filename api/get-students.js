// api/get-students.js
const fetch = require('node-fetch');

// Lấy GITHUB_TOKEN từ biến môi trường
const githubToken = process.env.GITHUB_TOKEN;
const repo = "OnToanAnhDuong/LuyenToan6";
const filePath = "data/students.json";
const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

async function getStudentsData() {
    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3.raw',  // Đảm bảo trả về nội dung raw
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu học sinh từ GitHub');
        }

        const data = await response.json();
        const students = JSON.parse(atob(data.content));  // Giải mã nội dung base64

        return students;
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu học sinh:', error);
        return {};
    }
}

module.exports = getStudentsData;
