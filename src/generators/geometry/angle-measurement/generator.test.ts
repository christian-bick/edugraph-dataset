import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {AngleMeasurementGenerator} from './generator.ts';
import {AngleMeasurementGeneratorConfig} from './spec.ts';

const generator = new AngleMeasurementGenerator();

describe('AngleMeasurementGenerator', () => {
    it('strictly requires the target discriminator', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
    });

    it.each([true, false] as const)(
        'generates the complete neutral angle-measure set when the target discriminator is %s',
        useProtractorMeasurement => {
            const observedMeasures = new Set<number>();
            for (let seed = 0; seed < 240; seed++) {
                setSeed(`angle-measure-${seed}`);
                const data = generator.generate({useProtractorMeasurement})!.data;
                expect(data).toEqual({angleMeasure: data.angleMeasure});
                observedMeasures.add(data.angleMeasure);
            }
            expect(observedMeasures).toEqual(new Set([
                23, 30, 37, 45, 52, 60, 68, 75, 90, 105, 112, 120, 127, 135, 143, 150, 158
            ]));
        }
    );

    it('does not let the target discriminator change the mathematical sample', () => {
        setSeed('angle-measurement-neutrality');
        const measurement = generator.generate({useProtractorMeasurement: true});
        setSeed('angle-measurement-neutrality');
        const sketch = generator.generate({useProtractorMeasurement: false});
        expect(measurement).toEqual(sketch);
    });

    it.each([true, false] as const)(
        'is deterministic when protractor measurement is %s',
        useProtractorMeasurement => {
            const config: AngleMeasurementGeneratorConfig = {useProtractorMeasurement};
            setSeed(`angle-measurement-determinism-${useProtractorMeasurement}`);
            const first = generator.generate(config);
            setSeed(`angle-measurement-determinism-${useProtractorMeasurement}`);
            expect(generator.generate(config)).toEqual(first);
        }
    );
});
