import {createInterface} from "node:readline/promises";
import {stdin as input, stdout as output} from "node:process";

const tileSet = {
    big: {
        limbs: ["||", "O", "8"],
        head: ["()"],
        eyes: ["o"]
    },
    small: {
        limbs: ["|", "."],
        head: ["o"],
        eyes: ["."]
    }
}


type AlleleId = string;
type GeneSlotId = string;

type AllelePair = [AlleleId, AlleleId];
type Genome = Record<GeneSlotId, AllelePair>;

type Creature = {
    id: number;
    generation: number;
    genome: Genome;
    renderedCreature: string[][];
};

type AlleleDefinition = {
    id: AlleleId;
    dominance: number;
    effects: statEffect[];
};

type statEffect = {
    type: string;
    min: number;
    max: number;
    rolls: number;
}

const allelesByGeneSlot: Record<GeneSlotId, AlleleDefinition[]> = {
    skeleton: [
        {
            id: "longSkinny",
            dominance: 1,
            effects: [
                {
                    type: "width",
                    min: 1,
                    rolls: 1,
                    max: 9
                },
                {
                    type: "height",
                    min: 9,
                    rolls: 3,
                    max: 15
                }
            ]
        },
        {
            id: "bigWide",
            dominance: 1,
            effects: [
                {
                    type: "width",
                    min: 9,
                    rolls: 3,
                    max: 15
                },
                {
                    type: "height",
                    min: 9,
                    rolls: 3,
                    max: 15
                },
            ]
        },
        {
            id: "average",
            dominance: 2,
            effects: [
                {
                    type: "width",
                    min: 5,
                    rolls: 1,
                    max: 9
                },
                {
                    type: "height",
                    min: 5,
                    rolls: 1,
                    max: 9
                }
            ]
        },
        {
            id: "tiny",
            dominance: 3,
            effects: [
                {
                    type: "width",
                    min: 1,
                    rolls: 1,
                    max: 8
                },
                {
                    type: "height",
                    min: 1,
                    rolls: 1,
                    max: 8
                }
            ]
        }
    ],
}


function generateRandomGenome(): Genome {

    const skeletonAlleleCount = allelesByGeneSlot.skeleton.length;

    return {
        skeleton: [allelesByGeneSlot.skeleton[Math.floor(Math.random() * skeletonAlleleCount)].id, allelesByGeneSlot.skeleton[Math.floor(Math.random() * skeletonAlleleCount)].id]
    }
}

function rollStat(stat:{min: number, max: number, rolls: number}): number {
    const values = [];
    for (let i = 0; i < stat.rolls; i++) {
        values.push(Math.floor(Math.random() * (stat.max - stat.min + 1)) + stat.min);
    }
    return Math.max(...values);
}

function processStatFromAllelePair(pair: AllelePair, geneSlot: string, stat: string): {
    min: number,
    max: number,
    rolls: number
} {
    const allele1 = allelesByGeneSlot[geneSlot].find(x => x.id === pair[0]);
    const allele2 = allelesByGeneSlot[geneSlot].find(x => x.id === pair[1]);

    if (!allele1 || !allele2) {
        return {
            min: 0,
            rolls: 0,
            max: 0
        }
    }
    const min1 = allele1.effects.find(x => x.type === stat)?.min || 0;
    const max1 = allele1.effects.find(x => x.type === stat)?.max || 0;
    const rolls1 = allele1.effects.find(x => x.type === stat)?.rolls || 0;
    const min2 = allele2.effects.find(x => x.type === stat)?.min || 0;
    const max2 = allele2.effects.find(x => x.type === stat)?.max || 0;
    const rolls2 = allele2.effects.find(x => x.type === stat)?.rolls || 0;


    if (allele1.dominance === allele2.dominance) {
        return {
            min: Math.floor((min1 + min2) / 2),
            rolls: Math.floor((rolls1 + rolls2) / 2),
            max: Math.floor((max1 + max2) / 2)
        }
    }
    if (allele1.dominance > allele2.dominance) {
        return {
            min: min1,
            rolls: rolls1,
            max: max1
        }
    }
    return {
        min: min2,
        rolls: rolls2,
        max: max2
    }
}

function renderCreature(genome: Genome): string[][] {
    const widthStat = processStatFromAllelePair(
        genome.skeleton,
        "skeleton",
        "width"
    );

    const heightStat = processStatFromAllelePair(
        genome.skeleton,
        "skeleton",
        "height"
    );

    const width = rollStat(widthStat);
    const height = rollStat(heightStat);

    return Array.from(
        { length: height },
        () => Array.from({ length: width }, () => "0")
    );
}


function generateRandomCreature(): Creature {

    const genome = generateRandomGenome();

    return {
        id: Math.floor(Math.random() * 1000000),
        generation: 0,
        genome: genome,
        renderedCreature: renderCreature(genome)
    }
}


for (let i = 0; i < 10; i++) {
    const creature = generateRandomCreature();
    console.log("+++++++++++++++++++++"+creature.genome.skeleton[0]+" "+creature.genome.skeleton[1]+"+++++++++++++++++++");
    console.log(creature.renderedCreature.map(row => row.join("")).join("\n"));
}