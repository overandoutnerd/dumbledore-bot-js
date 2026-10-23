import { MessageFlags, } from "discord.js";
import { executeSay, } from "../commands/say.js";
import { executeAnnounce, } from "../commands/announce.js";
import { executeProfile, } from "../commands/profile.js";
import { executeSortMe, } from "../commands/sortme.js";
import { executeLeaderboard, } from "../commands/leaderboard.js";
import { executeHouseCup, } from "../commands/houseCup.js";
import { executeHousePoints, } from "../commands/housePoints.js";
import { executeConfigureLogs, } from "../commands/configureLogs.js";
import { configureStarboardCommand, } from "../commands/configureStarboard.js";
import { configureHouseCupCommand, } from "../commands/configureHouseCup.js";
import { configureWelcomeCommand, } from "../commands/configureWelcome.js";
import { configureSortingHatCommand, } from "../commands/configureSortingHat.js";
import { configureModChannelsCommand, } from "../commands/configureModChannels.js";
import { configureBumpCommand, } from "../commands/configureBump.js";
import { executeConfigure, } from "../commands/configure.js";
import { executeConfigureAdmin, } from "../commands/configureAdmin.js";
import { handleHouseCupBoardButton, } from "../interactions/houseCup.js";
import { handleSayButton, handleSayModal, } from "../interactions/say.js";
import { handleAnnounceButton, handleAnnounceModal, } from "../interactions/announce.js";
import { handleSortMeButton, } from "../interactions/sortme.js";
import { handleConfigureButton, handleConfigureSelect, } from "../interactions/configure.js";
import { handleConfigureAdminButton, handleConfigureAdminSelect, handleConfigureAdminModal, } from "../interactions/configureAdmin.js";
import { executeDeluminator, } from "../commands/deluminator.js";
import { executeElderWand, } from "../commands/elderwand.js";
import { configureAzkabanCommand, } from "../commands/configureAzkaban.js";
import { sentenceCommand, } from "../commands/azkaban/sentence.js";
import { pardonCommand, } from "../commands/azkaban/pardon.js";
import { setAvatarCommand, } from "../commands/setAvatar.js";
import { resetAvatarCommand, } from "../commands/resetAvatar.js";
import { setBannerCommand, } from "../commands/setBanner.js";
import { resetBannerCommand, } from "../commands/resetBanner.js";
import { guildSettingsCommand, } from "../commands/guildSettings.js";
import { interviewCommand, } from "../commands/interview.js";
import { closeInterviewCommand, } from "../commands/closeInterview.js";
import { handleGuildSettingsButton, handleGuildSettingsModal, handleGuildSettingsRoleSelect, } from "../interactions/guildSettings.js";
import { incrementCommand, } from "../services/analyticsTracker.js";
export async function handleInteraction(interaction) {
    try {
        if (interaction.isChatInputCommand()) {
            if (interaction.guildId) {
                incrementCommand(interaction.guildId, interaction.commandName);
            }
            switch (interaction.commandName) {
                case "say":
                    await executeSay(interaction);
                    break;
                case "announce":
                    await executeAnnounce(interaction);
                    break;
                case "profile":
                    await executeProfile(interaction);
                    break;
                case "sortme":
                    await executeSortMe(interaction);
                    break;
                case "deluminator":
                    await executeDeluminator(interaction);
                    break;
                case "elderwand":
                    await executeElderWand(interaction);
                    break;
                case "leaderboard":
                    await executeLeaderboard(interaction);
                    break;
                case "house-cup":
                    await executeHouseCup(interaction);
                    break;
                case "house-points":
                    await executeHousePoints(interaction);
                    break;
                case "configure-starboard":
                    await configureStarboardCommand(interaction);
                    break;
                case "configure-house-cup":
                    await configureHouseCupCommand(interaction);
                    break;
                case "configure-welcome":
                    await configureWelcomeCommand(interaction);
                    break;
                case "configure-sorting-hat":
                    await configureSortingHatCommand(interaction);
                    break;
                case "configure-mod-channels":
                    await configureModChannelsCommand(interaction);
                    break;
                case "configure-bump":
                    await configureBumpCommand(interaction);
                    break;
                case "configure-logs":
                    await executeConfigureLogs(interaction);
                    break;
                case "configure-roles":
                    await executeConfigure(interaction);
                    break;
                case "manage-roles":
                    await executeConfigureAdmin(interaction);
                    break;
                case "configure-azkaban":
                    await configureAzkabanCommand(interaction);
                    break;
                case "sentence":
                    await sentenceCommand(interaction);
                    break;
                case "pardon":
                    await pardonCommand(interaction);
                    break;
                case "set-avatar":
                    await setAvatarCommand(interaction);
                    break;
                case "reset-avatar":
                    await resetAvatarCommand(interaction);
                    break;
                case "set-banner":
                    await setBannerCommand(interaction);
                    break;
                case "reset-banner":
                    await resetBannerCommand(interaction);
                    break;
                case "guild-settings":
                    await guildSettingsCommand(interaction);
                    break;
                case "interview":
                    await interviewCommand(interaction);
                    break;
                case "close-interview":
                    await closeInterviewCommand(interaction);
                    break;
                default:
                    await interaction.reply({
                        content: "❌ Unknown command.",
                        flags: [
                            MessageFlags.Ephemeral,
                        ],
                    });
            }
            return;
        }
        if (interaction.isButton()) {
            await handleSayButton(interaction);
            await handleAnnounceButton(interaction);
            await handleSortMeButton(interaction);
            await handleConfigureButton(interaction);
            await handleConfigureAdminButton(interaction);
            await handleGuildSettingsButton(interaction);
            await handleHouseCupBoardButton(interaction);
            return;
        }
        if (interaction.isRoleSelectMenu()) {
            await handleGuildSettingsRoleSelect(interaction);
            return;
        }
        if (interaction.isStringSelectMenu()) {
            await handleConfigureSelect(interaction);
            await handleConfigureAdminSelect(interaction);
            return;
        }
        if (interaction.isModalSubmit()) {
            await handleSayModal(interaction);
            await handleAnnounceModal(interaction);
            await handleConfigureAdminModal(interaction);
            await handleGuildSettingsModal(interaction);
            return;
        }
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Interaction error:", error);
        try {
            if (interaction.isRepliable() &&
                !interaction.replied &&
                !interaction.deferred) {
                await interaction.reply({
                    content: "❌ Something went wrong.",
                    flags: [
                        MessageFlags.Ephemeral,
                    ],
                });
            }
            else if (interaction.isRepliable()) {
                await interaction.editReply("❌ Something went wrong.");
            }
        }
        catch (replyError) {
            console.error("[DumbledoreBot] ❌ Failed sending error response:", replyError);
        }
    }
}
