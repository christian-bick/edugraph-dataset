import {Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import * as rng from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {spec as gradeFive} from '../../../spec/ccss/grade-05.ts';
import type {UnlikeFractionOperationProblem, UnlikeMixedOperationProblem} from '../../../types/problems.ts';
import {FractionArithmeticView} from '../../../visuals/views/fractions/fraction-arithmetic-view.tsx';
import {presentFractionArithmeticProblem} from '../../../visuals/views/fractions/fraction-arithmetic-presentation.ts';
import {spec as modelSpec} from '../../../visuals/views/fractions/fractions-operation-model/spec.ts';
import {spec as wordSpec} from '../../../visuals/views/fractions/fractions-word-problem/spec.ts';
import {createUnlikeFractionOperationProblem, createUnlikeMixedOperationProblem, FractionArithmeticGenerator,
    unlikeFractionMagnitudeRows, unlikeMixedRangeRows} from './generator.ts';
import {FractionArithmeticGeneratorSchema as schema, spec} from './spec.ts';

type Unlike = UnlikeFractionOperationProblem | UnlikeMixedOperationProblem;
const bounds = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100]] as const;
const quantities = (data: Unlike) => [1, data.commonDenominator,
    ...[data.first, data.second].flatMap(value => [value.denominator, value.numerator,
        ('whole' in value ? Number(value.whole) : 0) + value.numerator / value.denominator]),
    ...[data.firstConversion, data.secondConversion].flatMap(value => [value.factor,
        value.fractionalNumeratorAtCommonDenominator, value.improperNumeratorAtCommonDenominator]),
    data.resultAtCommonDenominator.numerator, data.resultAtCommonDenominator.numerator / data.commonDenominator];
const candidateKey = (sample: object) => JSON.stringify(sample);
afterEach(() => vi.restoreAllMocks());

describe('prescribed common-part fraction ranges', () => {
    const poolContexts = (['addition', 'subtraction'] as const).flatMap(operation =>
        (['proper', 'improper', 'mixed'] as const).map(kind => ({operation, kind})));
    const observedPoolPaths = new Map<string, number>();
    afterAll(() => {
        expect(observedPoolPaths.size).toBe(6);
        expect([...observedPoolPaths.keys()].sort()).toEqual(poolContexts.map(({operation, kind}) => operation + ':' + kind).sort());
        expect([...observedPoolPaths.values()].reduce((sum, count) => sum + count, 0)).toBe(4908);
    });
    it.each(poolContexts)('partitions every old $operation/$kind pool path with its exact conditional law', ({operation, kind}) => {
        const generator = new FractionArithmeticGenerator(), draw = vi.spyOn(rng, 'random');
        let paths = 0;
        const original = kind === 'mixed' ? unlikeMixedRangeRows(operation) : unlikeFractionMagnitudeRows(operation, kind);
        const seen = new Set<string>(), expected = new Set(original.flatMap(pool => pool.retained.map(row => `${pool.profile}:${candidateKey(row)}`)));
        for (const [, upper] of bounds) {
            const range = createCanonicalNumericRange(upper);
            const pools = kind === 'mixed' ? unlikeMixedRangeRows(operation, range) : unlikeFractionMagnitudeRows(operation, kind, range);
            const mass = pools.reduce((sum, pool) => sum + pool.weight, 0);
            let before = 0;
            for (const pool of pools) {
                expect(pool.originalCount).toBe(original.find(p => p.profile === pool.profile)!.originalCount);
                expect(pool.weight).toBe(pool.retained.length / pool.originalCount);
                for (const [index, sample] of pool.retained.entries()) {
                    const key = `${pool.profile}:${candidateKey(sample)}`;
                    expect(seen.has(key)).toBe(false); seen.add(key);
                    draw.mockReset().mockReturnValueOnce((before + pool.weight / 2) / mass)
                        .mockReturnValueOnce((index + 0.5) / pool.retained.length);
                    const data = generator.generate({task: kind === 'mixed' ? 'unlike-mixed-operation'
                        : kind === 'proper' ? 'unlike-fraction-operation-proper' : 'unlike-fraction-operation-improper',
                        operation, usesCommonDenominator: false, range}).data as Unlike;
                    expect({first: data.first, second: data.second, commonDenominator: data.commonDenominator}).toEqual(sample);
                    expect(hasCanonicalRangeWitness(quantities(data), range)).toBe(true);
                    expect(quantities(data).every(n => n > 0)).toBe(true);
                    expect(draw).toHaveBeenCalledTimes(2);
                    paths++;
                }
                before += pool.weight;
            }
        }
        expect(seen).toEqual(expected);
        observedPoolPaths.set(operation + ':' + kind, paths);
    });

    it('exhaustively verifies the original mixed straight/regroup/nonleast paths independently', () => {
        const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
        for (const operation of ['addition', 'subtraction'] as const) {
            const expected = new Map(['straight', 'regroup', 'nonleast'].map(profile => [profile, new Set<string>()]));
            for (const d1 of [2, 3, 4, 6, 8] as const) for (const d2 of [2, 3, 4, 6, 8] as const) {
                if (d1 === d2) continue;
                const least = d1 * d2 / gcd(d1, d2);
                for (const commonDenominator of [least, 2 * least].filter(n => n <= 24))
                    for (let a = 1; a < d1; a++) for (let b = 1; b < d2; b++) {
                        const first = {whole: operation === 'addition' ? 1 : 2, numerator: a, denominator: d1};
                        const second = {whole: 1, numerator: b, denominator: d2};
                        const firstParts = a * commonDenominator / d1, secondParts = b * commonDenominator / d2;
                        const total = first.whole * commonDenominator + firstParts + (operation === 'addition' ? 1 : -1) * (commonDenominator + secondParts);
                        if (total <= 0 || total > 4 * commonDenominator) continue;
                        const key = candidateKey({first, second, commonDenominator});
                        const regroup = operation === 'addition' ? firstParts + secondParts >= commonDenominator : firstParts < secondParts;
                        expected.get(regroup ? 'regroup' : 'straight')!.add(key);
                        if (commonDenominator > least) expected.get('nonleast')!.add(key);
                    }
            }
            for (const pool of unlikeMixedRangeRows(operation)) expect(new Set(pool.retained.map(candidateKey))).toEqual(expected.get(pool.profile));
        }
    });

    it('keeps the selected denominator visible but conversions and answers unknown in every projection', () => {
        for (const common of [4, 8]) for (const operation of ['addition', 'subtraction'] as const) {
            const data = createUnlikeFractionOperationProblem(operation, {numerator: 1, denominator: 2}, {numerator: 1, denominator: 4}, common)!;
            for (const presentation of ['execution-model', 'execution-word'] as const) {
                const projected = presentFractionArithmeticProblem(data, presentation)!;
                expect(projected).toHaveProperty('commonDenominator', common);
                const render = (isSolutionView: boolean) => renderToStaticMarkup(<FractionArithmeticView
                    layout={presentation === 'execution-word' ? 'word' : 'model'} presentation={presentation} viewId="unlike-proof"
                    payload={{problem: {type: 'fraction', data, labels: []}, viewId: 'unlike-proof', targetLabels: [], seed: 0, isSolutionView}} />);
                expect(render(false)).toContain(`Use a common-part model with ${common} equal parts per one-mile whole.`);
                expect(render(false)).not.toContain('Choose a common denominator');
                expect(render(false)).not.toContain(`1/2 × ${common / 2}/${common / 2}`);
                expect(render(true)).toContain(`1/2 × ${common / 2}/${common / 2}`);
            }
            expect(presentFractionArithmeticProblem(data, 'interpretation')).toBeNull();
            expect(presentFractionArithmeticProblem(data, 'understanding')).toBeNull();
        }
        expect(createUnlikeMixedOperationProblem('addition', {whole: 1, numerator: 1, denominator: 2},
            {whole: 1, numerator: 1, denominator: 4}, 8)).not.toBeNull();
    });

    it('retains all eight real Grade5 routes and validates every resolved canonical choice and native continuation', () => {
        const targets = gradeFive.filter(t => t.labels.includes(Scope.UnlikeDenominators)
            && (t.id.startsWith('5.NF.A.1-unlike-denominator-arithmetic~') || t.id.startsWith('5.NF.A.2-fraction-word-problems~')));
        const generator = new FractionArithmeticGenerator();
        let routes = 0, selections = 0;
        for (const target of targets) for (const viewSpec of [modelSpec, wordSpec]) {
            const matched = planModelCompatibility(target, {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: {}, spec: viewSpec});
            if (!matched.supported) continue;
            routes++;
            for (const choice of enumerateDependencyAuditSelections(matched.plan).selections) {
                const choices = Object.fromEntries(choice.choices.filter(c => c.owner === 'generator').map(c => [c.field,
                    matched.plan.domains.find(d => d.owner === c.owner && d.field === c.field)!.alternatives
                        .find(alternative => alternative.id === c.alternativeId)!.labels]));
                const resolved = resolveSchemaChoices(schema, target.labels, choices), range = resolved.config.range!;
                expect(range.max).toBeLessThanOrEqual(100);
                expect(resolved.resolvedLabels.some(label => bounds.some(([bound]) => label === bound))).toBe(true);
                rng.setSeed(24);
                const stub = generator.generate(resolved.config), continuation = rng.getRandomState();
                rng.setSeed(24);
                expect(generator.generate(resolved.config)).toEqual(stub);
                expect(rng.getRandomState()).toBe(continuation);
                expect(hasCanonicalRangeWitness(quantities(stub.data as Unlike), range)).toBe(true);
                const direct = extractConfig(schema, choice.labels);
                expect(direct.config).toEqual(resolved.config);
                const draw = vi.spyOn(rng, 'random');
                for (const boundary of [0, (2 ** 32 - 1) / 2 ** 32]) {
                    draw.mockReset().mockReturnValue(boundary);
                    const data = generator.generate(resolved.config).data as Unlike;
                    expect(hasCanonicalRangeWitness(quantities(data), range)).toBe(true);
                    expect(quantities(data).every(n => n > 0)).toBe(true);
                    expect(draw).toHaveBeenCalledTimes(2);
                }
                draw.mockRestore();
                for (const isSolutionView of [false, true]) {
                    const markup = renderToStaticMarkup(<FractionArithmeticView layout={viewSpec === wordSpec ? 'word' : 'model'}
                        presentation={viewSpec === wordSpec ? 'execution-word' : 'execution-model'} viewId={viewSpec.viewId}
                        payload={{problem: {type: 'fraction', data: stub.data, labels: choice.labels}, viewId: viewSpec.viewId,
                            targetLabels: target.labels, seed: 0, isSolutionView}} />);
                    expect(markup).toContain(`Use a common-part model with ${(stub.data as Unlike).commonDenominator} equal parts per one-mile whole.`);
                    expect(markup).not.toMatch(/NaN|undefined/);
                }
                selections++;
            }
        }
        expect(routes).toBe(8);
        expect(selections).toBe(55);
    });
});
