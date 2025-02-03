export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST method is allowed" });
    }

    const { studentId, progressData, completedExercises, averageScore } = req.body;
    if (!studentId || !progressData) {
        return res.status(400).json({ error: "Missing required data" });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const repo = "OnToanAnhDuong/LuyenToan6";
    const filePath = "data/progress.json";
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

    try {
        const fileResponse = await fetch(apiUrl, {
            headers: { Authorization: `token ${githubToken}` }
        });
        const fileData = await fileResponse.json();
        const sha = fileData.sha || null;

        let updatedProgress = fileData.content ? JSON.parse(atob(fileData.content)) : {};
        updatedProgress[studentId] = { progressData, completedExercises, averageScore };

        const updatedContent = Buffer.from(JSON.stringify(updatedProgress, null, 2)).toString("base64");

        const response = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                Authorization: `token ${githubToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Update progress for ${studentId}`,
                content: updatedContent,
                sha
            })
        });

        if (!response.ok) throw new Error("Failed to update progress");

        return res.status(200).json({ message: "Progress updated successfully" });
    } catch (error) {
        console.error("❌ Error saving progress:", error);
        return res.status(500).json({ error: "Failed to save progress" });
    }
}
