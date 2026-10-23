import { getRelevantQuote, getRandomQuote, getRandomGif, } from "@overandoutnerd/dumbledore-bot-core";
import { incrementMessage, incrementSummon, } from "../services/analyticsTracker.js";
import { isAiResponseEnabled, getAiResponseProbability, } from "../services/guildSettingsService.js";
import { getAiResponse, } from "../services/aiResponseService.js";
import { getNextGeminiApiKey } from "../utils/geminiKeyRotator.js";
const GIF_REPLY_CHANCE = 15;
function shouldReplyWithGif() {
    return (Math.random() * 100 <
        GIF_REPLY_CHANCE);
}
export async function handleMessage(message) {
    try {
        if (message.author.bot) {
            return;
        }
        if (message.guild) {
            incrementMessage(message.guild.id);
        }
        const botId = message.client.user?.id;
        if (!botId) {
            return;
        }
        const content = message.content.toLowerCase();
        const nameTrigger = content.includes("dumbledore") ||
            content.includes("albus");
        const mentionTrigger = message.mentions.users.has(botId);
        let replyTrigger = false;
        if (message.reference?.messageId) {
            try {
                const referencedMessage = await message.channel.messages.fetch(message.reference
                    .messageId);
                replyTrigger =
                    referencedMessage.author.id ===
                        botId;
            }
            catch (error) {
                console.error("[DumbledoreBot] ❌ Failed to fetch referenced message:", error);
            }
        }
        const shouldReply = nameTrigger ||
            mentionTrigger ||
            replyTrigger;
        if (!shouldReply) {
            return;
        }
        console.log(`[DumbledoreBot] ✨ Trigger detected in message ${message.id}`);
        const isDirectConversation = mentionTrigger ||
            replyTrigger;
        let prompt = message.content.trim();
        const mentionOnly = mentionTrigger &&
            message.content
                .replace(new RegExp(`<@!?${botId}>`, "g"), "")
                .trim()
                .length === 0;
        if (mentionOnly) {
            prompt =
                "Greetings, Professor Dumbledore.";
        }
        if (!isDirectConversation &&
            shouldReplyWithGif()) {
            const gifUrl = getRandomGif();
            console.log("[DumbledoreBot] 🎬 Replying with GIF");
            await message.reply(gifUrl);
            if (message.guild) {
                incrementSummon(message.guild.id);
            }
            return;
        }
        let aiEnabled = false;
        let aiProbability = 0;
        if (message.guild) {
            [
                aiEnabled,
                aiProbability,
            ] = await Promise.all([
                isAiResponseEnabled(message.guild
                    .id),
                getAiResponseProbability(message.guild
                    .id),
            ]);
        }
        const rolledAiResponse = aiEnabled &&
            Math.random() <
                aiProbability;
        let reply;
        if (rolledAiResponse) {
            try {
                reply =
                    await getAiResponse(prompt);
                console.log("[DumbledoreBot] 🪄 Replying with AI response");
            }
            catch (error) {
                console.error("[DumbledoreBot] ❌ AI response failed, falling back to quote:", error);
            }
        }
        if (!reply) {
            let quote;
            try {
                quote =
                    await getRelevantQuote(prompt, getNextGeminiApiKey());
                console.log("[DumbledoreBot] 🎯 Relevant quote found");
            }
            catch (error) {
                console.error("[DumbledoreBot] ❌ Quote search failed:", error);
                quote =
                    getRandomQuote();
                console.log("[DumbledoreBot] 🎲 Falling back to random quote");
            }
            reply = quote;
            console.log("[DumbledoreBot] 📜 Replying with quote");
        }
        await message.reply(reply);
        if (message.guild) {
            incrementSummon(message.guild.id);
        }
        console.log("[DumbledoreBot] ✅ Reply sent");
    }
    catch (error) {
        console.error("[DumbledoreBot] ❌ Handler error:", error);
    }
}
