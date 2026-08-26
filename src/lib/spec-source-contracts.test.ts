import {describe, expect, it} from 'vitest';
import {findGeneralLabelDeductionIssues} from './spec-source-contracts.ts';

describe('findGeneralLabelDeductionIssues', () => {
    it('rejects deductCompatible inside generalLabels', () => {
        const source = `
            import {deductCompatible, Scope} from 'edugraph-ts';
            export const spec = {
                generalLabels: [
                    Scope.IntegerNumbers,
                    ...deductCompatible([Scope.NumbersSmaller100])
                ]
            };
        `;

        expect(findGeneralLabelDeductionIssues(source)).toEqual([{line: 6, column: 24}]);
    });

    it('rejects an aliased or namespace-qualified call inside generalLabels', () => {
        const aliased = `
            import {deductCompatible as expandCapabilities} from 'edugraph-ts';
            export const spec = {generalLabels: [...expandCapabilities([])]};
        `;
        const qualified = `
            import * as ontology from 'edugraph-ts';
            export const spec = {generalLabels: ontology.deductCompatible([])};
        `;

        expect(findGeneralLabelDeductionIssues(aliased)).toHaveLength(1);
        expect(findGeneralLabelDeductionIssues(qualified)).toHaveLength(1);
    });

    it('allows deductCompatible in a schema capability declaration', () => {
        const source = `
            import {deductCompatible, Scope} from 'edugraph-ts';
            export const spec = {generalLabels: [Scope.IntegerNumbers]};
            export const GeneratorSchema = {
                range: [deductCompatible([Scope.NumbersSmaller100]), resolveRange]
            };
        `;

        expect(findGeneralLabelDeductionIssues(source)).toEqual([]);
    });
});
