import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {FullCommonFactorDistributionProblem} from '../../../types/problems.ts';
import {commonPositiveDivisors} from '../common-factor-helpers.ts';
import {CommonFactorDistributionRelationsGeneratorSchema, type CommonFactorDistributionRelationsGeneratorConfig} from './spec.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

const generatorId = 'common-factor-distribution-relations';

/** Preserve the greatest factor and both reconstruction products, rather than a partial extraction. */
export function buildFullCommonFactorDistributionProblem(first: number, second: number): FullCommonFactorDistributionProblem {
    if (!Number.isSafeInteger(first) || first < 1 || first > 100
        || !Number.isSafeInteger(second) || second < 1 || second > 100) {
        throw new GeneratorValidationError(generatorId, 'Original addends must be whole numbers from 1 through 100.');
    }
    const commonDivisors = commonPositiveDivisors(first, second);
    const gcd = commonDivisors[commonDivisors.length - 1]!;
    if (gcd === 1) throw new GeneratorValidationError(generatorId, 'A nontrivial common factor is required.');
    const residualAddends = [first / gcd, second / gcd] as const;
    // Dividing both addends by their greatest common divisor proves this complete list is [1].
    const residualCommonDivisors = commonPositiveDivisors(...residualAddends) as [1];
    return {kind: 'full-common-factor-distribution', addends: [first, second], sum: first + second,
        commonDivisors, gcd, residualAddends, residualSum: residualAddends[0] + residualAddends[1],
        residualCommonDivisors, distributedProducts: [gcd * residualAddends[0], gcd * residualAddends[1]]};
}

const originals = Array.from({length: 100}, (_, index) => index + 1);
const candidates = originals.flatMap(first => originals
    .filter(second => commonPositiveDivisors(first, second).length > 1)
    .map(second => [first, second] as const));

export class CommonFactorDistributionRelationsGenerator implements ProblemGenerator<
    FullCommonFactorDistributionProblem, CommonFactorDistributionRelationsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = CommonFactorDistributionRelationsGeneratorSchema;

    generate(config: CommonFactorDistributionRelationsGeneratorConfig): ProblemStub<FullCommonFactorDistributionProblem> {
        validateConfigFields(generatorId, config, ['range']);
        const range = config.range!;
        if (typeof range !== 'object' || range === null || range.min !== 0
            || ![5, 10, 20, 100, 120, 1000].includes(range.max)) {
            throw new GeneratorValidationError(generatorId,
                'Expected a reviewed canonical upper band without a positive lower.');
        }
        const expected = createCanonicalNumericRange(range.max);
        if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
            throw new GeneratorValidationError(generatorId, 'Canonical range witnesses are missing or inconsistent.');
        }
        // The required full proof contains factor1; its largest quantity is the final sum.
        const admitted = candidates.filter(([first, second]) => first + second > range.maximumAbove && first + second <= range.max);
        const [first, second] = admitted[Math.floor(random() * admitted.length)]!;
        return {data: buildFullCommonFactorDistributionProblem(first, second)};
    }
}
