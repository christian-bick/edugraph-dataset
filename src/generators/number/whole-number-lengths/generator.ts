import {validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {WholeNumberLengthProblem} from '../../../types/problems.ts';
import {createCanonicalNumericRange, CANONICAL_RANGE_THRESHOLDS} from '../../../lib/canonical-numeric-range.ts';
import {random} from '../../../lib/random.ts';
import {WholeNumberLengthsGeneratorSchema, type WholeNumberLengthsGeneratorConfig} from './spec.ts';

export class WholeNumberLengthsGenerator implements ProblemGenerator<WholeNumberLengthProblem, WholeNumberLengthsGeneratorConfig> {
    type: AbstractProblem['type'] = 'writing';
    schema = WholeNumberLengthsGeneratorSchema;

    generate(config: WholeNumberLengthsGeneratorConfig): ProblemStub<WholeNumberLengthProblem> | null {
        validateConfigFields('whole-number-lengths', config, ['range']);
        const range = config.range!;
        if (range.min !== 0 || !CANONICAL_RANGE_THRESHOLDS.some(upper => upper === range.max)) return null;
        const expected = createCanonicalNumericRange(range.max);
        if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) return null;
        const minimumEndpoint = Math.max(1, range.maximumAbove + 1);
        const endpoint = minimumEndpoint + Math.floor(random() * (range.max - minimumEndpoint + 1));
        return {data: {kind: 'whole-number-length', origin: 0, endpoint, unit: 1}};
    }
}
