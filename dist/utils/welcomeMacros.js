// Every macro the dashboard's "Insert Macro" button offers, plus the
// human-readable description shown in that picker. Keep this list in sync
// with the macro list in dashboard/public/js/welcome-editor.js — that file
// can't import this one (separate project/runtime), so it's duplicated
// there by hand for the preview.
export const WELCOME_MACROS = [
    {
        token: "{user}",
        description: "Pings/mentions the new member",
    },
    {
        token: "{username}",
        description: "The new member's display name (no ping)",
    },
    {
        token: "{usertag}",
        description: "The new member's full Discord username",
    },
    {
        token: "{membercount}",
        description: "Total member count for the server",
    },
    {
        token: "{servername}",
        description: "The server's name",
    },
    {
        token: "{time}",
        description: "Current time (server's local time)",
    },
    {
        token: "{date}",
        description: "Current date",
    },
    {
        token: "{joindate}",
        description: "Date the member joined",
    },
];
// Replaces every {macro} placeholder in a string with its live value for
// this particular join event. Channel/role mentions (<#id>, <@&id>) are
// inserted verbatim by the dashboard's channel/role pickers and need no
// resolution here — Discord renders those natively.
export function resolveWelcomeMacros(text, member) {
    if (!text) {
        return null;
    }
    const now = member.joinedAt ??
        new Date();
    const replacements = {
        "{user}": member.toString(),
        "{username}": member.displayName,
        "{usertag}": member.user.tag,
        "{membercount}": member.guild.memberCount.toString(),
        "{servername}": member.guild.name,
        "{time}": new Date().toLocaleTimeString(),
        "{date}": new Date().toLocaleDateString(),
        "{joindate}": now.toLocaleDateString(),
    };
    let result = text;
    for (const [token, value,] of Object.entries(replacements)) {
        result = result.split(token).join(value);
    }
    return result;
}
