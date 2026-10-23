import { buildBoardView, } from "../services/houseCupBoardService.js";
import { HOUSE_CUP_HOME_BUTTON_ID, houseButtonId, } from "../services/houseCupService.js";
import { HOUSE_GRYFFINDOR, HOUSE_HUFFLEPUFF, HOUSE_RAVENCLAW, HOUSE_SLYTHERIN, } from "../utils/house.js";
/**
 * The House Cup board is a public, shared scoreboard - anyone can click
 * Home/a house button to switch what the message is showing, the same
 * way anyone can read the board itself. This intentionally updates the
 * message for everyone (interaction.update), not just the clicker; it's
 * a shared view, not a personal one. Posting/moving the board in the
 * first place still requires /house-cup, which is mods-only.
 */
export async function handleHouseCupBoardButton(interaction) {
    if (!interaction.guild) {
        return;
    }
    const view = interaction.customId ===
        HOUSE_CUP_HOME_BUTTON_ID
        ? "home"
        : interaction.customId ===
            houseButtonId(HOUSE_GRYFFINDOR)
            ? HOUSE_GRYFFINDOR
            : interaction.customId ===
                houseButtonId(HOUSE_RAVENCLAW)
                ? HOUSE_RAVENCLAW
                : interaction.customId ===
                    houseButtonId(HOUSE_HUFFLEPUFF)
                    ? HOUSE_HUFFLEPUFF
                    : interaction.customId ===
                        houseButtonId(HOUSE_SLYTHERIN)
                        ? HOUSE_SLYTHERIN
                        : null;
    if (!view) {
        return;
    }
    try {
        const payload = await buildBoardView(interaction.guild, view);
        await interaction.update(payload);
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ House Cup board button error:", error);
    }
}
