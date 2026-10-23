// import dotenv from "dotenv";
// dotenv.config({
//    override: true,
//});
import { saveMember, } from "./services/memberHistoryService.js";
import { Client, GatewayIntentBits, Partials, PermissionFlagsBits, SlashCommandBuilder, } from "discord.js";
import { handleMessage, } from "./handlers/messageHandler.js";
import { handleHouseCupMessageXp, } from "./handlers/houseCupXpHandler.js";
import { handleBump, } from "./handlers/bumpHandler.js";
import { startBumpReminderChecker, } from "./handlers/bumpReminderHandler.js";
import { handleMemberJoin, } from "./handlers/memberJoinHandler.js";
import { handleInteraction, } from "./handlers/interactionHandler.js";
import { handleStarReactionAdd, handleStarReactionRemove, } from "./handlers/starboardHandler.js";
import { handleMessageDelete, handleMessageUpdate, } from "./handlers/logs/messageLogHandler.js";
import { handleMemberJoinLog, handleMemberLeaveLog, } from "./handlers/logs/memberLogHandler.js";
import { handleRoleUpdateLog, } from "./handlers/logs/roleLogHandler.js";
import { handleBulkDeleteLog, } from "./handlers/logs/bulkDeleteLogHandler.js";
import { handleBanLog, handleUnbanLog, } from "./handlers/logs/banLogHandler.js";
import { handleAzkabanRoleUpdate, } from "./handlers/azkabanRoleUpdateHandler.js";
import { startAnalyticsScheduler, flushOnShutdown, } from "./services/analyticsScheduler.js";
import { startHouseCupBoardScheduler, } from "./services/houseCupBoardScheduler.js";
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
});
client.once("clientReady", async () => {
    console.log(`🧙 Logged in as ${client.user?.tag}`);
    for (const guild of client.guilds.cache.values()) {
        console.log(`[DumbledoreBot] 📚 Backfilling members for ${guild.name}...`);
        const members = await guild.members.fetch();
        let added = 0;
        for (const member of members.values()) {
            if (member.user.bot) {
                continue;
            }
            if (!member.joinedTimestamp) {
                continue;
            }
            saveMember(guild.id, member.id, member.joinedTimestamp);
            added++;
        }
        console.log(`[DumbledoreBot] 📚 Processed ${added} members.`);
    }
    startBumpReminderChecker(client);
    startAnalyticsScheduler(client);
    startHouseCupBoardScheduler(client);
    try {
        await client.application?.commands.set([
            new SlashCommandBuilder()
                .setName("say")
                .setDescription("Speak through Dumbledore")
                .addStringOption((option) => option
                .setName("message")
                .setDescription("Message to send")
                .setRequired(true))
                .addAttachmentOption((option) => option
                .setName("media")
                .setDescription("Optional image or file")
                .setRequired(false))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("announce")
                .setDescription("Create an announcement embed")
                .addStringOption((option) => option
                .setName("title")
                .setDescription("Embed title")
                .setRequired(true))
                .addStringOption((option) => option
                .setName("body")
                .setDescription("Embed body")
                .setRequired(true))
                .addStringOption((option) => option
                .setName("message")
                .setDescription("Optional message outside the embed")
                .setRequired(false))
                .addAttachmentOption((option) => option
                .setName("media")
                .setDescription("Optional image")
                .setRequired(false))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("profile")
                .setDescription("View your profile")
                .toJSON(),
            new SlashCommandBuilder()
                .setName("sortme")
                .setDescription("Let the Sorting Hat decide your house")
                .toJSON(),
            new SlashCommandBuilder()
                .setName("deluminator")
                .setDescription("Find a user's most recent message.")
                .addUserOption((option) => option
                .setName("user")
                .setDescription("The user to locate")
                .setRequired(true))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("elderwand")
                .setDescription("Reveal the oldest witches and wizards of the castle")
                .toJSON(),
            new SlashCommandBuilder()
                .setName("leaderboard")
                .setDescription("View the server leaderboard")
                .toJSON(),
            new SlashCommandBuilder()
                .setName("house-cup")
                .setDescription("Mods only: post/update the House Cup board in its configured channel")
                .toJSON(),
            new SlashCommandBuilder()
                .setName("configure-house-cup")
                .setDescription("Configure the House Cup system")
                .addBooleanOption(option => option
                .setName("enabled")
                .setDescription("Enable or disable House Cup XP (chatting + star reactions)")
                .setRequired(true))
                .addChannelOption(option => option
                .setName("channel")
                .setDescription("Channel where the live House Cup standings board is posted")
                .setRequired(false))
                .addChannelOption(option => option
                .setName("logs_channel")
                .setDescription("Channel where manual bonus-point awards are logged")
                .setRequired(false))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("house-points")
                .setDescription("Mods only: award or deduct House Cup bonus points")
                .addStringOption(option => option
                .setName("house")
                .setDescription("Which house")
                .setRequired(true)
                .addChoices({
                name: "Gryffindor",
                value: "gryffindor",
            }, {
                name: "Ravenclaw",
                value: "ravenclaw",
            }, {
                name: "Hufflepuff",
                value: "hufflepuff",
            }, {
                name: "Slytherin",
                value: "slytherin",
            }))
                .addIntegerOption(option => option
                .setName("amount")
                .setDescription("Points to award (negative to deduct)")
                .setRequired(true))
                .addStringOption(option => option
                .setName("reason")
                .setDescription("Why these points are being awarded/deducted")
                .setRequired(true))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("configure-starboard")
                .setDescription("Configure the starboard system")
                .addBooleanOption(option => option
                .setName("enabled")
                .setDescription("Enable or disable the starboard")
                .setRequired(true))
                .addChannelOption(option => option
                .setName("channel")
                .setDescription("Channel where starred messages will be posted")
                .setRequired(false))
                .addIntegerOption(option => option
                .setName("threshold")
                .setDescription("Number of ⭐ reactions needed to hit the starboard")
                .setMinValue(1)
                .setRequired(false))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("configure-welcome")
                .setDescription("Configure the welcome system")
                .addBooleanOption(option => option
                .setName("enabled")
                .setDescription("Enable or disable welcome messages")
                .setRequired(true))
                .addChannelOption(option => option
                .setName("channel")
                .setDescription("Channel where welcome messages will be sent")
                .setRequired(false))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("configure-sorting-hat")
                .setDescription("Configure the Sorting Hat system")
                .addBooleanOption(option => option
                .setName("enabled")
                .setDescription("Enable or disable the Sorting Hat")
                .setRequired(true))
                .addChannelOption(option => option
                .setName("channel")
                .setDescription("Channel where Sorting Hat results will be posted")
                .setRequired(false))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("configure-bump")
                .setDescription("Configure the bump Thank System (thank-you message + bump reminder)")
                .addBooleanOption(option => option
                .setName("enabled")
                .setDescription("Enable or disable the Thank System")
                .setRequired(true))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("configure-mod-channels")
                .setDescription("Manage Deluminator's mod-only channel list")
                .addStringOption(option => option
                .setName("action")
                .setDescription("Add, remove, or list mod channels")
                .setRequired(true)
                .addChoices({
                name: "add",
                value: "add",
            }, {
                name: "remove",
                value: "remove",
            }, {
                name: "list",
                value: "list",
            }))
                .addChannelOption(option => option
                .setName("channel")
                .setDescription("The channel to add or remove (not needed for list)")
                .setRequired(false))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("configure-logs")
                .setDescription("Configure the server logging system")
                .addBooleanOption(option => option
                .setName("enabled")
                .setDescription("Enable or disable logging")
                .setRequired(true))
                .addChannelOption(option => option
                .setName("channel")
                .setDescription("Channel where logs will be sent")
                .setRequired(false))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("configure-roles")
                .setDescription("Configure your roles")
                .toJSON(),
            new SlashCommandBuilder()
                .setName("manage-roles")
                .setDescription("Open the role manager dashboard")
                .toJSON(),
            new SlashCommandBuilder()
                .setName("configure-azkaban")
                .setDescription("Configure the Azkaban prison system")
                .addBooleanOption(option => option
                .setName("enabled")
                .setDescription("Enable or disable Azkaban")
                .setRequired(true))
                .addRoleOption(option => option
                .setName("role")
                .setDescription("The Azkaban Prisoner role")
                .setRequired(false))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("sentence")
                .setDescription("Send a member to Azkaban")
                .addUserOption(option => option
                .setName("user")
                .setDescription("The prisoner")
                .setRequired(true))
                .addStringOption(option => option
                .setName("reason")
                .setDescription("Reason for the sentence")
                .setRequired(true))
                .addAttachmentOption(option => option
                .setName("media")
                .setDescription("Optional image or GIF")
                .setRequired(false))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("pardon")
                .setDescription("Release a prisoner from Azkaban")
                .addUserOption(option => option
                .setName("user")
                .setDescription("The prisoner to release")
                .setRequired(true))
                .addAttachmentOption(option => option
                .setName("media")
                .setDescription("Optional image or GIF")
                .setRequired(false))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("set-avatar")
                .setDescription("Set the bot avatar for this server")
                .addAttachmentOption(option => option
                .setName("image")
                .setDescription("Avatar image")
                .setRequired(true))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("reset-avatar")
                .setDescription("Reset the bot avatar for this server")
                .toJSON(),
            new SlashCommandBuilder()
                .setName("set-banner")
                .setDescription("Set the bot banner for this server")
                .addAttachmentOption(option => option
                .setName("image")
                .setDescription("Banner image")
                .setRequired(true))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("reset-banner")
                .setDescription("Reset the bot banner for this server")
                .toJSON(),
            new SlashCommandBuilder()
                .setName("guild-settings")
                .setDescription("Open the dashboard to configure server-specific bot settings")
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
                .toJSON(),
            new SlashCommandBuilder()
                .setName("interview")
                .setDescription("Open a temporary channel to interview a member")
                .addUserOption(option => option
                .setName("user")
                .setDescription("The member to interview")
                .setRequired(true))
                .addStringOption(option => option
                .setName("reason")
                .setDescription("Optional reason shown in the channel topic")
                .setRequired(false))
                .toJSON(),
            new SlashCommandBuilder()
                .setName("close-interview")
                .setDescription("Close this interview, saving a transcript and deleting the channel")
                .toJSON(),
        ]);
        console.log("✅ Slash commands registered");
    }
    catch (error) {
        console.error("❌ Failed to register commands:", error);
    }
});
client.on("guildMemberAdd", async (member) => {
    await handleMemberJoin(member);
    await handleMemberJoinLog(member);
});
client.on("guildMemberRemove", handleMemberLeaveLog);
client.on("messageCreate", handleMessage);
client.on("messageCreate", handleHouseCupMessageXp);
client.on("messageCreate", handleBump);
client.on("interactionCreate", handleInteraction);
client.on("messageReactionAdd", handleStarReactionAdd);
client.on("messageReactionRemove", handleStarReactionRemove);
client.on("messageDelete", handleMessageDelete);
client.on("messageUpdate", handleMessageUpdate);
client.on("guildMemberUpdate", async (oldMember, newMember) => {
    await handleRoleUpdateLog(oldMember, newMember);
    await handleAzkabanRoleUpdate(oldMember, newMember);
});
client.on("messageDeleteBulk", handleBulkDeleteLog);
client.on("guildBanAdd", handleBanLog);
client.on("guildBanRemove", handleUnbanLog);
for (const signal of [
    "SIGINT",
    "SIGTERM",
]) {
    process.on(signal, () => {
        console.log(`[DumbledoreBot] 🛑 ${signal} received, flushing analytics before exit...`);
        flushOnShutdown()
            .catch((error) => {
            console.error("[DumbledoreBot] ❌ Shutdown flush failed:", error);
        })
            .finally(() => {
            process.exit(0);
        });
    });
}
client.login(process.env.DISCORD_TOKEN);
