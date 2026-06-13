import { random } from "./random.ts";
export interface Problem {
    bandLength: number; // in cm
    problemLength: number; // in cm
}

export function generateProblemSet(config: { problemCount: number, bandLength: number }): Problem[] {
    const problems = new Set<string>();
    const problemSet: Problem[] = [];

    while (problemSet.length < config.problemCount) {
        const minProblemLength = config.bandLength * 0.25;
        const problemLength = parseFloat((random() * (config.bandLength - minProblemLength) + minProblemLength).toFixed(1)); // Random length, 1 decimal place

        const problemKey = `${config.bandLength}-${problemLength}`;
        if (!problems.has(problemKey)) {
            problems.add(problemKey);
            problemSet.push({
                bandLength: config.bandLength,
                problemLength: problemLength
            });
        }
    }

    return problemSet;
}
