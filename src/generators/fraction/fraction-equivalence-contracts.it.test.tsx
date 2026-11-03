import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {ReactElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt} from '../../lib/compatibility.ts';
import {loadGeneratorCatalog, loadViewCatalog, type GeneratorCatalogEntry, type ViewCatalogEntry} from '../../lib/generation.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {buildCompatibleModulePairIndex, matchTarget, matchTargets, type GeneratorMatchInfo, type MatchTuple} from '../../lib/matching.ts';
import {generatePlannedDraw} from '../../lib/planned-generation.ts';
import * as randomModule from '../../lib/random.ts';
import {loadMatchingTargets} from '../../lib/spec-validator.ts';
import type {FractionEquivalenceProblem, FractionParts, ProperFractionUnitScalingProblem} from '../../types/problems.ts';
import {FractionEquivalenceView} from '../../visuals/views/fractions/fraction-equivalence-view.tsx';
import {FractionLineView} from '../../visuals/views/numbers/fraction-line-view.tsx';
import {FractionEquivalenceGenerator} from './fraction-equivalence/generator.ts';

const properId = 'fraction-equivalence';
const tenthsId = 'fraction-tenths-equivalence';
const wholeId = 'fraction-whole-equivalence';
const barClassification = 'fractions-equivalence-model';
const lineClassification = 'numbers-fraction-line-classification';
const barCompletion = 'fractions-equivalence-completion-model';
const barExplanation = 'fractions-equivalence-explanation-model';
const lineCompletion = 'numbers-fraction-line-formalization';
const lineExplanation = 'numbers-fraction-line-explanation';
const unitScaling = 'fractions-equivalence-unit-scaling';
const classificationIds = [barClassification, lineClassification];
const completionIds = [barCompletion, barExplanation, lineCompletion, lineExplanation];
const viewIds = [...classificationIds, ...completionIds, unitScaling];
const flags = [
    {usesMultiplication: false, usesProportionalScaling: false},
    {usesMultiplication: true, usesProportionalScaling: false},
    {usesMultiplication: false, usesProportionalScaling: true},
    {usesMultiplication: true, usesProportionalScaling: true}
] as const;
const affectedLineages = [
    ['3.NF.A.3a-recognize-equivalent-fractions~1464bdaa', properId, barClassification, 2],
    ['3.NF.A.3a-recognize-equivalent-fractions~4886118b', properId, lineClassification, 2],
    ['3.NF.A.3b-generate-explain-equivalent-fractions~84678c5a', properId, barExplanation, 2],
    ['3.NF.A.3b-generate-explain-equivalent-fractions~75018beb', properId, lineExplanation, 2],
    ['4.NF.A.1-equivalent-fraction-scaling~bcb9263f', properId, barExplanation, 2],
    ['4.NF.A.1-equivalent-fraction-scaling~09856648', properId, lineExplanation, 2],
    ['5.NF.B.5b-equivalence-unit-scaling~a66b973b', properId, unitScaling, 2]
] as const;
const controlLineages = [
    ['3.NF.A.3b-generate-explain-equivalent-fractions~84678c5a', tenthsId, barExplanation, 1],
    ['3.NF.A.3b-generate-explain-equivalent-fractions~75018beb', tenthsId, lineExplanation, 1],
    ['4.NF.A.1-equivalent-fraction-scaling~bcb9263f', tenthsId, barExplanation, 1],
    ['4.NF.A.1-equivalent-fraction-scaling~09856648', tenthsId, lineExplanation, 1],
    ['4.NF.C.5-tenths-to-hundredths~8d4de1af', tenthsId, barCompletion, 2],
    ['4.NF.C.5-tenths-to-hundredths~8d4de1af', tenthsId, barExplanation, 2],
    ['3.NF.A.3c-whole-numbers-as-fractions~a3ecb7d2', wholeId, lineCompletion, 4],
    ['3.NF.A.3c-whole-numbers-as-fractions~a3ecb7d2', wholeId, lineExplanation, 4],
    ['3.NF.A.3c-whole-numbers-as-fractions~0e5bee6e', wholeId, lineCompletion, 4],
    ['3.NF.A.3c-whole-numbers-as-fractions~0e5bee6e', wholeId, lineExplanation, 4]
] as const;
const lineages = [...affectedLineages, ...controlLineages];

const unitMultipliers = {2: {numerator: 2, denominator: 2, value: 1},
    3: {numerator: 3, denominator: 3, value: 1}, 4: {numerator: 4, denominator: 4, value: 1}} as const;
const fixture = (numerator: number, denominator: FractionParts, scaleFactor: 2 | 3 | 4): ProperFractionUnitScalingProblem => ({
    task: 'relate-equivalent-fractions', first: {numerator, denominator},
    second: {numerator: numerator * scaleFactor, denominator: denominator * scaleFactor as FractionParts},
    scaleFactor, unitMultiplier: unitMultipliers[scaleFactor], relation: 'equal'
});
// Hand-authored native mathematical support, independent of the production domain table.
const native = [fixture(1, 2, 2), fixture(1, 2, 3), fixture(1, 2, 4), fixture(1, 3, 2),
    fixture(2, 3, 2), fixture(1, 4, 2), fixture(2, 4, 2), fixture(3, 4, 2)];
const key = (data: ProperFractionUnitScalingProblem): string =>
    `${data.first.numerator}/${data.first.denominator}=${data.second.numerator}/${data.second.denominator}`;

type Rational = readonly [bigint, bigint];
const integer = (value: number): Rational => [BigInt(value), 1n];
const compare = ([a, b]: Rational, [c, d]: Rational): number => a * d < c * b ? -1 : a * d > c * b ? 1 : 0;
const rational = (value: {numerator: number; denominator: number}): Rational => [BigInt(value.numerator), BigInt(value.denominator)];
const thresholds = [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000];

/** A displayed part count is an integer quantity even when its fraction has value below one. */
function rangeLabels(data: FractionEquivalenceProblem, zeroReference: boolean): string[] {
    let values: Rational[];
    if (data.task === 'relate-equivalent-fractions') {
        expect(data.first.numerator * data.second.denominator).toBe(data.second.numerator * data.first.denominator);
        expect(data.second.numerator).toBe(data.first.numerator * data.scaleFactor);
        expect(data.second.denominator).toBe(data.first.denominator * data.scaleFactor);
        expect(data.unitMultiplier).toEqual({numerator: data.scaleFactor, denominator: data.scaleFactor, value: 1});
        values = [rational(data.first), rational(data.second), integer(data.first.numerator), integer(data.first.denominator),
            integer(data.second.numerator), integer(data.second.denominator), integer(data.scaleFactor), integer(1)];
    } else if (data.task === 'tenths-to-hundredths') {
        expect(data.hundredths.numerator).toBe(data.tenths.numerator * 10);
        expect(data.tenths.denominator).toBe(10);
        expect(data.hundredths.denominator).toBe(100);
        values = [rational(data.tenths), rational(data.hundredths), integer(data.tenths.numerator), integer(10),
            integer(data.hundredths.numerator), integer(100), integer(1)];
    } else {
        expect(data.fraction.numerator).toBe(data.wholeNumber * data.fraction.denominator);
        values = [integer(data.wholeNumber), rational(data.fraction), integer(data.fraction.numerator), integer(data.fraction.denominator)];
    }
    if (zeroReference) values.push(integer(0));
    const ordered = values.sort(compare);
    const upper = thresholds.find(value => compare(ordered.at(-1)!, integer(value)) <= 0)!;
    const lower = thresholds.findLast(value => compare(ordered[0]!, integer(value)) >= 0) ?? 0;
    expect(upper).toBeDefined();
    expect(lower).toBeLessThan(upper);
    return [`NumbersSmaller${upper}`, ...(lower ? [`NumbersLarger${lower}`] : [])].sort();
}

let generators: GeneratorCatalogEntry[];
let views: ViewCatalogEntry[];
let tuples: MatchTuple[];
let unitCore: (props: never) => ReactElement;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const root = fileURLToPath(new URL('../../../', import.meta.url));
    [generators, views] = await Promise.all([
        loadGeneratorCatalog(undefined, undefined, new Map([properId, tenthsId, wholeId].map(id =>
            [id, resolve(root, 'src/generators/fraction', id, 'spec.ts')]))),
        loadViewCatalog(undefined, undefined, new Map(viewIds.map(id => [id,
            resolve(root, 'src/visuals/views', id.startsWith('numbers-') ? 'numbers' : 'fractions', id, 'spec.ts')])))
    ]);
    unitCore = (await import('../../visuals/views/fractions/fractions-equivalence-unit-scaling/view.tsx')).FractionsEquivalenceUnitScalingCore;
    tuples = matchTargets(await loadMatchingTargets('ccss'), generators, views).tuples;
});
afterAll(() => vi.unstubAllGlobals());

const render = (id: string, data: unknown, solution: boolean): string => {
    const payload = {viewId: id, problem: {type: 'fraction', data, labels: []}, targetLabels: [], isSolutionView: solution, seed: 42};
    if (id === unitScaling) return renderToStaticMarkup(unitCore({payload} as never));
    const mode = classificationIds.includes(id) ? 'classification'
        : id === barExplanation || id === lineExplanation ? 'explanation' : 'formalization';
    return renderToStaticMarkup(id.startsWith('numbers-')
        ? <FractionLineView mode={mode} payload={payload as never} />
        : <FractionEquivalenceView mode={mode} payload={payload as never} viewId={id} />);
};
const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const flagLabels = (config: typeof flags[number]): string[] => [
    ...(config.usesMultiplication ? [Area.Multiplication] : []), ...(config.usesProportionalScaling ? [Area.ProportionalScaling] : [])
];

describe('proper-fraction equivalence range and projection contracts', () => {
    it('preserves the existing nominal producer and all seven consumers plus the shared-family arms', () => {
        expect(generators.find(generator => generator.generatorId === properId)!.problemType).toBe('ProperFractionUnitScalingProblem');
        const pairs = buildCompatibleModulePairIndex(generators, views).orderedPairs;
        expect(pairs.map(pair => `${pair.generator.generatorId}#${pair.view.viewId}`).sort()).toEqual([
            ...viewIds.map(id => `${properId}#${id}`), ...completionIds.map(id => `${tenthsId}#${id}`),
            ...[lineCompletion, lineExplanation].map(id => `${wholeId}#${id}`)
        ].sort());
        expect(tuples.map(tuple => `${tuple.target.id}#${tuple.generatorId}#${tuple.viewId}`).sort())
            .toEqual(lineages.map(([target, generator, view]) => `${target}#${generator}#${view}`).sort());
        expect(tuples.reduce((total, tuple) => total + enumerateDependencyAuditSelections(tuple.plan).selections.length, 0)).toBe(38);
    });

    it.each(flags)('preserves all eight mathematical outcomes independently of flags %o', config => {
        const generator = new FractionEquivalenceGenerator();
        const random = vi.spyOn(randomModule, 'random');
        try {
            for (const upper of [5, 10]) {
                const expected = native.filter(data => rangeLabels(data, false)[0] === `NumbersSmaller${upper}`);
                const actual: ProperFractionUnitScalingProblem[] = [];
                for (let index = 0; index < expected.length; index++) {
                    random.mockReturnValue((index + 0.5) / expected.length);
                    actual.push(generator.generate({...config, range: createCanonicalNumericRange(upper)}).data);
                }
                expect(actual.map(key).sort()).toEqual(expected.map(key).sort());
                expect(actual).toEqual(expected);
            }
        } finally { random.mockRestore(); }
    });

    it('counts explicit four-of-eight parts while retaining the upper5 boundary at two-of-four', () => {
        expect(rangeLabels(fixture(1, 2, 2), false)).toEqual(['NumbersSmaller5']);
        expect(rangeLabels(fixture(1, 2, 4), false)).toEqual(['NumbersSmaller10']);
        expect(native.map(data => rangeLabels(data, true)[0])).toEqual(['NumbersSmaller5', ...Array(7).fill('NumbersSmaller10')]);
    });

    it.each(viewIds)('checks all four selected-claim profiles for %s without broadening classification', id => {
        const original = generators.find(generator => generator.generatorId === properId)!;
        const view = views.find(view => view.viewId === id)!;
        for (const config of flags) {
            const claims = flagLabels(config);
            const target = {id: `future-equivalence-${id}-${claims.join('-')}`, labels: [Area.FractionEquivalence,
                Scope.ProperFractions, Scope.EqualShares, Scope.Equal, ...claims]};
            const accepted = !classificationIds.includes(id) || claims.length === 0;
            expect(matchTarget(target, original, view).matched).toBe(accepted && (id !== unitScaling || config.usesProportionalScaling));
            // Freeze the same selected claims as producer capabilities while omitting them
            // from the request: a target-only exclusion would miss this case.
            const generalLabels = [...original.spec.generalLabels, ...claims, Scope.NumbersSmaller10];
            const selected: GeneratorMatchInfo = {...original, labels: generalLabels, generalLabels, schema: {},
                spec: {...original.spec, generalLabels}};
            const partialTarget = {...target, labels: [Area.FractionEquivalence, ...(id === unitScaling ? [Area.ProportionalScaling] : [])]};
            expect(matchTarget(partialTarget, selected, view).matched)
                .toBe(accepted && (id !== unitScaling || config.usesProportionalScaling));
            // Flags describe supported mathematical evidence, never a different payload family.
            for (const upper of [5, 10]) {
                randomModule.setSeed(42);
                const data = new FractionEquivalenceGenerator().generate({...config, range: createCanonicalNumericRange(upper)}).data;
                for (const solution of [false, true]) expect(() => render(id, data, solution)).not.toThrow();
            }
        }
    });

    it.each(classificationIds)('retains the equivalence-only classification task in both modes for %s', id => {
        for (const data of native) {
            const question = visible(render(id, data, false));
            const solution = visible(render(id, data, true));
            expect(question).toContain('Equivalent or not equivalent?');
            expect(question).not.toMatch(/Scale each|Scale both|×|The (?:two )?fractions are equivalent/);
            expect(solution).toContain('fractions are equivalent.');
            expect(solution).not.toContain('×');
        }
    });

    it.each(completionIds)('keeps the numerator unknown and shows scaling evidence in both modes for %s', id => {
        const data = fixture(1, 2, 4);
        const question = visible(render(id, data, false));
        const solution = visible(render(id, data, true));
        expect(question).toContain('1 × 4 = ?');
        expect(question).toContain('2 × 4 = 8');
        expect(question).not.toContain('1 × 4 = 4');
        expect(solution).toContain('1 × 4 = 4');
        expect(solution).toContain('2 × 4 = 8');
        if (id.startsWith('numbers-')) {
            expect(question).toContain('1/2 = ?/8');
            expect(question).not.toContain('4/8');
            expect(solution).toContain('1/2 = 4/8');
        }
    });

    it.each(completionIds)('preserves shared-family rendering and rejection boundaries for %s', id => {
        const tenths = {task: 'tenths-to-hundredths', tenths: {numerator: 4, denominator: 10},
            hundredths: {numerator: 40, denominator: 100}, scaleFactor: 10, sharedWhole: 1, relation: 'equal'};
        const whole = {task: 'represent-whole-as-fraction', wholeNumber: 2,
            fraction: {numerator: 12, denominator: 6}, relation: 'equal'};
        for (const solution of [false, true]) {
            expect(render(id, tenths, solution)).toContain(id.startsWith('numbers-') ? '<svg' : 'role="img"');
            if (id.startsWith('numbers-')) {
                const markup = visible(render(id, whole, solution));
                expect(markup).toContain(solution ? '2 = 12/6' : '2 = ?/6');
            } else expect(() => render(id, whole, solution)).toThrow(/Validation Error/);
            for (const restricted of [...classificationIds, unitScaling]) {
                expect(() => render(restricted, tenths, solution)).toThrow(/Validation Error/);
                expect(() => render(restricted, whole, solution)).toThrow(/Validation Error/);
            }
        }
    });

    it.each(lineages)('independently verifies all selections and receipt replays for %s / %s / %s', (targetId, generatorId, viewId, count) => {
        const tuple = tuples.find(tuple => tuple.target.id === targetId && tuple.generatorId === generatorId && tuple.viewId === viewId)!;
        const generator = generators.find(generator => generator.generatorId === generatorId)!;
        const view = views.find(view => view.viewId === viewId)!;
        const enumeration = enumerateDependencyAuditSelections(tuple.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).toHaveLength(count);
        for (const selection of enumeration.selections) for (let seed = 0; seed < 8; seed++) {
            const sampleKey = `${targetId}#${generatorId}#${viewId}#train#question#inst:0`;
            const input = {generator: generator.generator, generatorSpec: generator.spec, viewSchema: view.schema, viewSpec: view.spec,
                plan: tuple.plan, sampleKey, seed, attempt: 1, replay: {version: 1 as const, sampleKey, seed, attempt: 1,
                    selection: createGenerationSelectionReceipt(tuple.plan, selection.choices)}};
            const draw = generatePlannedDraw(input);
            expect(draw.stub).not.toBeNull();
            expect(draw.labels.map(label => label.slice(label.lastIndexOf('/') + 1)).filter(label => /^Numbers(?:Smaller|Larger)\d+$/.test(label)).sort())
                .toEqual(rangeLabels(draw.stub!.data as FractionEquivalenceProblem, viewId.startsWith('numbers-')));
            expect(draw.labels).toContain(Scope.NumbersWithoutNegatives);
            expect(draw.labels).toContain(viewId.startsWith('numbers-') ? Scope.NumbersWithZero : Scope.NumbersWithoutZero);
            expect(generatePlannedDraw(input)).toEqual(draw);
        }
    });
});
