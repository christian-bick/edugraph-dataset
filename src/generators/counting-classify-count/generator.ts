import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {CountingClassifyCountProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {CountingClassifyCountGeneratorConfig, CountingClassifyCountGeneratorSchema} from "./spec.ts";

export class CountingClassifyCountGenerator implements ProblemGenerator<CountingClassifyCountProblem, CountingClassifyCountGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingClassifyCountGeneratorSchema;

    generate(config: CountingClassifyCountGeneratorConfig): ProblemStub | null {
        const resolvedRange = config.range;
        if (!resolvedRange) return null;

        const total = Math.floor(random() * (resolvedRange.max - resolvedRange.min + 1)) + resolvedRange.min;

        // Abstract categories: A, B, C
        const possibleCategories = ['A', 'B', 'C'];
        const items: string[] = [];
        const counts: Record<string, number> = {};

        // Ensure we initialize the counts to 0
        possibleCategories.forEach(cat => counts[cat] = 0);

        for (let i = 0; i < total; i++) {
            const cat = possibleCategories[Math.floor(random() * possibleCategories.length)];
            items.push(cat);
            counts[cat]++;
        }

        return {
            id: `classify-count-${total}`,
            data: {
                items,
                categories: counts,
                numObjects: total
            }
        };
    }
}
