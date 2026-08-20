import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {
    findAbilityLabels,
    findCrossRoleAreaOverlaps,
    findRejectedLabelContractIssues,
    findRequiredLabelContractIssues
} from './spec-contracts.ts';

describe('findAbilityLabels', () => {
    it('separates Ability entities from Area and Scope labels', () => {
        expect(findAbilityLabels([
            Area.Equation,
            Ability.Formalization,
            Scope.ArabicNumerals
        ])).toEqual([Ability.Formalization]);
    });
});

describe('findCrossRoleAreaOverlaps', () => {
    it('rejects equal and specializing Areas across a generator/view boundary', () => {
        expect(findCrossRoleAreaOverlaps({
            generatorLabels: [Area.Measurement, Area.ShapeIdentity],
            viewLabels: [Area.MeasuringObjects, Area.ShapeNaming]
        })).toEqual([
            {generatorLabel: Area.Measurement, viewLabel: Area.MeasuringObjects},
            {generatorLabel: Area.ShapeIdentity, viewLabel: Area.ShapeNaming}
        ]);
    });

    it('allows independent Areas and ignores Scope taxonomy', () => {
        expect(findCrossRoleAreaOverlaps({
            generatorLabels: [Area.Addition, Scope.MeasurementScope],
            viewLabels: [Area.Equation, Scope.LengthMeasurement]
        })).toEqual([]);
    });
});

describe('findRequiredLabelContractIssues', () => {
    it('accepts required labels supplied by every compatible generator', () => {
        expect(findRequiredLabelContractIssues({
            requiredLabels: [Area.PrimeNumbers],
            viewSupportedLabels: [],
            rejectedLabels: [],
            compatibleGenerators: [
                {generatorId: 'first', supportedLabels: [Area.PrimeNumbers]},
                {generatorId: 'second', supportedLabels: [Area.PrimeNumbers, Scope.IntegerNumbers]}
            ]
        })).toEqual([]);
    });

    it('reports every compatible generator that cannot establish a requirement', () => {
        expect(findRequiredLabelContractIssues({
            requiredLabels: [Area.PrimeNumbers],
            viewSupportedLabels: [],
            rejectedLabels: [],
            compatibleGenerators: [
                {generatorId: 'supported', supportedLabels: [Area.PrimeNumbers]},
                {generatorId: 'missing', supportedLabels: [Area.CompositeNumbers]}
            ]
        })).toContainEqual({
            kind: 'generator-missing-required-label',
            generatorId: 'missing',
            label: Area.PrimeNumbers
        });
    });

    it('rejects view-provided, rejected, and generator-less requirements', () => {
        expect(findRequiredLabelContractIssues({
            requiredLabels: [Area.PrimeNumbers],
            viewSupportedLabels: [Area.PrimeNumbers],
            rejectedLabels: [Area.PrimeNumbers],
            compatibleGenerators: []
        })).toEqual([
            {
                kind: 'view-provides-required-label',
                label: Area.PrimeNumbers,
                viewLabel: Area.PrimeNumbers
            },
            {kind: 'required-and-rejected-label', label: Area.PrimeNumbers},
            {kind: 'no-compatible-generator'}
        ]);
    });

    it('restricts applicability requirements to Area and Scope labels', () => {
        expect(findRequiredLabelContractIssues({
            requiredLabels: [Ability.Formalization],
            viewSupportedLabels: [],
            rejectedLabels: [],
            compatibleGenerators: [
                {generatorId: 'writing', supportedLabels: [Ability.Formalization]}
            ]
        })).toContainEqual({
            kind: 'invalid-required-label-kind',
            label: Ability.Formalization
        });
    });
});

describe('findRejectedLabelContractIssues', () => {
    it('accepts a physical boundary established by a compatible generator', () => {
        expect(findRejectedLabelContractIssues({
            rejectedLabels: [Scope.NumbersLarger20]
        })).toEqual([]);
    });

    it('rejects Ability filters while permitting Area and Scope boundaries', () => {
        expect(findRejectedLabelContractIssues({
            rejectedLabels: [Ability.Formalization, Area.MeasuringObjects]
        })).toEqual([
            {kind: 'ability-rejection', label: Ability.Formalization}
        ]);
    });

    it('accepts forward-compatible and ontology-expanded boundaries', () => {
        expect(findRejectedLabelContractIssues({
            rejectedLabels: [Scope.NumbersLarger20, Scope.NumbersLarger100]
        })).toEqual([]);
    });
});
