// Every macro the dashboard's "Insert Macro" button offers for bump
// reminder/thank-you messages, plus the human-readable description shown in
// that picker. Keep these two lists in sync with the macro lists in
// dashboard/public/js/bump-messages-editor.js - that file can't import this
// one (separate project/runtime), so it's duplicated there by hand for the
// preview.
//
// Reminders fire off a timer with no particular member attached (see
// bumpReminderHandler.ts), so they only get the guild-level macros. Thanks
// fire right after a successful /bump and usually do have a bumper - see
// BUMP_THANK_MACROS below.
export const BUMP_REMINDER_MACROS = [
    {
        token: "{servername}",
        description: "The server's name",
    },
    {
        token: "{membercount}",
        description: "Total member count for the server",
    },
    {
        token: "{time}",
        description: "Current time",
    },
    {
        token: "{date}",
        description: "Current date",
    },
];
export const BUMP_THANK_MACROS = [
    {
        token: "{user}",
        description: "Pings/mentions whoever ran /bump",
    },
    {
        token: "{username}",
        description: "The bumper's display name (no ping)",
    },
    {
        token: "{usertag}",
        description: "The bumper's full Discord username",
    },
    ...BUMP_REMINDER_MACROS,
];
/**
 * Replaces every {macro} placeholder in a string with its live value.
 * `bumper` is omitted for reminder messages (no member is associated with a
 * timer firing) and passed for thank-you messages when Discord told us who
 * ran the /bump (interactionMetadata is absent for older text-command
 * bumps) - the {user}/{username}/{usertag} macros fall back to generic text
 * rather than leaving the literal placeholder in the message when there's
 * no bumper to reference.
 */
export function resolveBumpMacros(text, guild, bumper) {
    if (!text) {
        return null;
    }
    const replacements = {
        "{servername}": guild.name,
        "{membercount}": guild.memberCount.toString(),
        "{time}": new Date().toLocaleTimeString(),
        "{date}": new Date().toLocaleDateString(),
        "{user}": bumper
            ? bumper.toString()
            : "Someone",
        "{username}": bumper
            ? bumper.username
            : "Someone",
        "{usertag}": bumper
            ? bumper.tag ?? bumper.username
            : "Someone",
    };
    let result = text;
    for (const [token, value,] of Object.entries(replacements)) {
        result = result.split(token).join(value);
    }
    return result;
}
