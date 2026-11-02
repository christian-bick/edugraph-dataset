import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {getRandomState, random, setSeed} from '../../lib/random.ts';
import {generateWithLabels} from '../../lib/utils.ts';
import {spec as kindergarten} from '../../spec/ccss/kindergarten.ts';
import {spec as gradeTwo} from '../../spec/ccss/grade-02.ts';
import {HundredsBundlesRenderer} from '../../visuals/views/place-value/hundreds-bundles-renderer.tsx';
import {WritingGenerator} from '../writing/generator.ts';
import {PlaceValueHundredsBundlesGenerator} from './place-value-hundreds-bundles/generator.ts';

describe('source bounds for fixed numerical competencies', () => {
    it('uses the hundred leaf’s required1/10/100 quantities without narrowing the100–900 sibling', () => {
        const fixed = gradeTwo.filter(target => target.id.startsWith('2.NBT.A.1a-ten-tens-make-hundred~'));
        const broader = gradeTwo.filter(target => target.id.startsWith('2.NBT.A.1b-hundreds~'));
        expect(fixed).toHaveLength(2);
        expect(broader).toHaveLength(4);
        expect(new Set(fixed.flatMap(target => target.labels.filter(label =>
            label === Ability.DirectUnderstanding || label === Ability.ProcedureUnderstanding))).size).toBe(2);
        const generator = new PlaceValueHundredsBundlesGenerator();
        for (const target of fixed) {
            expect(target.labels).toContain(Scope.NumbersSmaller100);
            expect(target.labels).not.toContain(Scope.NumbersSmaller120);
            expect(target.labels).toContain(Area.IntegerRegrouping);
            for (const seed of [0, 31, 99]) {
                setSeed(seed);
                const old = {data: {hundreds: 1, tens: 10, ones: 0, target: 100} as const};
                random(); // The original fixed hundred sampler also consumed one draw.
                const continuation = getRandomState();
                setSeed(seed);
                const current = generateWithLabels(generator, target.labels)!;
                expect(current.data).toEqual(old.data);
                expect(current.data).toEqual({hundreds: 1, tens: 10, ones: 0, target: 100});
                expect(getRandomState()).toBe(continuation);
                expect(hasCanonicalRangeWitness([1, 10, current.data.target], createCanonicalNumericRange(100))).toBe(true);
                expect(hasCanonicalRangeWitness([1, 10, current.data.target], createCanonicalNumericRange(120))).toBe(false);
                for (const task of ['completion', 'explanation'] as const) for (const isSolutionView of [false, true]) {
                    const render = (data: typeof current.data) => renderToStaticMarkup(createElement(HundredsBundlesRenderer,
                        {data, task, isSolutionView, viewId: 'place-value-hundreds-bundles'}));
                    expect(render(current.data)).toBe(render(old.data));
                }
            }
        }
        expect(broader.filter(target => target.labels.includes(Scope.NumbersSmaller1000))).toHaveLength(2);
        expect(broader.filter(target => target.labels.includes(Scope.NumbersSmaller100))).toHaveLength(2);
        const draw = generateWithLabels(generator, broader[0]!.labels)!;
        expect(draw.data.tens).toBe(0);
    });

    it('uses upper5 for the two zero-only sources without altering positive writing bands', () => {
        const family = kindergarten.filter(target => target.id.startsWith('K.CC.A.3-write-numerals~')
            || target.id.startsWith('K.CC.A.3-represent-counts~'));
        expect(family).toHaveLength(6);
        const zeros = family.filter(target => target.labels.includes(Scope.NumbersWithZero));
        expect(zeros).toHaveLength(2);
        const generator = new WritingGenerator();
        for (const target of zeros) {
            expect(target.labels).toContain(Scope.NumbersSmaller5);
            expect(target.labels).not.toContain(Scope.NumbersSmaller20);
            for (const seed of [0, 31, 99]) {
                setSeed(seed);
                const old = generateWithLabels(generator, target.labels.map(label =>
                    label === Scope.NumbersSmaller5 ? Scope.NumbersSmaller20 : label))!;
                const continuation = getRandomState();
                setSeed(seed);
                const current = generateWithLabels(generator, target.labels)!;
                expect(current.data).toEqual({number: 0});
                expect(current.data).toEqual(old.data);
                expect(getRandomState()).toBe(continuation);
                expect(hasCanonicalRangeWitness([0], createCanonicalNumericRange(5))).toBe(true);
                expect(hasCanonicalRangeWitness([0], createCanonicalNumericRange(20))).toBe(false);
            }
        }
        const positives = family.filter(target => target.labels.includes(Scope.NumbersWithoutZero));
        expect(positives).toHaveLength(4);
        expect(positives.filter(target => target.labels.includes(Scope.NumbersSmaller10))).toHaveLength(2);
        expect(positives.filter(target => target.labels.includes(Scope.NumbersSmaller20))).toHaveLength(2);
        expect(positives.every(target => target.labels.includes(Area.DigitNotation)
            || target.labels.includes(Area.NumerationWithIntegers))).toBe(true);
    });
});
