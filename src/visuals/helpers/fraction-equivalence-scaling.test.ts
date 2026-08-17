import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../lib/random.ts';
import {FractionEquivalenceGenerator} from '../../generators/fraction/fraction-equivalence/generator.ts';
import {FractionScalingProblem} from '../../types/problems.ts';
import {isValidFractionScalingProblem} from './fraction-equivalence-scaling.ts';

const generateScalingProblem = (seed: string | number = 'view-scaling-validation'): FractionScalingProblem => {
    setSeed(seed);
    const data = new FractionEquivalenceGenerator().generate({
        taskAbilities: [Ability.Formalization, Ability.ProcedureUnderstanding],
        usesMultiplication: true,
        usesEqualShares: true,
        usesImproperFractions: false,
        usesIntegerNumbers: false
    }).data;
    if (data.task !== 'scale-equivalence') throw new Error('Expected scaling payload.');
    return data;
};

const changed = (
    update: (data: FractionScalingProblem) => void
): FractionScalingProblem => {
    const data = structuredClone(generateScalingProblem());
    update(data);
    return data;
};

describe('isValidFractionScalingProblem', () => {
    it('accepts every scale factor in the generator-owned shared-whole contract', () => {
        const scaleFactors = new Set<number>();
        for (let seed = 0; seed < 100; seed++) {
            const data = generateScalingProblem(`view-scaling-${seed}`);
            expect(isValidFractionScalingProblem(data)).toBe(true);
            scaleFactors.add(data.scaleFactor);
        }
        expect(scaleFactors).toEqual(new Set([2, 3, 4]));
    });

    it.each([
        ['scaled numerator', (data: FractionScalingProblem) => {
            data.numeratorScale.result += 1;
        }],
        ['question blank', (data: FractionScalingProblem) => {
            data.questionEquation = `${data.first.notation} = ${data.second.notation}`;
        }],
        ['bar partition count', (data: FractionScalingProblem) => {
            data.barModel.second.partCount = data.first.denominator;
        }],
        ['bar shaded amount', (data: FractionScalingProblem) => {
            data.barModel.second.shadedCount -= 1;
        }],
        ['interior tick label', (data: FractionScalingProblem) => {
            data.numberLineModel.secondTicks[1].label = data.second.notation;
        }],
        ['tick position', (data: FractionScalingProblem) => {
            data.numberLineModel.secondTicks[1].xPercent += 2;
        }],
        ['shared point', (data: FractionScalingProblem) => {
            data.numberLineModel.secondPoint.xPercent += 3;
        }],
        ['non-finite point', (data: FractionScalingProblem) => {
            data.numberLineModel.firstPoint.xPercent = Number.NaN;
        }],
        ['answer quantity', (data: FractionScalingProblem) => {
            data.answer = data.second.notation;
        }],
        ['answer statement', (data: FractionScalingProblem) => {
            data.answerStatement = `${data.first.notation} is close to ${data.second.notation}.`;
        }],
        ['explanation', (data: FractionScalingProblem) => {
            data.explanation = 'The fractions look the same.';
        }]
    ])('rejects contradictory %s evidence', (_name, update) => {
        expect(isValidFractionScalingProblem(changed(update))).toBe(false);
    });
});
