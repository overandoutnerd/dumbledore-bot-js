import { getHouseRoleId as getGuildHouseRoleId, getAllHouseRoleIds as getAllGuildHouseRoleIds, } from "../services/guildSettingsService.js";
export var House;
(function (House) {
    House["GRYFFINDOR"] = "gryffindor";
    House["RAVENCLAW"] = "ravenclaw";
    House["HUFFLEPUFF"] = "hufflepuff";
    House["SLYTHERIN"] = "slytherin";
})(House || (House = {}));
export const HOUSE_EMOJIS = {
    [House.GRYFFINDOR]: "🦁",
    [House.RAVENCLAW]: "🦅",
    [House.HUFFLEPUFF]: "🦡",
    [House.SLYTHERIN]: "🐍",
};
export const HOUSE_NAMES = {
    [House.GRYFFINDOR]: "Gryffindor",
    [House.RAVENCLAW]: "Ravenclaw",
    [House.HUFFLEPUFF]: "Hufflepuff",
    [House.SLYTHERIN]: "Slytherin",
};
export const HOUSE_DESCRIPTIONS = {
    [House.GRYFFINDOR]: [
        "You might belong in Gryffindor,",
        "where dwell the brave at heart,",
        "their daring, nerve and chivalry",
        "set Gryffindors apart.",
    ].join("\n"),
    [House.RAVENCLAW]: [
        "Or yet in wise old Ravenclaw,",
        "if you've a ready mind,",
        "where those of wit and learning",
        "will always find their kind.",
    ].join("\n"),
    [House.HUFFLEPUFF]: [
        "You might belong in Hufflepuff,",
        "where they are just and loyal,",
        "those patient Hufflepuffs are true",
        "and unafraid of toil.",
    ].join("\n"),
    [House.SLYTHERIN]: [
        "Or perhaps in Slytherin,",
        "you'll make your real friends,",
        "those cunning folk use any means",
        "to achieve their ends.",
    ].join("\n"),
};
export function createEmptyScores() {
    return {
        gryffindor: 0,
        ravenclaw: 0,
        hufflepuff: 0,
        slytherin: 0,
    };
}
export function getHouseName(house) {
    return HOUSE_NAMES[house];
}
export function getHouseEmoji(house) {
    return HOUSE_EMOJIS[house];
}
export function getHouseDescription(house) {
    return HOUSE_DESCRIPTIONS[house];
}
export function determineHouse(scores) {
    const houses = [
        {
            house: House.GRYFFINDOR,
            score: scores.gryffindor,
        },
        {
            house: House.RAVENCLAW,
            score: scores.ravenclaw,
        },
        {
            house: House.HUFFLEPUFF,
            score: scores.hufflepuff,
        },
        {
            house: House.SLYTHERIN,
            score: scores.slytherin,
        },
    ];
    houses.sort((a, b) => b.score -
        a.score);
    return houses[0]
        .house;
}
export function addHouseScore(scores, house, points) {
    switch (house) {
        case House.GRYFFINDOR:
            scores.gryffindor +=
                points;
            break;
        case House.RAVENCLAW:
            scores.ravenclaw +=
                points;
            break;
        case House.HUFFLEPUFF:
            scores.hufflepuff +=
                points;
            break;
        case House.SLYTHERIN:
            scores.slytherin +=
                points;
            break;
    }
}
export function getHouseRanking(scores) {
    return [
        {
            house: House.GRYFFINDOR,
            score: scores.gryffindor,
        },
        {
            house: House.RAVENCLAW,
            score: scores.ravenclaw,
        },
        {
            house: House.HUFFLEPUFF,
            score: scores.hufflepuff,
        },
        {
            house: House.SLYTHERIN,
            score: scores.slytherin,
        },
    ].sort((a, b) => b.score -
        a.score);
}
export async function getHouseRoleId(guildId, house) {
    return getGuildHouseRoleId(guildId, house);
}
export async function getAllHouseRoleIds(guildId) {
    return getAllGuildHouseRoleIds(guildId);
}
