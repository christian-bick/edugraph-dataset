import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {RatioTableComparisonProblem} from '../../../types/problems.ts';
import {greatestCommonDivisor, pick, randomInteger, ratioQuantities, ratioTable} from '../helpers.ts';
import {RatioTableComparisonsGeneratorSchema, type RatioTableComparisonsGeneratorConfig} from './spec.ts';

export class RatioTableComparisonsGenerator implements ProblemGenerator<RatioTableComparisonProblem, RatioTableComparisonsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = RatioTableComparisonsGeneratorSchema;

    generate(config: RatioTableComparisonsGeneratorConfig): ProblemStub<RatioTableComparisonProblem> {
        validateConfigFields('ratio-table-comparisons', config, ['relation']);
        const relation = config.relation;
        if (relation !== 'less' && relation !== 'equal' && relation !== 'greater') {
            throw new GeneratorValidationError('ratio-table-comparisons', 'Relation must be less, equal, or greater.');
        }
        const quantities = pick(ratioQuantities);
        let leftBase: [number, number];
        let rightBase: [number, number];
        if (relation === 'equal') {
            const numerator = randomInteger(1, 8);
            const denominator = randomInteger(1, 4);
            const multiplier = randomInteger(2, 3);
            leftBase = [numerator, denominator];
            rightBase = [numerator * multiplier, denominator * multiplier];
        } else {
            const firstNumerator = randomInteger(1, 8);
            const firstDenominator = randomInteger(1, 4);
            const secondDenominator = randomInteger(1, 4);
            const secondNumerator = Math.floor(firstNumerator * secondDenominator / firstDenominator) + randomInteger(1, 3);
            const smaller: [number, number] = [firstNumerator, firstDenominator];
            const larger: [number, number] = [secondNumerator, secondDenominator];
            [leftBase, rightBase] = relation === 'less' ? [smaller, larger] : [larger, smaller];
        }
        const common = leftBase[1] * rightBase[1] / greatestCommonDivisor(leftBase[1], rightBase[1]);
        const multiplier = Math.ceil(4 / Math.min(common / leftBase[1], common / rightBase[1]));
        const consequent = common * multiplier;
        const leftScale = consequent / leftBase[1];
        const rightScale = consequent / rightBase[1];
        const left = ratioTable(leftBase, quantities, [1, 2, 3, leftScale]);
        const right = ratioTable(rightBase, quantities, [1, 2, 3, rightScale]);
        return {data: {
            kind: 'ratio-table-comparison', left, right, relation,
            normalized: {
                consequent,
                leftAntecedent: leftBase[0] * leftScale,
                rightAntecedent: rightBase[0] * rightScale
            }
        }};
    }
}
