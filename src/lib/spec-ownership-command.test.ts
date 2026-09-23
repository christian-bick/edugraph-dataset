import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts/generated';
import {validateSpecs} from '../scripts/generator-view-spec-validation.ts';
import {clearModelCatalogCaches, loadViewModelCatalog} from './model-catalog.ts';
import * as typeParser from './type-parser.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fixtureRoot = resolve(projectRoot, 'temp/d4-ownership/fixtures');
const fixtures: string[] = [];
beforeEach(() => {
    const actual = typeParser.getViewToProblemTypeMap();
    vi.spyOn(typeParser, 'getViewToProblemTypeMap').mockReturnValue({...actual,
        'fixture-view': 'ArithmeticPairProblem', 'fixture-view-100': 'ArithmeticPairProblem'});
});
afterEach(() => {
    vi.restoreAllMocks();
    clearModelCatalogCaches();
    for (const fixture of fixtures.splice(0)) {
        if (!resolve(fixture).startsWith(`${fixtureRoot}${sep}`)) throw new Error('Unexpected fixture cleanup path');
        rmSync(fixture, {recursive: true, force: true});
    }
});

function fixture(viewLabel: string, {numericName = false, requiredLabels = [], rejectedLabels = [],
    generatorLabels = [Area.Addition, Scope.ArabicNumerals]}: {
    numericName?: boolean; requiredLabels?: string[]; rejectedLabels?: string[]; generatorLabels?: string[];
} = {}) {
    mkdirSync(fixtureRoot, {recursive: true});
    const root = mkdtempSync(resolve(fixtureRoot, 'gate-'));
    fixtures.push(root);
    const generatorsDir = resolve(root, 'generators');
    const viewsDir = resolve(root, 'views');
    const generatorDir = resolve(generatorsDir, 'fixture-generator');
    const viewId = numericName ? 'fixture-view-100' : 'fixture-view';
    const viewDir = resolve(viewsDir, viewId);
    mkdirSync(generatorDir, {recursive: true});
    mkdirSync(viewDir, {recursive: true});
    writeFileSync(resolve(generatorDir, 'generator.ts'),
        'export class Fixture implements ProblemGenerator<ArithmeticPairProblem, Config> {}');
    writeFileSync(resolve(generatorDir, 'spec.ts'),
        `export const spec = ${JSON.stringify({generalLabels: generatorLabels})};\n`
        + 'export const FixtureGeneratorGeneratorSchema = {};\n');
    writeFileSync(resolve(viewDir, 'spec.ts'),
        `export const spec = ${JSON.stringify({viewId, generalLabels: [Ability.ProcedureExecution], requiredLabels, rejectedLabels})};\n`
        + `export const ${numericName ? 'FixtureView100' : 'FixtureView'}ViewSchema = ${JSON.stringify({notation: [viewLabel]})};\n`);
    return {generatorsDir, viewsDir};
}

describe('public spec validation gate', () => {
    it('executes validation through the public vite-node entry point', () => {
        const output = execFileSync(process.execPath, [
            resolve(projectRoot, 'node_modules/vite-node/dist/cli.mjs'),
            'src/scripts/validate-generator-view-specs.ts'
        ], {cwd: projectRoot, encoding: 'utf8'});
        expect(output).toContain('Starting Spec Validation');
        expect(output).toContain('ownership.modules');
        expect(output).toContain('Spec validation succeeded');
    }, 60_000);

    it('fails on invariant-generator/schema-view Scope overlap even without matched targets', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(await validateSpecs(fixture(Scope.ArabicNumerals))).toBe(false);
        const diagnostics = errors.mock.calls.flat().join('\n');
        expect(diagnostics).toContain('SPEC-8/SPEC-11');
        expect(diagnostics).toContain('generator:fixture-generator generalLabels');
        expect(diagnostics).toContain('view:fixture-view schema.notation');
        expect(diagnostics).toContain(Scope.ArabicNumerals);
    });

    it('accepts independent ownership through the same command implementation', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(await validateSpecs(fixture(Scope.LinearArrangement))).toBe(true);
        expect(errors).not.toHaveBeenCalled();
    });

    it('includes numeric module schema exports in both the public gate and audit catalog', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        const roots = fixture(Scope.ArabicNumerals, {numericName: true});
        expect((await loadViewModelCatalog(roots.viewsDir))[0].schema).toEqual({notation: [Scope.ArabicNumerals]});
        expect(await validateSpecs(roots)).toBe(false);
        expect(errors.mock.calls.flat().join('\n')).toContain('view:fixture-view-100 schema.notation');
    });

    it('fails on a required specialization excluded by an ancestor, with both declaration witnesses', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        const roots = fixture(Scope.LinearArrangement, {generatorLabels: [Area.Square],
            requiredLabels: [Area.Square], rejectedLabels: [Area.Rectangle]});
        expect(await validateSpecs(roots)).toBe(false);
        const diagnostics = errors.mock.calls.flat().join('\n');
        expect(diagnostics).toContain('SPEC-V3/SPEC-V7 [view:fixture-view]');
        expect(diagnostics).toContain(`requiredLabels '${Area.Square}'`);
        expect(diagnostics).toContain(`rejectedLabels '${Area.Rectangle}'`);
        expect(diagnostics).not.toContain('no compatible generator');
    });

    it('accepts a required ancestor with a narrower rejected specialization', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(await validateSpecs(fixture(Scope.LinearArrangement, {generatorLabels: [Area.Rectangle],
            requiredLabels: [Area.Rectangle], rejectedLabels: [Area.Square]}))).toBe(true);
        expect(errors).not.toHaveBeenCalled();
    });

    it('still fails when a compatible pair cannot supply the requirement', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(await validateSpecs(fixture(Scope.LinearArrangement, {requiredLabels: [Area.Rectangle]}))).toBe(false);
        const diagnostics = errors.mock.calls.flat().join('\n');
        expect(diagnostics).toContain(`SPEC-V7 [view:fixture-view] requiredLabels '${Area.Rectangle}'`);
        expect(diagnostics).toContain('fixture-generator#fixture-view');
    });
});
