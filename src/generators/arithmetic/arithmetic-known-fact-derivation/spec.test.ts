import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticKnownFactDerivationGenerator} from './generator.ts';
import {spec, ArithmeticKnownFactDerivationGeneratorSchema as schema} from './spec.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {knownFactDomain} from './domain.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {findSchemaFallbackContractIssues} from '../../../lib/utils.ts';

const invariants = [
    Scope.ArabicNumerals,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.NumbersWithoutZero
];

const generate = (labels: string[]) => {
    setSeed(labels.join('|'));
    return generateWithLabels(new ArithmeticKnownFactDerivationGenerator(), [
        ...labels,
        ...invariants
    ]);
};

describe('ArithmeticKnownFactDerivationGenerator spec integration', () => {
    it('supports standalone range fallback probes while rejecting incomplete supplied strategy context', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        expect(schema.range[1]([Scope.NumbersSmaller20])).toEqual(resolveCanonicalRangeFromLabels([Scope.NumbersSmaller20]));
        expect(schema.range[1]([Scope.NumbersSmaller20, Area.PlaceValue])).toBeUndefined();
    });
    it('keeps direct and planned resolution equivalent for all feasible strategy/band configurations', () => {
        const contexts = [
            [Area.MultiplicationKnownFactDerivation, Scope.TwoOperands],
            [Area.MultiplicationKnownFactDerivation, Scope.TwoOperands, Area.CommutativeLaw],
            [Area.MultiplicationKnownFactDerivation, Scope.ThreeOperands, Area.AssociativeLaw],
            [Area.DivisionKnownFactDerivation, Scope.TwoOperands],
            [Area.MultiplicationKnownFactDerivation, Scope.TwoOperands, Area.PlaceValue]
        ];
        let feasible = 0;
        for (const context of contexts) for (const labels of schema.range[2]) {
            const range = resolveCanonicalRangeFromLabels(labels)!;
            const strategy = context.includes(Area.PlaceValue) ? 'place-value-scaling'
                : context.includes(Area.AssociativeLaw) ? 'associative'
                    : context.includes(Area.DivisionKnownFactDerivation) ? 'inverse-division' : 'commutative';
            const target = [...context, ...labels];
            if (!knownFactDomain(strategy, range).length) {
                expect(() => extractConfig(schema, target)).toThrow();
                continue;
            }
            const direct = extractConfig(schema, target);
            const bindings = Object.fromEntries(normalizeSchemaChoices(schema, target, 'generator')
                .map(field => [field.field, field.alternatives[0]!.labels]));
            bindings.range = labels;
            const planned = resolveSchemaChoices(schema, target, bindings);
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            feasible++;
        }
        expect(feasible).toBe(23);
    });
    it('declares only invariant mathematical capabilities as general labels', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining(invariants));
        expect(spec.generalLabels).not.toContain(Area.MultiplicationKnownFactDerivation);
        expect(spec.generalLabels).not.toContain(Area.DivisionKnownFactDerivation);
        expect(spec.generalLabels).not.toContain(Ability.ProcedureUnderstanding);
    });

    it.each([
        [
            [
                Area.MultiplicationKnownFactDerivation,
                Area.CommutativeLaw,
                Scope.TwoOperands,
                Scope.NumbersSmaller20
            ],
            'commutative'
        ],
        [
            [
                Area.MultiplicationKnownFactDerivation,
                Area.AssociativeLaw,
                Scope.ThreeOperands,
                Scope.NumbersSmaller20
            ],
            'associative'
        ],
        [
            [
                Area.DivisionKnownFactDerivation,
                Area.Equation,
                Scope.TwoOperands,
                Scope.NumbersSmaller100,
                Ability.ProcedureInversion
            ],
            'inverse-division'
        ],
        [
            [
                Area.MultiplicationKnownFactDerivation,
                Area.PlaceValue,
                Scope.TwoOperands,
                Scope.NumbersSmaller1000,
                Scope.MultiplesOf10,
                Scope.SingleDigitSmallestOperand,
                Scope.TwoDigitLargestOperand
            ],
            'place-value-scaling'
        ]
    ] as const)('resolves the authored labels to %s', (labels, expectedStrategy) => {
        const stub = generate([...labels, Ability.ProcedureUnderstanding]);
        expect(stub).not.toBeNull();
        expect(stub!.data.strategy).toBe(expectedStrategy);
    });

    it.each([
        [Area.MultiplicationKnownFactDerivation, 'commutative'],
        [Area.DivisionKnownFactDerivation, 'inverse-division']
    ] as const)('resolves the broad %s fluency target', (area, expectedStrategy) => {
        const stub = generate([
            area,
            Scope.TwoOperands,
            Scope.NumbersSmaller100,
            Ability.ProcedureUnderstanding
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.strategy).toBe(expectedStrategy);
    });
});
