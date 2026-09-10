import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementUnitScaleGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('MeasurementUnitScaleGenerator schema integration', () => {
    it('requires no projection selector to generate its invariant mathematical relation', () => {
        const generator = new MeasurementUnitScaleGenerator();
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const expected = generator.generate({}).data;
            setSeed(seed);
            const result = generateWithLabels(generator, [
                ...spec.generalLabels, Ability.ConceptDerivation
            ])!;
            expect(result.data).toEqual(expected);
        }
    });
});
