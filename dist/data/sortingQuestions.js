import { House, } from "../utils/sorting.js";
export const SORTING_QUESTIONS = [
    {
        id: 1,
        question: "It's your first night at Hogwarts. After curfew, you spot a prefect sneaking into the forbidden section of the library.",
        answers: [
            {
                id: "A",
                label: "Follow them quietly — you want to know what's in there",
                scores: {
                    [House.GRYFFINDOR]: 3,
                    [House.RAVENCLAW]: 1,
                },
            },
            {
                id: "B",
                label: "Note the time and prefect, then go back to sleep",
                scores: {
                    [House.RAVENCLAW]: 3,
                    [House.SLYTHERIN]: 1,
                },
            },
            {
                id: "C",
                label: "Do nothing — it's not your business",
                scores: {
                    [House.HUFFLEPUFF]: 2,
                    [House.SLYTHERIN]: 1,
                },
            },
            {
                id: "D",
                label: "Report it in the morning. Rules apply to everyone",
                scores: {
                    [House.HUFFLEPUFF]: 3,
                    [House.GRYFFINDOR]: 1,
                },
            },
        ],
    },
    {
        id: 2,
        question: "Snape pairs you with your least favourite classmate for a potion. One wrong move from either of you and you both fail.",
        answers: [
            {
                id: "A",
                label: "Take control — you'd rather do extra work than risk their mistake",
                scores: {
                    [House.GRYFFINDOR]: 3,
                    [House.SLYTHERIN]: 1,
                },
            },
            {
                id: "B",
                label: "Split the steps cleanly so you barely have to rely on each other",
                scores: {
                    [House.RAVENCLAW]: 3,
                    [House.SLYTHERIN]: 1,
                },
            },
            {
                id: "C",
                label: "Make a real effort — maybe you've misjudged them",
                scores: {
                    [House.HUFFLEPUFF]: 3,
                    [House.GRYFFINDOR]: 1,
                },
            },
            {
                id: "D",
                label: "Do your part flawlessly so the blame lands correctly if it fails",
                scores: {
                    [House.SLYTHERIN]: 3,
                    [House.RAVENCLAW]: 1,
                },
            },
        ],
    },
    {
        id: 3,
        question: "You discover the Room of Requirement. It's given you exactly what you've always wanted. Nobody else knows it exists.",
        answers: [
            {
                id: "A",
                label: "Use it — you found it, you earned it",
                scores: {
                    [House.GRYFFINDOR]: 3,
                    [House.SLYTHERIN]: 1,
                },
            },
            {
                id: "B",
                label: "Tell your closest friends immediately",
                scores: {
                    [House.HUFFLEPUFF]: 3,
                    [House.GRYFFINDOR]: 1,
                },
            },
            {
                id: "C",
                label: "Figure out how it works before using it",
                scores: {
                    [House.RAVENCLAW]: 3,
                    [House.HUFFLEPUFF]: 1,
                },
            },
            {
                id: "D",
                label: "Consider carefully who else knowing this might benefit",
                scores: {
                    [House.SLYTHERIN]: 3,
                    [House.RAVENCLAW]: 1,
                },
            },
        ],
    },
    {
        id: 4,
        question: "It's OWL exam morning. A letter arrives from home. You can tell it's bad news.",
        answers: [
            {
                id: "A",
                label: "Open it now — you'd rather know",
                scores: {
                    [House.GRYFFINDOR]: 3,
                    [House.HUFFLEPUFF]: 1,
                },
            },
            {
                id: "B",
                label: "Leave it sealed until after the exam",
                scores: {
                    [House.SLYTHERIN]: 3,
                    [House.RAVENCLAW]: 1,
                },
            },
            {
                id: "C",
                label: "Ask a friend to sit with you when you open it",
                scores: {
                    [House.HUFFLEPUFF]: 3,
                    [House.GRYFFINDOR]: 1,
                },
            },
            {
                id: "D",
                label: "Open it, assess if it changes anything, feel it later",
                scores: {
                    [House.RAVENCLAW]: 3,
                    [House.SLYTHERIN]: 1,
                },
            },
        ],
    },
    {
        id: 5,
        question: "During a Quidditch match you spot the Snitch before anyone else — including your own Seeker.",
        answers: [
            {
                id: "A",
                label: "Dive for it yourself — someone has to",
                scores: {
                    [House.GRYFFINDOR]: 3,
                    [House.HUFFLEPUFF]: 1,
                },
            },
            {
                id: "B",
                label: "Signal your Seeker immediately and trust them",
                scores: {
                    [House.HUFFLEPUFF]: 3,
                    [House.RAVENCLAW]: 1,
                },
            },
            {
                id: "C",
                label: "Shout — the chaos might buy your team a moment",
                scores: {
                    [House.GRYFFINDOR]: 2,
                    [House.SLYTHERIN]: 2,
                },
            },
            {
                id: "D",
                label: "Stay quiet and see how it plays out",
                scores: {
                    [House.RAVENCLAW]: 3,
                    [House.SLYTHERIN]: 1,
                },
            },
        ],
    },
    {
        id: 6,
        question: "You find a library book filled with brilliant handwritten notes in the margins. The name inside reads Tom Riddle.",
        answers: [
            {
                id: "A",
                label: "Use the notes — remarkable knowledge shouldn't go to waste",
                scores: {
                    [House.SLYTHERIN]: 3,
                    [House.GRYFFINDOR]: 1,
                },
            },
            {
                id: "B",
                label: "Hand it to a professor immediately",
                scores: {
                    [House.HUFFLEPUFF]: 3,
                    [House.GRYFFINDOR]: 1,
                },
            },
            {
                id: "C",
                label: "Find out who Tom Riddle was before deciding anything",
                scores: {
                    [House.RAVENCLAW]: 3,
                    [House.HUFFLEPUFF]: 1,
                },
            },
            {
                id: "D",
                label: "Keep it quietly. You're not sure what it means yet",
                scores: {
                    [House.SLYTHERIN]: 3,
                    [House.RAVENCLAW]: 1,
                },
            },
        ],
    },
    {
        id: 7,
        question: "A younger student asks you to teach them a spell that's above their level. Not forbidden — just risky if they get it wrong.",
        answers: [
            {
                id: "A",
                label: "Teach them carefully with every precaution",
                scores: {
                    [House.HUFFLEPUFF]: 3,
                    [House.RAVENCLAW]: 1,
                },
            },
            {
                id: "B",
                label: "Tell them to master the basics first",
                scores: {
                    [House.RAVENCLAW]: 3,
                    [House.HUFFLEPUFF]: 1,
                },
            },
            {
                id: "C",
                label: "Decline — you'd feel responsible if something went wrong",
                scores: {
                    [House.HUFFLEPUFF]: 3,
                    [House.SLYTHERIN]: 1,
                },
            },
            {
                id: "D",
                label: "Agree, but only if they prove they can handle it",
                scores: {
                    [House.RAVENCLAW]: 3,
                    [House.SLYTHERIN]: 1,
                },
            },
        ],
    },
    {
        id: 8,
        question: "Your DADA professor sets an impossible assignment due tomorrow. The whole class is panicking.",
        answers: [
            {
                id: "A",
                label: "Start immediately — partial credit beats nothing",
                scores: {
                    [House.GRYFFINDOR]: 3,
                    [House.RAVENCLAW]: 1,
                },
            },
            {
                id: "B",
                label: "Spend an hour finding the fastest route through it",
                scores: {
                    [House.SLYTHERIN]: 3,
                    [House.RAVENCLAW]: 1,
                },
            },
            {
                id: "C",
                label: "Organise a study group and split the work",
                scores: {
                    [House.HUFFLEPUFF]: 3,
                    [House.GRYFFINDOR]: 1,
                },
            },
            {
                id: "D",
                label: "Write to the professor explaining why the deadline is unreasonable",
                scores: {
                    [House.RAVENCLAW]: 3,
                    [House.GRYFFINDOR]: 1,
                },
            },
        ],
    },
    {
        id: 9,
        question: "In Hogsmeade you overhear two older students planning something risky. They haven't noticed you.",
        answers: [
            {
                id: "A",
                label: "Keep walking — not your problem yet",
                scores: {
                    [House.SLYTHERIN]: 2,
                    [House.RAVENCLAW]: 1,
                },
            },
            {
                id: "B",
                label: "Linger and listen until you understand what they're planning",
                scores: {
                    [House.RAVENCLAW]: 3,
                    [House.SLYTHERIN]: 1,
                },
            },
            {
                id: "C",
                label: "Walk over and ask if everything's alright",
                scores: {
                    [House.GRYFFINDOR]: 3,
                    [House.HUFFLEPUFF]: 1,
                },
            },
            {
                id: "D",
                label: "Remember exactly who they were and what they said",
                scores: {
                    [House.SLYTHERIN]: 3,
                    [House.RAVENCLAW]: 1,
                },
            },
        ],
    },
    {
        id: 10,
        question: "Final task of a tournament. You reach the prize at the same moment as a rival who competed fairly the whole way.",
        answers: [
            {
                id: "A",
                label: "Grab it — you've both earned it but only one can win",
                scores: {
                    [House.SLYTHERIN]: 3,
                    [House.GRYFFINDOR]: 1,
                },
            },
            {
                id: "B",
                label: "Suggest you both touch it together",
                scores: {
                    [House.HUFFLEPUFF]: 3,
                    [House.GRYFFINDOR]: 1,
                },
            },
            {
                id: "C",
                label: "Step back and let them take it",
                scores: {
                    [House.HUFFLEPUFF]: 3,
                    [House.RAVENCLAW]: 1,
                },
            },
            {
                id: "D",
                label: "Offer to share, but stay ready to take it alone if they hesitate",
                scores: {
                    [House.SLYTHERIN]: 3,
                    [House.GRYFFINDOR]: 1,
                },
            },
        ],
    },
];
