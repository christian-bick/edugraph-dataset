import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticWordProblemsRoundingGenerator} from './generator.ts';
import {spec} from './spec.ts';
import {ArithmeticWordProblemsRoundingGeneratorSchema} from './spec.ts';
import {TwoStepExtendedGeneratorSchema} from '../two-step-capabilities.ts';

describe('arithmetic-word-problems-rounding spec', () => {
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Area.IntegerRounding]));
        expect(new ArithmeticWordProblemsRoundingGenerator().schema).not.toHaveProperty('task');
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new ArithmeticWordProblemsRoundingGenerator(), [Area.Addition, Scope.NumbersSmaller1000])!.data;
            expect(data.kind).toBe('rounding');
            expect(data.numberDomain).toEqual({min: 1, max: 1000});
            expect(data.proposal.proposedAnswer).toBeGreaterThan(0);
            expect(data.proposal.proposedAnswer).toBeLessThanOrEqual(1000);
            expect(data.proposal.roundedProposedAnswer).toBeGreaterThan(0);
            expect(data.proposal.roundedProposedAnswer).toBeLessThanOrEqual(1000);
        }
    });

    it('keeps matching capabilities unchanged and constrains every added numeric quantity by the resolved range', () => {
        expect(ArithmeticWordProblemsRoundingGeneratorSchema).not.toBe(TwoStepExtendedGeneratorSchema);
        expect(ArithmeticWordProblemsRoundingGeneratorSchema.operations).toBe(TwoStepExtendedGeneratorSchema.operations);
        for (const [rangeLabel, maximum] of [[Scope.NumbersSmaller100, 100], [Scope.NumbersSmaller1000, 1000],
            [Scope.NumbersSmaller1000000, 1_000_000]] as const) {
            for (let seed = 0; seed < 32; seed++) {
                setSeed(seed);
                const data = generateWithLabels(new ArithmeticWordProblemsRoundingGenerator(), [Area.Addition, rangeLabel])!.data;
                expect(data.numberDomain).toEqual({min: 1, max: maximum});
                expect(data.proposal.proposedAnswer).not.toBe(data.answer);
                for (const value of [data.roundedAnswer, data.proposal.proposedAnswer, data.proposal.roundedProposedAnswer]) {
                    expect(value).toBeGreaterThan(0);
                    expect(value).toBeLessThanOrEqual(maximum);
                }
            }
        }
    });
});
