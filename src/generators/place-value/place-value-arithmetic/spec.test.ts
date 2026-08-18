import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {PlaceValueArithmeticGenerator} from './generator.ts';
import {spec} from './spec.ts';

const invariantLabels = [
    Scope.TwoOperands,
    Scope.IntegerNumbers,
    Scope.Base10,
    Scope.NumbersWithoutNegatives
];

const generate = (labels: string[]) => generateWithLabels(
    new PlaceValueArithmeticGenerator(),
    [...labels, Scope.TwoOperands, Scope.NumbersSmaller100, Ability.ProcedureUnderstanding]
);

describe('PlaceValueArithmeticGenerator spec integration', () => {
    it('declares invariant math while parameterizing regrouping and operand constraints', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining(invariantLabels));
        expect(spec.generalLabels).not.toContain(Area.IntegerRegrouping);
        expect(spec.generalLabels).not.toContain(Scope.MultiplesOf10);
        expect(spec.generalLabels).not.toContain(Scope.SingleDigitSmallestOperand);
        expect(spec.generalLabels).not.toContain(Scope.NumbersWithZero);
    });

    it.each([
        ['without regrouping', [], 'none'],
        ['with regrouping', [Area.IntegerRegrouping], 'compose-ten']
    ] as const)('resolves two-digit plus single-digit %s', (_name, extraLabels, regroupingKind) => {
        setSeed(regroupingKind);
        const stub = generate([
            Area.AdditionPlaceValuePartitioning,
            Scope.SingleDigitSmallestOperand,
            Scope.TwoDigitLargestOperand,
            ...extraLabels
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operandProfile).toBe('two-digit-single-digit');
        expect(stub!.data.regrouping.kind).toBe(regroupingKind);
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Area.AdditionPlaceValuePartitioning,
            Scope.SingleDigitSmallestOperand,
            Scope.TwoDigitLargestOperand
        ]));
    });

    it('resolves two-digit plus a multiple of 10', () => {
        const stub = generate([
            Area.AdditionPlaceValuePartitioning,
            Scope.MultiplesOf10,
            Scope.TwoDigitLargestOperand
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operandProfile).toBe('two-digit-multiple-of-ten');
        expect(stub!.data.num2 % 10).toBe(0);
        expect(stub!.data.regrouping.kind).toBe('none');
    });

    it.each([
        [Scope.NumbersWithoutZero, false],
        [Scope.NumbersWithZero, true]
    ] as const)('resolves multiples-of-10 subtraction for %s', (zeroLabel, requireZero) => {
        setSeed(zeroLabel);
        const stub = generate([
            Area.SubtractionPlaceValuePartitioning,
            Scope.MultiplesOf10,
            Scope.NumbersWithoutNegatives,
            zeroLabel
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operandProfile).toBe('multiples-of-ten');
        expect(stub!.data.answer === 0).toBe(requireZero);
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Area.SubtractionPlaceValuePartitioning,
            Scope.MultiplesOf10,
            zeroLabel
        ]));
    });

    it.each([
        [Area.AdditionPlaceValuePartitioning, 'addition', 'compose-ten'],
        [Area.SubtractionPlaceValuePartitioning, 'subtraction', 'decompose-ten']
    ] as const)('preserves upper-grade %s regrouping resolution', (strategy, operation, kind) => {
        const stub = generateWithLabels(new PlaceValueArithmeticGenerator(), [
            strategy,
            Area.IntegerRegrouping,
            Scope.PhysicalNumbers,
            Scope.TwoOperands,
            Scope.NumbersSmaller1000,
            Ability.ProcedureUnderstanding
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        expect(stub!.data.operandProfile).toBe('general');
        expect(stub!.data.regrouping.kind).toBe(kind);
        expect(stub!.tags).toEqual(expect.arrayContaining([strategy, Area.IntegerRegrouping]));
    });
});
