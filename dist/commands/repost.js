import { unlink, } from "node:fs/promises";
import { downloadVideo, } from "../services/repostService.js";
export async function executeRepost(interaction) {
    const link = interaction.options.getString("link", true);
    await interaction.deferReply();
    let filePath = null;
    try {
        filePath =
            await downloadVideo(link);
        await interaction.editReply({
            files: [
                filePath,
            ],
        });
    }
    catch (error) {
        console.error("[DumbledoreBot] Repost error:", error);
        await interaction.editReply("❌ Failed to repost video.");
    }
    finally {
        if (filePath) {
            try {
                await unlink(filePath);
            }
            catch (error) {
                console.error("[DumbledoreBot] Failed to delete temp file:", error);
            }
        }
    }
}
