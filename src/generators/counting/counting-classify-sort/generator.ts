import {Scope} from 'edugraph-ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {CountingClassifySortProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {CountingClassifySortGeneratorConfig, CountingClassifySortGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class CountingClassifySortGenerator implements ProblemGenerator<CountingClassifySortProblem, CountingClassifySortGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingClassifySortGeneratorSchema;

    generate(config: CountingClassifySortGeneratorConfig): ProblemStub | null {
        validateConfigFields('counting-classify-sort', config, ['range']);
        const resolvedRange = config.range!;

        const minVal = Math.max(1, resolvedRange.min);
        if (minVal > resolvedRange.max) return null;

        const total = Math.floor(random() * (resolvedRange.max - minVal + 1)) + minVal;

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

        const relation = config.relation === Scope.Least ? 'least' : 'most';
        let targetCategory = '';
        let targetCount = relation === 'most' ? -1 : 999;
        
        possibleCategories.forEach(cat => {
            const c = counts[cat];
            if (relation === 'most') {
                if (c > targetCount) {
                    targetCount = c;
                    targetCategory = cat;
                }
            } else {
                if (c < targetCount) {
                    targetCount = c;
                    targetCategory = cat;
                }
            }
        });

        const hasTie = possibleCategories.some(cat => cat !== targetCategory && counts[cat] === targetCount);
        if (hasTie) {
            return null;
        }

        return {
            id: `classify-sort-${relation}-${total}`,
            data: {
                items,
                categories: counts,
                relation: relation as 'most' | 'least',
                answer: targetCategory,
                numObjects: total
            }
        };
    }
}
