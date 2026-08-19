import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {findRequiredLabelContractIssues} from './spec-contracts.ts';

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
});
