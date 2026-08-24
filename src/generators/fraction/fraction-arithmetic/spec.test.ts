import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {FractionArithmeticGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('FractionArithmeticGenerator spec integration', () => {
    const generator = new FractionArithmeticGenerator();
    const schemaLabels: readonly string[] = [
        Area.IteratedOperation,
        Scope.FractionNumbers,
        Scope.IntegerNumbers,
        Scope.ProperFractions,
        Scope.ImproperFractions,
        Scope.MixedNumbers,
        Scope.UnitFractions,
        Scope.TenthFractions,
        Scope.CommonDenominator,
        Area.Addition,
        Area.Subtraction,
        Area.Multiplication
    ];

    it('declares exactly the invariant mathematical capabilities', () => {
        expect(spec).toEqual({
            generatorId: 'fraction-arithmetic',
            generalLabels: [
                Area.FractionArithmetic,
                Area.Equation,
                Scope.SingleFrameOfReference
            ]
        });
        expect(spec.generalLabels).not.toContain(Scope.VisualNumbers);
        expect(spec.generalLabels).not.toContain(Ability.TextualReception);
    });

    it.each([
        [
            '3a addition',
            [
                Area.FractionArithmetic,
                Area.Addition,
                Scope.FractionNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.Interpretation
            ],
            '3d0f30a5',
            'fraction-operation'
        ],
        [
            '3a subtraction',
            [
                Area.FractionArithmetic,
                Area.Subtraction,
                Scope.FractionNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.Interpretation
            ],
            'e3924583',
            'fraction-operation'
        ],
        [
            '3b proper decomposition',
            [
                Area.FractionArithmetic,
                Area.Addition,
                Area.Equation,
                Scope.ProperFractions,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.ProcedureUnderstanding,
                Ability.Formalization
            ],
            'c825a9a2',
            'decompose'
        ],
        [
            '3b mixed decomposition',
            [
                Area.FractionArithmetic,
                Area.Addition,
                Area.Equation,
                Scope.ImproperFractions,
                Scope.MixedNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.ProcedureUnderstanding,
                Ability.Formalization
            ],
            '20231a9b',
            'decompose'
        ],
        [
            '3c mixed addition',
            [
                Area.FractionArithmetic,
                Area.Addition,
                Scope.MixedNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.ProcedureExecution
            ],
            '19aafbc3',
            'mixed-operation'
        ],
        [
            '3c mixed subtraction',
            [
                Area.FractionArithmetic,
                Area.Subtraction,
                Scope.MixedNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.ProcedureExecution
            ],
            '371cfff9',
            'mixed-operation'
        ],
        [
            '3d word addition',
            [
                Area.FractionArithmetic,
                Area.Addition,
                Area.Equation,
                Scope.FractionNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.TextualReception,
                Ability.ProcedureExecution
            ],
            '2f9e63cc',
            'fraction-operation'
        ],
        [
            '3d word subtraction',
            [
                Area.FractionArithmetic,
                Area.Subtraction,
                Area.Equation,
                Scope.FractionNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.TextualReception,
                Ability.ProcedureExecution
            ],
            '942b0e60',
            'fraction-operation'
        ],
        [
            '4a unit fraction multiple',
            [
                Area.FractionArithmetic,
                Area.Multiplication,
                Area.IteratedOperation,
                Area.Equation,
                Scope.UnitFractions,
                Scope.IntegerNumbers,
                Scope.SingleFrameOfReference,
                Ability.Interpretation
            ],
            'bb1bb0fe',
            'unit-fraction-multiple'
        ],
        [
            '4b proper product',
            [
                Area.FractionArithmetic,
                Area.Multiplication,
                Area.IteratedOperation,
                Area.Equation,
                Scope.IntegerNumbers,
                Scope.SingleFrameOfReference,
                Ability.ProcedureUnderstanding,
                Scope.ProperFractions
            ],
            '8be542ad',
            'whole-number-fraction-product'
        ],
        [
            '4b improper product',
            [
                Area.FractionArithmetic,
                Area.Multiplication,
                Area.IteratedOperation,
                Area.Equation,
                Scope.IntegerNumbers,
                Scope.SingleFrameOfReference,
                Ability.ProcedureUnderstanding,
                Scope.ImproperFractions
            ],
            'f60dee05',
            'whole-number-fraction-product'
        ],
        [
            '4c proper word product',
            [
                Area.FractionArithmetic,
                Area.Multiplication,
                Area.IteratedOperation,
                Area.Equation,
                Scope.IntegerNumbers,
                Scope.SingleFrameOfReference,
                Ability.ProcedureExecution,
                Ability.TextualReception,
                Scope.ProperFractions
            ],
            '69679bd7',
            'whole-number-fraction-product'
        ],
        [
            '4c improper word product',
            [
                Area.FractionArithmetic,
                Area.Multiplication,
                Area.IteratedOperation,
                Area.Equation,
                Scope.IntegerNumbers,
                Scope.SingleFrameOfReference,
                Ability.ProcedureExecution,
                Ability.TextualReception,
                Scope.ImproperFractions
            ],
            '403d2ccf',
            'whole-number-fraction-product'
        ],
        [
            '5 tenths and hundredths addition',
            [
                Area.FractionArithmetic,
                Area.Addition,
                Area.Multiplication,
                Area.Equation,
                Scope.CommonDenominator,
                Scope.TenthFractions,
                Scope.SingleFrameOfReference,
                Ability.ProcedureExecution
            ],
            '2c45a722',
            'tenths-hundredths-addition'
        ]
    ] as const)('resolves the corrected Grade 4 %s target', (
        _name,
        labels,
        expectedHash,
        expectedTask
    ) => {
        expect(labelSetHash([...labels])).toBe(expectedHash);
        setSeed(expectedHash);
        const stub = generateWithLabels(generator, [...labels]);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe(expectedTask);
        const resolvedLabels = stub!.labels ?? [];
        const labelStrings: readonly string[] = resolvedLabels;
        expect(resolvedLabels.includes(Scope.CommonDenominator)).toBe(
            labelStrings.includes(Scope.CommonDenominator)
        );
        expect(new Set(resolvedLabels)).toEqual(new Set(labelStrings.filter(label =>
            schemaLabels.includes(label)
        )));
        expect(resolvedLabels).not.toContain(Scope.VisualNumbers);
        expect(resolvedLabels).not.toContain(Ability.TextualReception);
        expect(resolvedLabels).not.toContain(Ability.Interpretation);
        expect(resolvedLabels).not.toContain(Ability.ProcedureUnderstanding);
        expect(resolvedLabels).not.toContain(Ability.Formalization);
        expect(resolvedLabels).not.toContain(Ability.ProcedureExecution);
    });

    it('keeps deterministic label extraction on the direct generator RNG path', () => {
        const legacyLabels = [
            Area.FractionArithmetic,
            Area.Addition,
            Scope.FractionNumbers,
            Scope.CommonDenominator,
            Scope.SingleFrameOfReference,
            Ability.Interpretation
        ];
        setSeed('fraction-arithmetic-label-path');
        const resolvedLegacy = generateWithLabels(generator, legacyLabels);
        setSeed('fraction-arithmetic-label-path');
        const directLegacy = generator.generate({
            task: 'fraction-operation',
            usesCommonDenominator: true,
            operation: 'addition'
        });
        expect(resolvedLegacy!.data).toEqual(directLegacy.data);

        const multiplicationLabels = [
            Area.FractionArithmetic,
            Area.Multiplication,
            Area.IteratedOperation,
            Area.Equation,
            Scope.UnitFractions,
            Scope.IntegerNumbers,
            Scope.SingleFrameOfReference,
            Ability.Interpretation
        ];
        setSeed('fraction-multiplication-label-path');
        const resolvedMultiplication = generateWithLabels(generator, multiplicationLabels);
        setSeed('fraction-multiplication-label-path');
        const directMultiplication = generator.generate({
            task: 'unit-fraction-multiple',
            usesCommonDenominator: false,
            operation: 'multiplication'
        });
        expect(resolvedMultiplication!.data).toEqual(directMultiplication.data);

        const tenthsHundredthsLabels = [
            Area.FractionArithmetic,
            Area.Addition,
            Area.Multiplication,
            Area.Equation,
            Scope.CommonDenominator,
            Scope.TenthFractions,
            Scope.SingleFrameOfReference,
            Ability.ProcedureExecution
        ];
        setSeed('tenths-hundredths-label-path');
        const resolvedTenthsHundredths = generateWithLabels(generator, tenthsHundredthsLabels);
        setSeed('tenths-hundredths-label-path');
        const directTenthsHundredths = generator.generate({
            task: 'tenths-hundredths-addition',
            usesCommonDenominator: true,
            operation: 'addition'
        });
        expect(resolvedTenthsHundredths!.data).toEqual(directTenthsHundredths.data);
    });
});
