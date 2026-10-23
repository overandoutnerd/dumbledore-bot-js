export const EMBED_COLOR = 0xe46c32;
export const XP_PER_MESSAGE = 5;
export const XP_COOLDOWN_MS = 10_000;
export const STARBOARD_THRESHOLD = 1;
// Deprecated: used to be "points awarded directly to a house per star
// reaction" back when starring a message gave house points straight away.
// Star reactions now award XP (see STAR_XP_VALUE below) which flows into
// the House Cup average like any other XP. Left in place only so the
// existing house_point_value column/dashboard field doesn't dangle.
export const HOUSE_POINT_VALUE = 50;
// XP awarded to a message's author when someone reacts to it with ⭐
// (see starboardHandler.ts). Configurable per guild via
// guild_settings.star_xp_value.
export const STAR_XP_VALUE = 10;
export const STAR_EMOJI = "⭐";
// Minimum banked house XP a current house-role member needs before they
// count as a "contributing member" for the House Cup average denominator
// (see houseXpService.ts:getHouseContributorUserIds). Configurable per
// guild via guild_settings.min_xp_for_contributor.
export const MIN_XP_FOR_CONTRIBUTOR = 100;
// XP awarded to whoever ran a successful DISBOARD /bump (see
// bumpHandler.ts). Configurable per guild via guild_settings.bump_xp_value.
export const BUMP_XP_VALUE = 5;
