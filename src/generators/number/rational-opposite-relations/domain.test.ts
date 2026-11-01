import {Ability, Area, Scope} from 'edugraph-ts';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as random from '../../../lib/random.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {RationalOppositeBody} from '../../../visuals/views/numbers/rational-opposite-view.tsx';
import {spec as doubleView} from '../../../visuals/views/numbers/numbers-double-opposite/spec.ts';
import {spec as pairView} from '../../../visuals/views/numbers/numbers-opposite-locations/spec.ts';
import {spec as zeroView} from '../../../visuals/views/numbers/numbers-zero-opposite/spec.ts';
import {rationalOppositeRangeProfiles, type OppositeRelation} from './domain.ts';
import {RationalOppositeRelationsGenerator} from './generator.ts';
import {RationalOppositeRelationsGeneratorSchema as schema, spec} from './spec.ts';

afterEach(() => vi.restoreAllMocks());
const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
const key = (radius: number, numerator: number, denominator: number, original: number, opposite: number) => {
    const divisor = gcd(numerator, denominator);
    return `${radius}:${numerator / divisor}/${denominator / divisor}:${original}:${opposite}`;
};

describe('relation-aware finite opposite range profiles', () => {
    it('retains all 14,168 raw lattice/point paths and their conditional probability mass', () => {
        const generator = new RationalOppositeRelationsGenerator();
        const draw = vi.spyOn(random, 'random');
        let paths = 0;
        for (const relation of ['iterated-negation', 'nonzero-opposition', 'zero-fixed-point'] as const) {
            const expected = new Map<string, number>();
            for (let radius = 2; radius <= 5; radius++) {
                const cap = Math.floor(10 / radius);
                for (let numerator = 1; numerator <= cap; numerator++) for (const denominator of [1, 2])
                    for (let original = -radius; original <= radius; original++) {
                        if (relation === 'zero-fixed-point' && original !== 0 || relation === 'nonzero-opposition' && original === 0) continue;
                        const originalCount = relation === 'zero-fixed-point' ? 1 : relation === 'nonzero-opposition' ? 2 * radius : 2 * radius + 1;
                        for (let opposite = 1; opposite <= radius; opposite++) {
                            const id = key(radius, numerator, denominator, original, opposite);
                            expected.set(id, (expected.get(id) ?? 0) + 1 / 4 / cap / 2 / originalCount / radius);
                        }
                    }
            }
            const actual = new Map<string, number>();
            let mass = 0;
            for (const upper of [5, 10]) {
                const range = createCanonicalNumericRange(upper);
                const profiles = rationalOppositeRangeProfiles(relation, range);
                expect(rationalOppositeRangeProfiles(relation, range)).toBe(profiles);
                const total = profiles.reduce((sum, profile) => sum + profile.weight, 0);
                let preceding = 0;
                for (const profile of profiles) {
                    const {radiusTicks: radius, step, originalTick: original, oppositeMagnitudeTick: opposite} = profile;
                    const id = key(radius, step.numerator, step.denominator, original, opposite);
                    actual.set(id, (actual.get(id) ?? 0) + profile.weight);
                    mass += profile.weight;
                    for (let first = 1; first <= radius; first++) for (let second = 1; second <= radius; second++) {
                        if (first === second) continue;
                        const secondDraw = second > first ? second - 1 : second;
                        const draws = [(preceding + profile.weight / 2) / total, (first - 0.5) / radius, (secondDraw - 0.5) / (radius - 1)];
                        draw.mockImplementation(() => {
                            const next = draws.shift();
                            if (next === undefined) throw new Error('Unexpected opposite-model draw');
                            return next;
                        });
                        const {data} = generator.generate({relation, range});
                        expect(draws).toEqual([]);
                        expect(data.axis.zeroIndex).toBe(radius);
                        expect(data.axis.step).toEqual(step);
                        expect(data.original.tickIndex - radius).toBe(original);
                        expect(data.oppositePair.positive.tickIndex - radius).toBe(opposite);
                        expect(data.unequalSignedPair.negative.tickIndex - radius).toBe(-first);
                        expect(data.unequalSignedPair.positive.tickIndex - radius).toBe(second);
                        const maximum = (relation === 'iterated-negation' ? Math.abs(original) || opposite : radius) * step.numerator / step.denominator;
                        expect(hasCanonicalRangeWitness([0, maximum], range)).toBe(true);
                        expect(data.axis.maximum.numerator / data.axis.maximum.denominator).toBeLessThanOrEqual(10);
                        paths++;
                    }
                    preceding += profile.weight;
                }
            }
            expect(actual.size).toBe(expected.size);
            for (const [id, weight] of expected) expect(actual.get(id)).toBeCloseTo(weight, 15);
            expect(mass).toBeCloseTo(1, 13);
        }
        expect(paths).toBe(14168);
    });

    it('validates both canonical bands in direct/planned configurations and each actual question/solution projection', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        const generator = new RationalOppositeRelationsGenerator();
        const models = [
            {relation: 'iterated-negation', task: 'double-opposite', areas: [Area.RulesOfSigns], view: doubleView},
            {relation: 'nonzero-opposition', task: 'opposite-locations', areas: [] as string[], view: pairView},
            {relation: 'zero-fixed-point', task: 'zero-opposite', areas: [Area.Zero], view: zeroView}
        ] as const;
        for (const {relation, task, areas, view} of models) for (const [bound, upper] of [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10]] as const) {
            const labels = [...spec.generalLabels, ...view.generalLabels, ...areas, bound];
            const direct = extractConfig(schema, labels);
            const planned = resolveSchemaChoices(schema, labels, {relation: areas, range: [bound]});
            expect(planned.config).toEqual(direct.config);
            expect(direct.config).toEqual({relation, range: createCanonicalNumericRange(upper)});
            const target = {id: 'opposite-band', labels};
            const match = planModelCompatibility(target, {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view});
            expect(match.supported).toBe(true);
            if (!match.supported) throw new Error('Expected opposite-band match');
            const input = {generator, generatorSpec: spec, viewSchema: {}, viewSpec: view, plan: match.plan,
                sampleKey: `${target.id}#${spec.generatorId}#${view.viewId}#train#question#inst:0`, seed: 42, attempt: 1};
            const draw = generatePlannedDraw(input);
            expect(draw.labels).toContain(bound);
            expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
            for (const isSolutionView of [false, true]) for (const seed of [0, 1]) {
                const html = renderToStaticMarkup(React.createElement(RationalOppositeBody, {data: draw.stub!.data, task, isSolutionView, seed}));
                expect(html).toContain(relation === 'iterated-negation' ? 'reference-values' : 'number-line');
                expect(html.includes('<svg')).toBe(relation !== 'iterated-negation');
            }
        }
    });

    it('rejects a projection that does not match the generator relation, including future mixed task requests', () => {
        const labels = [Area.RulesOfSigns, Scope.Numberline, Scope.NumbersWithNegatives, Scope.RationalNumbers, Ability.Interpretation];
        const generator = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        expect(planModelCompatibility({id: 'mixed-opposite', labels}, generator,
            {viewId: pairView.viewId, generalLabels: pairView.generalLabels, schema: {}, spec: pairView}).supported).toBe(false);
        expect(planModelCompatibility({id: 'mixed-opposite', labels}, generator,
            {viewId: doubleView.viewId, generalLabels: doubleView.generalLabels, schema: {}, spec: doubleView}).supported).toBe(false);
        // The double-negation leaf cannot cover the extra Numberline request;
        // its hidden axis never establishes a diagram capability.
    });

    it('rejects malformed bands or relation values before sampling', () => {
        const draw = vi.spyOn(random, 'random');
        for (const range of [null, createCanonicalNumericRange(20), createCanonicalNumericRange(10, 5),
            {...createCanonicalNumericRange(5), maximumAbove: 0}, {...createCanonicalNumericRange(5), minimumBelow: 10}])
            expect(() => rationalOppositeRangeProfiles('iterated-negation', range as never)).toThrow();
        expect(() => rationalOppositeRangeProfiles('reflection' as OppositeRelation, createCanonicalNumericRange(5))).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
