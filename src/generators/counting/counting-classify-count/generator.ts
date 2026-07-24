import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {CountingClassifyCountProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {CountingClassifyCountGeneratorConfig, CountingClassifyCountGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

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
        const numCategories = Math.min(possibleCategories.length, Math.max(1, total));
        const activeCategories = possibleCategories.slice(0, numCategories);

        const items: string[] = [];
        const counts: Record<string, number> = {};

        // Ensure every active category has at least 1 item (positive integer)
        activeCategories.forEach(cat => {
            counts[cat] = 1;
            items.push(cat);
        });

        // Distribute remaining items
        for (let i = items.length; i < total; i++) {
            const cat = activeCategories[Math.floor(random() * activeCategories.length)];
            items.push(cat);
            counts[cat]++;
        }

        return {
            data: {
                items,
                categories: counts,
                numObjects: total
            }
        };
    }
}
