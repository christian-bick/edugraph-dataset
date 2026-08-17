import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {FractionArithmeticGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('FractionArithmeticGenerator spec integration', () => {
    const generator = new FractionArithmeticGenerator();
    const schemaLabels: readonly string[] = [
        Ability.Interpretation,
        Ability.ProcedureUnderstanding,
        Ability.Formalization,
        Ability.ProcedureExecution,
        Area.IteratedOperation,
        Scope.FractionNumbers,
        Scope.IntegerNumbers,
        Scope.ProperFractions,
        Scope.ImproperFractions,
        Scope.MixedNumbers,
        Scope.UnitFractions,
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
                Area.FractionNotation,
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
                Area.FractionNotation,
                Area.Addition,
                Scope.FractionNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.Interpretation
            ],
            '81aa78ff',
            'interpret-operation'
        ],
        [
            '3a subtraction',
            [
                Area.FractionArithmetic,
                Area.FractionNotation,
                Area.Subtraction,
                Scope.FractionNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.Interpretation
            ],
            'ff302f5d',
            'interpret-operation'
        ],
        [
            '3b proper decomposition',
            [
                Area.FractionArithmetic,
                Area.FractionNotation,
                Area.Addition,
                Area.Equation,
                Scope.ProperFractions,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.ProcedureUnderstanding,
                Ability.Formalization
            ],
            'cbaccabc',
            'decompose'
        ],
        [
            '3b mixed decomposition',
            [
                Area.FractionArithmetic,
                Area.FractionNotation,
                Area.Addition,
                Area.Equation,
                Scope.ImproperFractions,
                Scope.MixedNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.ProcedureUnderstanding,
                Ability.Formalization
            ],
            '01bd08c1',
            'decompose'
        ],
        [
            '3c mixed addition',
            [
                Area.FractionArithmetic,
                Area.FractionNotation,
                Area.Addition,
                Scope.MixedNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.ProcedureExecution
            ],
            'c4db8efd',
            'mixed-operation'
        ],
        [
            '3c mixed subtraction',
            [
                Area.FractionArithmetic,
                Area.FractionNotation,
                Area.Subtraction,
                Scope.MixedNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.ProcedureExecution
            ],
            '653a155b',
            'mixed-operation'
        ],
        [
            '3d word addition',
            [
                Area.FractionArithmetic,
                Area.FractionNotation,
                Area.Addition,
                Area.Equation,
                Scope.FractionNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.TextualReception,
                Ability.ProcedureExecution
            ],
            'e4e9ede2',
            'fraction-operation'
        ],
        [
            '3d word subtraction',
            [
                Area.FractionArithmetic,
                Area.FractionNotation,
                Area.Subtraction,
                Area.Equation,
                Scope.FractionNumbers,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.TextualReception,
                Ability.ProcedureExecution
            ],
            '7320471e',
            'fraction-operation'
        ],
        [
            '4a unit fraction multiple',
            [
                Area.FractionArithmetic,
                Area.FractionNotation,
                Area.Multiplication,
                Area.IteratedOperation,
                Area.Equation,
                Scope.UnitFractions,
                Scope.IntegerNumbers,
                Scope.SingleFrameOfReference,
                Ability.Interpretation
            ],
            '120545e8',
            'unit-fraction-multiple'
        ],
        [
            '4b proper product',
            [
                Area.FractionArithmetic,
                Area.FractionNotation,
                Area.Multiplication,
                Area.IteratedOperation,
                Area.Equation,
                Scope.IntegerNumbers,
                Scope.SingleFrameOfReference,
                Ability.ProcedureUnderstanding,
                Scope.ProperFractions
            ],
            'bb541f43',
            'whole-number-fraction-product'
        ],
        [
            '4b improper product',
            [
                Area.FractionArithmetic,
                Area.FractionNotation,
                Area.Multiplication,
                Area.IteratedOperation,
                Area.Equation,
                Scope.IntegerNumbers,
                Scope.SingleFrameOfReference,
                Ability.ProcedureUnderstanding,
                Scope.ImproperFractions
            ],
            '3037bd93',
            'whole-number-fraction-product'
        ],
        [
            '4c proper word product',
            [
                Area.FractionArithmetic,
                Area.FractionNotation,
                Area.Multiplication,
                Area.IteratedOperation,
                Area.Equation,
                Scope.IntegerNumbers,
                Scope.SingleFrameOfReference,
                Ability.ProcedureExecution,
                Ability.TextualReception,
                Scope.ProperFractions
            ],
            '52e7330d',
            'fraction-multiplication-problem'
        ],
        [
            '4c improper word product',
            [
                Area.FractionArithmetic,
                Area.FractionNotation,
                Area.Multiplication,
                Area.IteratedOperation,
                Area.Equation,
                Scope.IntegerNumbers,
                Scope.SingleFrameOfReference,
                Ability.ProcedureExecution,
                Ability.TextualReception,
                Scope.ImproperFractions
            ],
            '29b60da5',
            'fraction-multiplication-problem'
        ],
        [
            '5 tenths and hundredths addition',
            [
                Area.FractionArithmetic,
                Area.FractionNotation,
                Area.Addition,
                Area.Multiplication,
                Area.Equation,
                Scope.CommonDenominator,
                Scope.SingleFrameOfReference,
                Ability.ProcedureExecution
            ],
            '8b2eb048',
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
        const tags = stub!.tags ?? [];
        const labelStrings: readonly string[] = labels;
        expect(tags.includes(Scope.CommonDenominator)).toBe(
            labelStrings.includes(Scope.CommonDenominator)
        );
        expect(new Set(tags)).toEqual(new Set(labelStrings.filter(label =>
            schemaLabels.includes(label)
        )));
        expect(tags).not.toContain(Scope.VisualNumbers);
        expect(tags).not.toContain(Ability.TextualReception);
    });

    it('keeps deterministic label extraction on the direct generator RNG path', () => {
        const legacyLabels = [
            Area.FractionArithmetic,
            Area.FractionNotation,
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
            task: 'interpret-operation',
            usesCommonDenominator: true,
            operation: 'addition'
        });
        expect(resolvedLegacy!.data).toEqual(directLegacy.data);

        const multiplicationLabels = [
            Area.FractionArithmetic,
            Area.FractionNotation,
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
            Area.FractionNotation,
            Area.Addition,
            Area.Multiplication,
            Area.Equation,
            Scope.CommonDenominator,
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
