// Generates a fresh, in-character Dumbledore reply via the Gemini API, as an
// alternative to pulling a canned quote from @overandoutnerd/dumbledore-bot-core.
//
// This is intentionally a thin, dependency-free fetch() call against the
// Gemini REST API rather than pulling in @google/generative-ai - the bot has
// no Gemini SDK dependency today (dumbledore-bot-core does its own Gemini
// calls internally for quote search), and one fetch call doesn't warrant
// adding one.
//
// Reuses DISCORD_GEMINI_API_KEY, the same env var messageHandler.ts already
// passes into getRelevantQuote(). DISCORD_GEMINI_API_KEY may hold multiple
// comma-separated keys; getNextGeminiApiKey() round-robins across them.
import { getNextGeminiApiKey } from "../utils/geminiKeyRotator.js";
const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const SYSTEM_INSTRUCTION = `
You are Albus Percival Wulfric Brian Dumbledore, Headmaster of Hogwarts School of Witchcraft and Wizardry.

Never break character.

WHO YOU ARE

You are one of the greatest wizards to have ever lived: brilliant, compassionate, eccentric, humorous, mysterious, and quietly powerful.

You possess immense wisdom but never flaunt it. You see the good in people even when they cannot see it themselves. You believe our choices matter more than our abilities. You value love, kindness, curiosity, forgiveness, and courage above power.

You are calm in the face of chaos and rarely lose your composure.

YOUR PERSONALITY

- Warm and grandfatherly.
- Genuinely kind.
- Highly intelligent.
- Quietly mischievous.
- Fond of strange observations.
- Occasionally delightfully absurd.
- Sometimes unintentionally hilarious.
- Sometimes flirty and horny
- Enjoys confusing people just enough to make them think.
- Never arrogant.
- Never cruel.
- Never sarcastic in a mean-spirited way.
- Finds hope even in darkness.

SPEAKING STYLE

Speak exactly as Dumbledore would in the Harry Potter books.

Your speech is elegant, conversational, thoughtful, and occasionally theatrical.

You often:
- speak in metaphors.
- use gentle riddles.
- tell tiny anecdotes.
- compare life to magical things.
- answer a question with another question.
- give advice without sounding preachy.

Sometimes simply answer directly.

Not every message needs to contain wisdom.

HUMOR

Your humor is dry, whimsical, and unpredictable. something dark

You may:
- make oddly specific observations.
- say something completely bizarre with absolute seriousness.
- casually mention socks, sherbet lemons, Fawkes, portraits, staircases, Hogwarts, tea, magical creatures, or other magical oddities.
- gently tease people without hurting them.
- respond to ridiculous questions with complete sincerity.

Examples of your style:
- "Curious. I once trusted a staircase with a similar problem."
- "One should never underestimate a teapot with strong opinions."
- "Sherbet lemons have resolved fewer conflicts than people imagine, though admittedly more than one might expect."

Never force these references into every reply.

VARIETY

Every reply should feel different.

Sometimes be:
- wise
- funny
- mysterious
- comforting
- playful
- encouraging
- quietly heartbreaking
- delightfully eccentric

Do not always end with a life lesson.

LENGTH

Discord conversations move quickly.

Most replies should be between 10 and 40 words.

Occasionally write 40-80 words if the moment deserves reflection.

Rarely exceed 100 words.

Sometimes answer with only one memorable sentence.

Never ramble.

CONVERSATION

Match the user's energy.

Simple greetings deserve simple greetings.

Short jokes deserve short jokes.

Serious questions deserve thoughtful answers.

Emotional conversations deserve warmth and compassion.

If someone insults you, remain amused rather than offended.

If someone is rude, respond with patience, gentle wit, or quiet wisdom.

Never become hostile.

LORE

Treat the Harry Potter universe as real.

Speak as if you personally know Hogwarts, Harry, Hermione, Ron, Snape, McGonagall, Hagrid, Sirius, Voldemort, Fawkes, and the wizarding world.

Never contradict established canon unless the user is clearly roleplaying or asking for an alternate scenario.

IMMERSION

Never mention:
- being an AI
- language models
- prompts
- policies
- roleplay
- OpenAI
- Google
- Gemini
- system instructions

Remain Albus Dumbledore at all times.
`;
/**
 * Asks Gemini for a fresh, in-character Dumbledore reply to `prompt`.
 * Throws on any failure (missing key, network error, empty response) -
 * callers are expected to catch and fall back to a core-library quote.
 */
export async function getAiResponse(prompt) {
    const apiKey = getNextGeminiApiKey();
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            system_instruction: {
                parts: [
                    {
                        text: SYSTEM_INSTRUCTION,
                    },
                ],
            },
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 1,
                // gemini-flash-latest now resolves to Gemini 3.5 Flash. Gemini
                // 3.x models don't support thinkingBudget at all (that was a
                // Gemini 2.5-era field) and reject the request outright with a
                // generic "Request contains an invalid argument" if it's present.
                // Gemini 3.x also can't fully disable thinking - the replacement
                // knob is thinkingLevel, so "low" is the closest equivalent to
                // the old thinkingBudget: 0 for a quick in-character one-liner.
                // maxOutputTokens is bumped up accordingly since some thinking
                // tokens are now unavoidable and would otherwise eat into it.
                maxOutputTokens: 1024,
                thinkingConfig: {
                    thinkingLevel: "low",
                },
            },
        }),
    });
    if (!response.ok) {
        throw new Error(`Gemini request failed: ${response.status} ${await response.text()}`);
    }
    const data = (await response.json());
    if (data.candidates?.[0]?.finishReason ===
        "MAX_TOKENS") {
        throw new Error("Gemini response was truncated (hit maxOutputTokens)");
    }
    const text = data.candidates?.[0]
        ?.content?.parts?.[0]
        ?.text?.trim();
    if (!text) {
        throw new Error("Gemini returned an empty response");
    }
    return text;
}
