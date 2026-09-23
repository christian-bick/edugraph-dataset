import {describe, expect, it} from 'vitest';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {findGeneralLabelDeductionIssues, inspectSpecSource} from './spec-source-contracts.ts';

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

    it('follows generated-package aliases and intermediate constants but not same-named object methods', () => {
        const source = `
            import {deductCompatible as expand} from 'edugraph-ts/generated';
            const derived = expand([]);
            const unrelated = {deductCompatible: (labels: string[]) => labels};
            export const spec = {generalLabels: [...derived, ...unrelated.deductCompatible([])]};
        `;
        expect(inspectSpecSource(source).map(issue => [issue.rule, issue.field]))
            .toEqual([['SPEC-10', 'generalLabels']]);
    });

    it('follows simple local re-exports and imported declaration constants', () => {
        mkdirSync('temp', {recursive: true});
        const root = mkdtempSync(resolve('temp', 'spec-source-'));
        try {
            writeFileSync(resolve(root, 'bridge.ts'),
                "export {deductCompatible as expand} from 'edugraph-ts/generated';\n");
            writeFileSync(resolve(root, 'shared.ts'),
                "import {expand} from './bridge.ts'; export const labels = expand([]);\n");
            const file = resolve(root, 'spec.ts');
            const source = "import {labels} from './shared.ts'; export const spec = {generalLabels: labels};";
            expect(inspectSpecSource(source, file).map(issue => issue.rule)).toEqual(['SPEC-10']);
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('keeps capability and boundary deduction operators in their respective fields', () => {
        const source = `
            import {deductCompatible, deductAdmitting} from 'edugraph-ts';
            export const spec = {rejectedLabels: deductCompatible([]), requiredLabels: deductAdmitting([])};
            export const DemoViewSchema = {range: [deductAdmitting([]), choose]};
        `;
        expect(inspectSpecSource(source).map(issue => [issue.rule, issue.field]))
            .toEqual([['SPEC-V4', 'rejectedLabels'], ['SPEC-V4', 'requiredLabels'], ['SPEC-10', 'schema']]);
    });

    it('rejects inline and prematurely called resolvers, but accepts factories and references', () => {
        const source = `
            import {hasLabel, selectExactMatch} from './resolvers.ts';
            export const DemoGeneratorSchema = {
                inline: [['a'], (labels: string[]) => labels.includes('a')],
                premature: [['a'], selectExactMatch([])],
                factory: [['a'], hasLabel('a')],
                referenced: [['a'], selectExactMatch]
            };
        `;
        expect(inspectSpecSource(source).filter(issue => issue.rule === 'SPEC-6').map(issue => issue.field))
            .toEqual(['inline', 'premature']);
    });
});
