import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {random, setSeed} from '../../../lib/random.ts';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {FractionComparisonGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('FractionComparisonGenerator spec integration', () => {
    const generator = new FractionComparisonGenerator();

    const legacyLabels = (
        family: Scope.CommonDenominator | Scope.CommonNumerator,
        relation: Scope.Greater | Scope.Less
    ) => [
        Area.NumericComparison,
        Area.FractionNotation,
        family === Scope.CommonDenominator
            ? Area.FractionNumeratorInterpretation
            : Area.FractionDenominatorInterpretation,
        Scope.ProperFractions,
        Scope.SingleFrameOfReference,
        family,
        relation,
        Ability.ConceptDerivation
    ];

    it('declares invariant mathematical capabilities without the visual representation', () => {
        expect(spec).toEqual({
            generatorId: 'fraction-comparison',
            generalLabels: [
                Area.FractionNotation,
                Scope.ProperFractions,
                Scope.SingleFrameOfReference,
                Ability.ConceptDerivation
            ]
        });
        expect(spec.generalLabels).not.toContain(Scope.VisualNumbers);
    });

    it.each([
        [Scope.CommonDenominator, Area.FractionNumeratorInterpretation, Scope.Greater, 'common-denominator'],
        [Scope.CommonDenominator, Area.FractionNumeratorInterpretation, Scope.Less, 'common-denominator'],
        [Scope.CommonNumerator, Area.FractionDenominatorInterpretation, Scope.Greater, 'common-numerator'],
        [Scope.CommonNumerator, Area.FractionDenominatorInterpretation, Scope.Less, 'common-numerator']
    ] as const)('resolves the exact %s / %s / %s mode', (
        comparisonFamily,
        interpretation,
        relation,
        expectedFamily
    ) => {
        setSeed(`${comparisonFamily}-${relation}`);
        const stub = generateWithLabels(generator, [
            Area.NumericComparison,
            Area.FractionNotation,
            Scope.ProperFractions,
            Scope.SingleFrameOfReference,
            Ability.ConceptDerivation,
            comparisonFamily,
            interpretation,
            relation
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('compare-fractions');
        if (stub!.data.task !== 'compare-fractions') throw new Error('Expected legacy comparison.');
        expect(stub!.data.family).toBe(expectedFamily);
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Area.NumericComparison,
            comparisonFamily,
            interpretation,
            relation
        ]));
    });

    it.each([
        [Area.NumericInequality, Scope.Greater, '8a106aab'],
        [Area.NumericEquality, Scope.Equal, 'e05e575c'],
        [Area.NumericInequality, Scope.Less, '85a09810']
    ] as const)('resolves the corrected Grade 4 %s / %s target', (
        comparisonKind,
        relation,
        expectedHash
    ) => {
        const labels = [
            comparisonKind,
            Area.FractionNotation,
            Scope.FractionNumbers,
            Scope.SingleFrameOfReference,
            Scope.VisualNumbers,
            Ability.ProcedureUnderstanding,
            relation
        ];
        expect(labelSetHash(labels)).toBe(expectedHash);
        setSeed(expectedHash);
        const stub = generateWithLabels(generator, labels);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('compare-unlike-fractions');
        expect(stub!.tags).toEqual(expect.arrayContaining([
            comparisonKind,
            Ability.ProcedureUnderstanding,
            relation
        ]));
        expect(stub!.tags).not.toContain(Scope.VisualNumbers);
        expect(stub!.tags).not.toContain(Scope.SingleFrameOfReference);
    });

    it('preserves the three historical RNG advances at legacy label extraction', () => {
        const labels = legacyLabels(Scope.CommonDenominator, Scope.Greater);
        setSeed('legacy-label-extraction');
        const resolved = generateWithLabels(generator, labels);
        setSeed('legacy-label-extraction');
        random();
        random();
        random();
        const direct = generator.generate({
            comparisonKind: Area.NumericComparison,
            usesProcedureUnderstanding: false,
            usesCommonDenominator: true,
            usesCommonNumerator: false,
            usesNumeratorInterpretation: true,
            usesDenominatorInterpretation: false,
            relation: Scope.Greater
        });

        expect(resolved!.data).toEqual(direct.data);
        expect(resolved!.tags).not.toContain(Ability.ProcedureUnderstanding);
    });

    it.each([
        [
            'cbe33771 question',
            1650889443,
            Scope.CommonNumerator,
            Scope.Less,
            {numerator: 1, denominator: 8, notation: '1/8'},
            {numerator: 1, denominator: 3, notation: '1/3'}
        ],
        [
            'cbe33771 solution',
            226733262,
            Scope.CommonNumerator,
            Scope.Less,
            {numerator: 3, denominator: 8, notation: '3/8'},
            {numerator: 3, denominator: 4, notation: '3/4'}
        ],
        [
            '720d9d72 question',
            1855377114,
            Scope.CommonDenominator,
            Scope.Greater,
            {numerator: 4, denominator: 6, notation: '4/6'},
            {numerator: 2, denominator: 6, notation: '2/6'}
        ],
        [
            '720d9d72 solution',
            420635569,
            Scope.CommonDenominator,
            Scope.Greater,
            {numerator: 5, denominator: 8, notation: '5/8'},
            {numerator: 2, denominator: 8, notation: '2/8'}
        ],
        [
            '837ef962 validation solution',
            160312714,
            Scope.CommonNumerator,
            Scope.Greater,
            {numerator: 1, denominator: 2, notation: '1/2'},
            {numerator: 1, denominator: 4, notation: '1/4'}
        ]
    ] as const)('preserves the canonical legacy payload for %s', (
        _identity,
        seed,
        family,
        relation,
        first,
        second
    ) => {
        setSeed(seed);
        const stub = generateWithLabels(generator, legacyLabels(family, relation));
        const relationWord = relation === Scope.Greater ? 'greater' : 'less';
        const symbol = relation === Scope.Greater ? '>' : '<';
        const familyName = family === Scope.CommonDenominator
            ? 'common-denominator'
            : 'common-numerator';
        const sharedComponent = family === Scope.CommonDenominator
            ? first.denominator
            : first.numerator;
        const rationale = family === Scope.CommonDenominator
            ? `Both ${first.notation} and ${second.notation} refer to the same whole and share denominator ${sharedComponent}; comparing numerators ${first.numerator} and ${second.numerator} shows ${first.notation} is ${relationWord} than ${second.notation}.`
            : `Both ${first.notation} and ${second.notation} refer to the same whole and share numerator ${sharedComponent}; denominator ${first.denominator} makes ${relation === Scope.Greater ? 'larger' : 'smaller'} parts than denominator ${second.denominator}, so ${first.notation} is ${relationWord} than ${second.notation}.`;

        expect(stub!.data).toEqual({
            task: 'compare-fractions',
            first,
            second,
            family: familyName,
            sharedComponent,
            relation: relationWord,
            symbol,
            sharedWhole: 1,
            answer: `${first.notation} ${symbol} ${second.notation}`,
            rationale
        });
    });
});
