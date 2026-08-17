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
        Scope.FractionNumbers,
        Scope.ProperFractions,
        Scope.ImproperFractions,
        Scope.MixedNumbers,
        Scope.CommonDenominator,
        Area.Addition,
        Area.Subtraction
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
        expect(tags).toContain(Scope.CommonDenominator);
        expect(new Set(tags)).toEqual(new Set(labelStrings.filter(label =>
            schemaLabels.includes(label)
        )));
        expect(tags).not.toContain(Scope.VisualNumbers);
        expect(tags).not.toContain(Ability.TextualReception);
    });
});
