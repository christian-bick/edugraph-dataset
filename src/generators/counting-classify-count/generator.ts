import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {CountingClassifyCountProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {CountingClassifyCountGeneratorConfig, CountingClassifyCountGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../lib/errors.ts";

export class CountingClassifyCountGenerator implements ProblemGenerator<CountingClassifyCountProblem, CountingClassifyCountGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingClassifyCountGeneratorSchema;

    generate(config: CountingClassifyCountGeneratorConfig): ProblemStub | null {
        validateConfigFields('counting-classify-count', config, ['range']);
        const resolvedRange = config.range!;

        const minVal = Math.max(1, resolvedRange.min);
        if (minVal > resolvedRange.max) return null;

        const total = Math.floor(random() * (resolvedRange.max - minVal + 1)) + minVal;

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
