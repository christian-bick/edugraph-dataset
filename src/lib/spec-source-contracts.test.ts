import {describe, expect, it} from 'vitest';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {findGeneralLabelDeductionIssues, inspectSpecSource} from './spec-source-contracts.ts';

const fixtureFile = fileURLToPath(new URL('./spec-source-contracts.fixture.ts', import.meta.url));
const policiesFile = fileURLToPath(new URL('./target-policies.ts', import.meta.url));

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
            import {rejectTargetLabels, requireTargetLabels} from './target-policies.ts';
            export const spec = {compatibility: [
                rejectTargetLabels('capabilities-are-not-boundaries', deductCompatible([])),
                requireTargetLabels('positive-requirement', deductAdmitting([]))
            ]};
            export const DemoViewSchema = {range: [deductAdmitting([]), choose]};
        `;
        expect(inspectSpecSource(source, fixtureFile).map(issue => [issue.rule, issue.field]))
            .toEqual([['SPEC-V4', 'compatibility'], ['SPEC-V4', 'compatibility'], ['SPEC-10', 'schema']]);
    });

    it('rejects removed policy fields with actionable migration guidance', () => {
        const source = `export const spec = {requiredLabels: ['a'], rejectedLabels: ['b']};`;
        expect(inspectSpecSource(source)).toMatchObject([
            {rule: 'SPEC-V4', field: 'requiredLabels', message: expect.stringContaining('requireTargetLabels')},
            {rule: 'SPEC-V4', field: 'rejectedLabels', message: expect.stringContaining('rejectTargetLabels')}
        ]);
    });

    it('allows rejection expansion through trusted helper aliases and namespace imports', () => {
        const source = `
            import {deductAdmitting as expand} from 'edugraph-ts/generated';
            import {rejectTargetLabels as reject} from './target-policies.ts';
            import * as policy from './compatibility.ts';
            const rejected = expand(['a']);
            export const spec = {compatibility: [
                reject('direct-alias', rejected),
                policy.rejectTargetLabels('namespace-reexport', expand(['b']))
            ]};
        `;
        expect(inspectSpecSource(source, fixtureFile)).toEqual([]);
    });

    it('follows imported compatibility constants and local re-export aliases', () => {
        mkdirSync('temp', {recursive: true});
        const root = mkdtempSync(resolve('temp', 'spec-policy-source-'));
        try {
            const policyImport = relative(root, policiesFile).replaceAll('\\', '/');
            writeFileSync(resolve(root, 'bridge.ts'),
                `export {rejectTargetLabels as reject} from '${policyImport}';\n`);
            writeFileSync(resolve(root, 'shared.ts'), `
                import {deductAdmitting} from 'edugraph-ts';
                import {reject} from './bridge.ts';
                export const labels = deductAdmitting(['a']);
                export const policies = [reject('imported-boundary', labels)];
            `);
            const source = `
                import {policies, labels} from './shared.ts';
                export const spec = {compatibility: policies, generalLabels: labels};
            `;
            expect(inspectSpecSource(source, resolve(root, 'spec.ts')).map(issue => [issue.rule, issue.field]))
                .toEqual([['SPEC-V4', 'generalLabels']]);
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('does not authorize a same-named helper, another argument, or another field', () => {
        const source = `
            import {deductAdmitting} from 'edugraph-ts';
            import {rejectTargetLabels} from './target-policies.ts';
            import {rejectTargetLabels as fakeReject} from 'untrusted-package';
            const unrelated = {rejectTargetLabels: (id, labels) => labels};
            const derived = deductAdmitting(['a']);
            export const spec = {
                compatibility: [
                    rejectTargetLabels('allowed', derived),
                    fakeReject('untrusted', derived),
                    unrelated.rejectTargetLabels('same-name', derived),
                    rejectTargetLabels(deductAdmitting(['b']), [])
                ],
                generalLabels: rejectTargetLabels('wrong-field', derived)
            };
            export const DemoViewSchema = {choice: [rejectTargetLabels('wrong-field', derived), choose]};
        `;
        expect(inspectSpecSource(source, fixtureFile).map(issue => [issue.rule, issue.field]))
            .toEqual([
                ['SPEC-V4', 'compatibility'], ['SPEC-V4', 'compatibility'],
                ['SPEC-V4', 'generalLabels'], ['SPEC-10', 'schema']
            ]);
    });

    it('rejects inline and prematurely called resolvers, but accepts factories and references', () => {
        const source = `
            import {hasLabel, selectExactMatch} from './resolvers.ts';
            import {withLabelChoices} from '../types/schema.ts';
            export const DemoGeneratorSchema = {
                inline: [['a'], (labels: string[]) => labels.includes('a')],
                premature: [['a'], selectExactMatch([])],
                factory: [['a'], hasLabel('a')],
                referenced: [['a'], selectExactMatch],
                choices: [['a'], withLabelChoices(selectExactMatch, {kind: 'target', relation: 'exact'})]
            };
        `;
        expect(inspectSpecSource(source).filter(issue => issue.rule === 'SPEC-6').map(issue => issue.field))
            .toEqual(['inline', 'premature']);
    });

    it('marks dynamically obtained resolver factories for review without guessing failure', () => {
        const source = 'export const DemoViewSchema = {choice: [["x"], toolkit.pickFactory()]}';
        expect(inspectSpecSource(source)).toMatchObject([
            {rule: 'SPEC-6', field: 'choice', severity: 'review'}
        ]);
    });
});
