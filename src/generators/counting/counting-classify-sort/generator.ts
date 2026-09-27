import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {CountingClassifySortProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {CountingClassifySortGeneratorConfig, CountingClassifySortGeneratorSchema} from "./spec.ts";
import {GeneratorValidationError, validateConfigFields} from "../../../lib/errors.ts";
import {buildCategoryCountRelations} from '../category-count-relations.ts';

export class CountingClassifySortGenerator implements ProblemGenerator<CountingClassifySortProblem, CountingClassifySortGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingClassifySortGeneratorSchema;

    generate(config: CountingClassifySortGeneratorConfig): ProblemStub<CountingClassifySortProblem> | null {
        validateConfigFields('counting-classify-sort', config, ['range', 'relation']);
        const resolvedRange = config.range!;
        const relation = config.relation;
        if (relation !== 'least' && relation !== 'most' && relation !== 'ascending' && relation !== 'descending') {
            throw new GeneratorValidationError('counting-classify-sort', 'Unknown category-count relation.');
        }
        if (!Number.isFinite(resolvedRange.min) || !Number.isSafeInteger(resolvedRange.max)) return null;

        const minVal = Math.max(1, Math.ceil(resolvedRange.min));
        const possibleCategories = ['A', 'B', 'C'];
        const minTotal = possibleCategories.length * minVal;
        if (resolvedRange.max < minTotal) return null;
        const total = Math.floor(random() * (resolvedRange.max - minTotal + 1)) + minTotal;

        const counts: Record<string, number> = {};

        // Every category count and the collection total must respect the requested range.
        possibleCategories.forEach(cat => {
            counts[cat] = minVal;
        });

        const remaining = total - minTotal;
        for (let i = 0; i < remaining; i++) {
            const cat = possibleCategories[Math.floor(random() * possibleCategories.length)];
            counts[cat]++;
        }

        const relations = buildCategoryCountRelations(counts);
        if ((relation === 'least' && relations.minimumCategories.length !== 1)
            || (relation === 'most' && relations.maximumCategories.length !== 1)
            || relations.ascendingGroups.length < 2) return null;

        return {
            data: {
                categories: counts,
                relation,
                numObjects: total,
                ...relations
            }
        };
    }
}
