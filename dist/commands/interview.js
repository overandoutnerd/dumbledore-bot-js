import { ChannelType, EmbedBuilder, MessageFlags, PermissionFlagsBits, } from "discord.js";
import { EMBED_COLOR, } from "../config/constants.js";
import { areInterviewsEnabled, getBotManagerRoleIds, getInterviewCategory, } from "../services/guildSettingsService.js";
import { createInterview, getNextInterviewNumber, } from "../services/interviewService.js";
import { isBotManager, } from "../utils/permissions.js";
export async function interviewCommand(interaction) {
    if (!interaction.guild) {
        await interaction.reply({
            content: "❌ This command can only be used in a server.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const guild = interaction.guild;
    const moderator = await guild.members.fetch(interaction.user.id);
    if (!(await isBotManager(moderator))) {
        await interaction.reply({
            content: "❌ You do not have permission to use this command.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    if (!(await areInterviewsEnabled(guild.id))) {
        await interaction.reply({
            content: "❌ Interviews are not enabled for this server. Enable and configure the interview system from the dashboard first.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason");
    if (targetUser.bot) {
        await interaction.reply({
            content: "❌ You cannot interview a bot.",
            flags: [
                MessageFlags.Ephemeral,
            ],
        });
        return;
    }
    await interaction.deferReply({
        flags: [
            MessageFlags.Ephemeral,
        ],
    });
    const number = await getNextInterviewNumber(guild.id);
    const categoryId = await getInterviewCategory(guild.id);
    const category = categoryId
        ? guild.channels.cache.get(categoryId)
        : null;
    const parentId = category &&
        category.type ===
            ChannelType.GuildCategory
        ? category.id
        : undefined;
    const botManagerRoleIds = await getBotManagerRoleIds(guild.id);
    const botMember = await guild.members.fetchMe();
    const overwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [
                PermissionFlagsBits.ViewChannel,
            ],
        },
        {
            id: targetUser.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AddReactions,
            ],
        },
        {
            id: moderator.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages,
            ],
        },
        {
            id: botMember.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.EmbedLinks,
            ],
        },
        ...botManagerRoleIds.map((roleId) => ({
            id: roleId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
            ],
        })),
    ];
    const channel = await guild.channels.create({
        name: `interview-${number}`,
        type: ChannelType.GuildText,
        parent: parentId,
        topic: `Interview #${number} — ${targetUser.tag}${reason ? ` — ${reason}` : ""}`,
        permissionOverwrites: overwrites,
    });
    await createInterview(guild.id, number, channel.id, moderator.id, targetUser.id);
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(`🦉 Interview #${number}`)
        .setDescription(`${targetUser} has been brought in for an interview by ${moderator}.`)
        .addFields({
        name: "Interviewee",
        value: `${targetUser}`,
        inline: true,
    }, {
        name: "Interviewer",
        value: `${moderator}`,
        inline: true,
    })
        .setTimestamp();
    if (reason) {
        embed.addFields({
            name: "Reason",
            value: reason,
        });
    }
    embed.setFooter({
        text: "Run /close-interview in this channel when finished — a transcript will be saved automatically.",
    });
    await channel.send({
        content: `${targetUser}`,
        embeds: [
            embed,
        ],
    });
    await interaction.editReply({
        content: `✅ Interview channel created: ${channel}`,
    });
}
