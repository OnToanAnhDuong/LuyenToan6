export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Only GET method is allowed" });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const repo = "OnToanAnhDuong/LuyenToan6";
    const filePath = "data/progress.json";
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

    try {
        const response = await fetch(apiUrl, {
            headers: { Authorization: `token ${githubToken}` }
        });

        if (!response.ok) {
            return res.status(404).json({ error: "Progress data not found" });
        }

        const fileData = await response.json();
        const progressData = JSON.parse(atob(fileData.content));

        return res.status(200).json(progressData);
    } catch (error) {
        console.error("❌ Error loading progress:", error);
        return res.status(500).json({ error: "Failed to load progress" });
    }
}
