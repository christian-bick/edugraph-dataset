import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {CountingClassifySortProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {resolveRangeFromLabels, isSubConceptOf} from "../../lib/ontology.ts";
import {Scope} from "edugraph-ts";

export class CountingClassifySortGenerator implements ProblemGenerator<CountingClassifySortProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;

        const resolvedRange = resolveRangeFromLabels(labels || []);
        const total = Math.floor(random() * (resolvedRange.max - resolvedRange.min + 1)) + resolvedRange.min;

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

        const wantsMost = labels.some(l => isSubConceptOf(l, Scope.Most));
        const wantsLeast = labels.some(l => isSubConceptOf(l, Scope.Least));
        let relation = 'most';
        if (wantsMost && !wantsLeast) relation = 'most';
        else if (wantsLeast && !wantsMost) relation = 'least';
        else relation = random() > 0.5 ? 'most' : 'least';
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
