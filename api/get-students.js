export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Only GET method is allowed" });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const repo = "OnToanAnhDuong/LuyenToan6";
    const filePath = "data/students.json";
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

    try {
        const response = await fetch(apiUrl, {
            headers: { Authorization: `token ${githubToken}` }
        });

        if (!response.ok) {
            return res.status(404).json({ error: "Student data not found" });
        }

        const fileData = await response.json();
        const studentData = JSON.parse(atob(fileData.content));

        return res.status(200).json(studentData);
    } catch (error) {
        console.error("❌ Error loading student data:", error);
        return res.status(500).json({ error: "Failed to load student data" });
    }
}
