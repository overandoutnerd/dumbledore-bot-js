import { mkdir, readdir, } from "node:fs/promises";
import { join, } from "node:path";
import { execFile, } from "node:child_process";
import { promisify, } from "node:util";
const execFileAsync = promisify(execFile);
const TEMP_DIRECTORY = "temp";
export async function downloadVideo(url) {
    await mkdir(TEMP_DIRECTORY, {
        recursive: true,
    });
    const beforeFiles = new Set(await readdir(TEMP_DIRECTORY));
    const outputTemplate = join(TEMP_DIRECTORY, "%(id)s.%(ext)s");
    const { stderr, } = await execFileAsync("yt-dlp", [
        "--no-playlist",
        "-o",
        outputTemplate,
        url,
    ]);
    const afterFiles = await readdir(TEMP_DIRECTORY);
    const downloadedFile = afterFiles.find((file) => !beforeFiles.has(file));
    if (!downloadedFile) {
        throw new Error(`Failed to locate downloaded file.\n${stderr}`);
    }
    return join(TEMP_DIRECTORY, downloadedFile);
}
