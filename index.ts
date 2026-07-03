import {createInterface} from "node:readline/promises";
import {stdin as input, stdout as output} from "node:process";

const ISDEV = process.argv.includes("--dev");

type AlleleId = string;
type LocusId = string;

type AllelePair = [AlleleId, AlleleId];
type Genome = Record<LocusId, AllelePair>;

type Creature = {
    id: string;
    generation: number;
    genome: Genome;
    traits: Traits;
    stats: Stats;
};

type Traits = {
    muscle: number;
    bone: number;
    speed: number;
    perception: number;
    foodConsumption: number;
    mutations: string[];
};

type Stats = {
    attack: number;
    defense: number;
    speed: number;
    foresight: number;
};

type AlleleDefinition = {
    id: AlleleId;
    name: string;
    effects: Partial<Omit<Traits, "mutations">>;
    dominance: number;
    mutation?: string;
};

type LocusDefinition = {
    id: LocusId;
    name: string;
    alleles: AlleleId[];
};

const loci: LocusDefinition[] = [
    {
        id: "muscleGrowth",
        name: "Muscle Growth",
        alleles: ["weakMuscle", "normalMuscle", "strongMuscle"],
    },
    {
        id: "boneDensity",
        name: "Bone Density",
        alleles: ["lightBones", "normalBones", "denseBones"],
    },
    {
        id: "metabolism",
        name: "Metabolism",
        alleles: ["slowMetabolism", "normalMetabolism", "fastMetabolism"],
    },
    {
        id: "eyeDevelopment",
        name: "Eye Development",
        alleles: ["normalEyes", "thirdEye", "noEyes"],
    },
];

const alleleDefinitions: Record<AlleleId, AlleleDefinition> = {
    weakMuscle: {
        id: "weakMuscle",
        name: "Weak Muscle",
        effects: {muscle: -2, foodConsumption: -1},
        dominance: 1,
    },
    normalMuscle: {
        id: "normalMuscle",
        name: "Normal Muscle",
        effects: {muscle: 0},
        dominance: 1,
    },
    strongMuscle: {
        id: "strongMuscle",
        name: "Strong Muscle",
        effects: {muscle: 3, foodConsumption: 2},
        dominance: 1,
    },
    lightBones: {
        id: "lightBones",
        name: "Light Bones",
        effects: {bone: -2, speed: 2},
        dominance: 1,
    },
    normalBones: {
        id: "normalBones",
        name: "Normal Bones",
        effects: {bone: 0},
        dominance: 1,
    },
    denseBones: {
        id: "denseBones",
        name: "Dense Bones",
        effects: {bone: 3, speed: -1, foodConsumption: 1},
        dominance: 1,
    },
    slowMetabolism: {
        id: "slowMetabolism",
        name: "Slow Metabolism",
        effects: {speed: -1, foodConsumption: -2},
        dominance: 1,
    },
    normalMetabolism: {
        id: "normalMetabolism",
        name: "Normal Metabolism",
        effects: {},
        dominance: 1,
    },
    fastMetabolism: {
        id: "fastMetabolism",
        name: "Fast Metabolism",
        effects: {speed: 3, foodConsumption: 3},
        dominance: 1,
    },
    normalEyes: {
        id: "normalEyes",
        name: "Normal Eyes",
        effects: {perception: 0},
        dominance: 5,
    },
    thirdEye: {
        id: "thirdEye",
        name: "Third Eye",
        effects: {perception: 5, foodConsumption: 1},
        mutation: "Third Eye",
        dominance: 1,
    },
    noEyes: {
        id: "noEyes",
        name: "No Eyes",
        effects: {perception: -5},
        mutation: "No Eyes",
        dominance: 9,
    },
};

function randomFrom<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function createRandomGenome(): Genome {
    const genome: Genome = {};

    for (const locus of loci) {
        genome[locus.id] = [
            randomFrom(locus.alleles),
            randomFrom(locus.alleles),
        ];
    }

    return genome;
}

function breedGenomes(parentA: Genome, parentB: Genome): Genome {
    const child: Genome = {};

    for (const locus of loci) {
        child[locus.id] = [
            randomFrom(parentA[locus.id]),
            randomFrom(parentB[locus.id]),
        ];
    }

    return child;
}

function expressGenome(genome: Genome): Traits {
    const traits: Traits = {
        muscle: 0,
        bone: 0,
        speed: 0,
        perception: 0,
        foodConsumption: 5,
        mutations: [],
    };

    function applyTraits(definition: AlleleDefinition): void {
        for (const [trait, value] of Object.entries(definition.effects)) {
            traits[trait as keyof Omit<Traits, "mutations">] += value;
        }

        if (definition.mutation && !traits.mutations.includes(definition.mutation)) {
            traits.mutations.push(definition.mutation);
        }
    }

    for (const allelePair of Object.values(genome)) {
        const allele1 = alleleDefinitions[allelePair[0]];
        const allele2 = alleleDefinitions[allelePair[1]];

        if (allele1.dominance > allele2.dominance) {
            applyTraits(allele1);
        } else if (allele2.dominance > allele1.dominance) {
            applyTraits(allele2);
        } else {
            applyTraits(allele1);
            applyTraits(allele2);
        }
    }

    return traits;
}

function calculateStats(traits: Traits): Stats {
    return {
        attack: 10 + traits.muscle * 2,
        defense: 10 + traits.bone * 2,
        speed: 10 + traits.speed * 2,
        foresight: traits.perception,
    };
}

let nextId = 1;

function createCreature(genome: Genome, generation: number): Creature {
    const traits = expressGenome(genome);

    return {
        id: `Creature-${nextId++}`,
        generation,
        genome,
        traits,
        stats: calculateStats(traits),
    };
}

function createRandomCreature(generation = 1): Creature {
    return createCreature(createRandomGenome(), generation);
}

function breedCreatures(parentA: Creature, parentB: Creature): Creature {
    return createCreature(
        breedGenomes(parentA.genome, parentB.genome),
        Math.max(parentA.generation, parentB.generation) + 1,
    );
}

function formatCreature(creature: Creature): string {
    const mutationText = creature.traits.mutations.length > 0
        ? creature.traits.mutations.join(", ")
        : "None";

    const grid = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => " ")
    );

    grid[4][4] = "&";   // Head
    grid[4][3] = "o";   // Left eye
    grid[4][5] = "o";   // Right eye

    if (creature.traits.mutations.includes("No Eyes")){
        grid[4][3] = " ";
        grid[4][5] = " ";
    }

    return [
        `${creature.id} | Generation ${creature.generation}`,
        grid.map(r => r.join("")).join("\n"),
        `Stats: attack ${creature.stats.attack}, defense ${creature.stats.defense}, speed ${creature.stats.speed}, foresight ${creature.stats.foresight}`,
        ISDEV
            ? `Traits: muscle ${creature.traits.muscle}, bone ${creature.traits.bone}, speed ${creature.traits.speed}, perception ${creature.traits.perception}, food ${creature.traits.foodConsumption}`
            : "",
        `Mutations: ${mutationText}`,
    ].join("\n");
}

function formatGenome(creature: Creature): string {
    const lines = [`${creature.id} genome:`];

    for (const locus of loci) {
        const [alleleA, alleleB] = creature.genome[locus.id];
        lines.push(
            `${locus.name}: ${alleleDefinitions[alleleA].name} / ${alleleDefinitions[alleleB].name}`,
        );
    }

    return lines.join("\n");
}

function printHeader(title: string): void {
    console.log(`\n=== ${title} ===`);
}

function printMenu(parentA: Creature, parentB: Creature, children: Creature[]): void {
    printHeader("Monster Breeder");
    console.log(formatCreature(parentA));
    console.log("");
    console.log(formatCreature(parentB));
    console.log(`\nChildren bred this session: ${children.length}`);
    console.log("\n1. Breed one child");
    console.log("2. Breed ten children");
    console.log("3. Show all children");
    console.log("4. Show parent genomes");
    console.log("5. Reroll parents");
    console.log("6. Quit");
}

async function main(): Promise<void> {
    const rl = createInterface({input, output});
    let parentA = createRandomCreature();
    let parentB = createRandomCreature();
    let children: Creature[] = [];

    printHeader("Node Monster Breeder");
    console.log("Breed randomized creatures and inspect their inherited stats.");

    try {
        while (true) {
            printMenu(parentA, parentB, children);

            const choice = (await rl.question("\nChoose an option: ")).trim();

            if (choice === "1") {
                const child = breedCreatures(parentA, parentB);
                children.push(child);
                printHeader("New Child");
                console.log(formatCreature(child));
            } else if (choice === "2") {
                const newChildren = Array.from({length: 10}, () =>
                    breedCreatures(parentA, parentB),
                );
                children = children.concat(newChildren);
                printHeader("New Children");
                for (const child of newChildren) {
                    console.log(formatCreature(child));
                    console.log("");
                }
            } else if (choice === "3") {
                printHeader("Children");
                if (children.length === 0) {
                    console.log("No children bred yet.");
                } else {
                    for (const child of children) {
                        console.log(formatCreature(child));
                        console.log("");
                    }
                }
            } else if (choice === "4") {
                printHeader("Parent Genomes");
                console.log(formatGenome(parentA));
                console.log("");
                console.log(formatGenome(parentB));
            } else if (choice === "5") {
                parentA = createRandomCreature();
                parentB = createRandomCreature();
                children = [];
                console.log("\nParents rerolled. Child history cleared.");
            } else if (choice === "6" || choice.toLowerCase() === "q") {
                break;
            } else {
                console.log("\nUnknown option. Choose 1-6.");
            }
        }
    } finally {
        rl.close();
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
