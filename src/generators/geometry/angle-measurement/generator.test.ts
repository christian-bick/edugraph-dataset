import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {AngleMeasurementGenerator} from './generator.ts';
import {AngleMeasurementGeneratorConfig} from './spec.ts';

const generator = new AngleMeasurementGenerator();

describe('AngleMeasurementGenerator', () => {
    it('strictly requires a task', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
    });

    it('generates whole-number protractor readings from both zero sides and scales', () => {
        const observedMeasures = new Set<number>();
        const observedSides = new Set<string>();
        for (let seed = 0; seed < 240; seed++) {
            setSeed(`protractor-measure-${seed}`);
            const data = generator.generate({task: 'measure-angle'})!.data;
            expect(data.task).toBe('measure-angle');
            if (data.task !== 'measure-angle') throw new Error('Expected protractor measurement.');

            const startsRight = data.geometry.baselineSide === 'right';
            const expectedScale = startsRight ? 'inner' : 'outer';
            expect(data.geometry).toMatchObject({
                vertexLabel: 'O',
                baselinePointLabel: 'A',
                terminalPointLabel: 'B',
                baselineDegrees: startsRight ? 0 : 180,
                terminalDegrees: startsRight ? data.angleMeasure : 180 - data.angleMeasure,
                sweepDegrees: data.angleMeasure,
                direction: startsRight ? 'counterclockwise' : 'clockwise'
            });
            expect(data.protractor).toEqual({
                minimumDegrees: 0,
                maximumDegrees: 180,
                tickStepDegrees: 1,
                labelStepDegrees: 10,
                centerLabel: 'O',
                baselinePointLabel: 'A',
                zeroSide: data.geometry.baselineSide,
                readingScale: expectedScale
            });
            expect(data.prompt).toBe('Use the protractor to measure angle AOB.');
            expect(data.questionRelation).toBe('m∠AOB = ?°');
            expect(data.solutionRelation).toBe(`m∠AOB = ${data.angleMeasure}°`);
            expect(data.answer).toBe(`${data.angleMeasure}°`);
            expect(data.answerStatement).toBe(`Angle AOB measures ${data.angleMeasure}°.`);
            expect(data.explanation).toBe(
                `Ray OA starts at the ${data.geometry.baselineSide} 0° mark. Following the ${expectedScale} scale to ray OB gives ${data.angleMeasure}°.`
            );
            observedMeasures.add(data.angleMeasure);
            observedSides.add(data.geometry.baselineSide);
        }
        expect(observedMeasures).toEqual(new Set([23, 37, 52, 68, 90, 112, 127, 143, 158]));
        expect(observedSides).toEqual(new Set(['right', 'left']));
    });

    it('generates specified-angle sketches with exactly matching completed geometry', () => {
        const observedMeasures = new Set<number>();
        for (let seed = 0; seed < 180; seed++) {
            setSeed(`angle-sketch-${seed}`);
            const data = generator.generate({task: 'sketch-angle'})!.data;
            expect(data.task).toBe('sketch-angle');
            if (data.task !== 'sketch-angle') throw new Error('Expected angle sketch.');

            expect(data.completedMeasure).toBe(data.requestedMeasure);
            expect(data.geometry).toEqual({
                vertexLabel: 'O',
                baselinePointLabel: 'A',
                terminalPointLabel: 'B',
                baselineSide: 'right',
                baselineDegrees: 0,
                terminalDegrees: data.requestedMeasure,
                sweepDegrees: data.requestedMeasure,
                direction: 'counterclockwise'
            });
            expect(data.prompt).toBe(
                `Sketch a ${data.requestedMeasure}° angle with vertex O and starting ray OA.`
            );
            expect(data.questionRelation).toBe(
                `m∠AOB = ${data.requestedMeasure}° (requested)`
            );
            expect(data.solutionRelation).toBe(`m∠AOB = ${data.requestedMeasure}°`);
            expect(data.answer).toBe(`${data.requestedMeasure}°`);
            expect(data.answerStatement).toBe(
                `The completed angle measures ${data.requestedMeasure}°.`
            );
            expect(data.explanation).toBe(
                `Ray OB is placed ${data.requestedMeasure}° counterclockwise from ray OA, so angle AOB has the specified measure.`
            );
            observedMeasures.add(data.requestedMeasure);
        }
        expect(observedMeasures).toEqual(new Set([30, 45, 60, 75, 90, 105, 120, 135, 150]));
    });

    it('rejects an unsupported task', () => {
        expect(generator.generate({
            task: 'unsupported'
        } as unknown as AngleMeasurementGeneratorConfig)).toBeNull();
    });

    it.each(['measure-angle', 'sketch-angle'] as const)(
        'is deterministic for %s',
        task => {
            setSeed(`angle-measurement-determinism-${task}`);
            const first = generator.generate({task});
            setSeed(`angle-measurement-determinism-${task}`);
            expect(generator.generate({task})).toEqual(first);
        }
    );
});
