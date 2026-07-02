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
    effects: Partial<Traits>;
    dominance: number;
    mutation?: string;
};

type LocusDefinition = {
    id: LocusId;
    alleles: AlleleId[];
};

const loci: LocusDefinition[] = [
    {
        id: "muscleGrowth",
        alleles: ["weakMuscle", "normalMuscle", "strongMuscle"],
    },
    {
        id: "boneDensity",
        alleles: ["lightBones", "normalBones", "denseBones"],
    },
    {
        id: "metabolism",
        alleles: ["slowMetabolism", "normalMetabolism", "fastMetabolism"],
    },
    {
        id: "eyeDevelopment",
        alleles: ["normalEyes", "thirdEye","noEyes"],
    },
];

const alleleDefinitions: Record<AlleleId, AlleleDefinition> = {
    weakMuscle: {
        id: "weakMuscle",
        name: "Weak Muscle",
        effects: { muscle: -2, foodConsumption: -1 },
        dominance: 1
    },

    normalMuscle: {
        id: "normalMuscle",
        name: "Normal Muscle",
        effects: { muscle: 0 },
        dominance: 1
    },

    strongMuscle: {
        id: "strongMuscle",
        name: "Strong Muscle",
        effects: { muscle: 3, foodConsumption: 2 },
        dominance: 1
    },

    lightBones: {
        id: "lightBones",
        name: "Light Bones",
        effects: { bone: -2, speed: 2 },
        dominance: 1
    },

    normalBones: {
        id: "normalBones",
        name: "Normal Bones",
        effects: { bone: 0 },
        dominance: 1
    },

    denseBones: {
        id: "denseBones",
        name: "Dense Bones",
        effects: { bone: 3, speed: -1, foodConsumption: 1 },
        dominance: 1
    },

    slowMetabolism: {
        id: "slowMetabolism",
        name: "Slow Metabolism",
        effects: { speed: -1, foodConsumption: -2 },
        dominance: 1
    },

    normalMetabolism: {
        id: "normalMetabolism",
        name: "Normal Metabolism",
        effects: {},
        dominance: 1
    },

    fastMetabolism: {
        id: "fastMetabolism",
        name: "Fast Metabolism",
        effects: { speed: 3, foodConsumption: 3 },
        dominance: 1
    },

    normalEyes: {
        id: "normalEyes",
        name: "Normal Eyes",
        effects: { perception: 0 },
        dominance: 5
    },

    thirdEye: {
        id: "thirdEye",
        name: "Third Eye",
        effects: { perception: 5, foodConsumption: 1 },
        mutation: "Third Eye",
        dominance: 1
    },

    noEyes: {
        id: "noEyes",
        name: "No Eyes",
        effects: { perception: -5 },
        mutation: "No Eyes",
        dominance: 9,
    }
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
        const aAlleles = parentA[locus.id];
        const bAlleles = parentB[locus.id];

        child[locus.id] = [
            randomFrom(aAlleles),
            randomFrom(bAlleles),
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

    function applyTraits(def: AlleleDefinition):void{
        for (const [trait, value] of Object.entries(def.effects)) {
            if (trait === "mutations") continue;

            traits[trait as keyof Omit<Traits, "mutations">] += value as number;
        }

        if (def.mutation && !traits.mutations.includes(def.mutation)) {
            traits.mutations.push(def.mutation);
        }
    }

    for (const [_, allelePair] of Object.entries(genome)) {
        const allele1 = alleleDefinitions[allelePair[0]];
        const allele2 = alleleDefinitions[allelePair[1]];
        
        if (allele1.dominance > allele2.dominance){
            applyTraits(allele1);
        }
        if (allele2.dominance > allele1.dominance){
            applyTraits(allele2);
        }
        if (allele1.dominance == allele2.dominance){
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

function breedCreatures(parentA: Creature, parentB: Creature): Creature {
    const genome = breedGenomes(parentA.genome, parentB.genome);

    return createCreature(
        genome,
        Math.max(parentA.generation, parentB.generation) + 1
    );
}

// Demo

const parentA = createCreature(createRandomGenome(), 1);
const parentB = createCreature(createRandomGenome(), 1);

console.log("Parent A", parentA);
console.log("Parent B", parentB);

const children = Array.from({ length: 10 }, () =>
    breedCreatures(parentA, parentB)
);

console.log("Children", children);