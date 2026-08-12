import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementUnitScaleGenerator} from './generator.ts';

describe('measurement-unit-scale spec', () => {
    it('matches the unit-scale relation target', () => {
        expect(generateWithLabels(new MeasurementUnitScaleGenerator(), [
            Area.UnitScaleRelation, Scope.LengthMeasurement, Ability.ConceptDerivation
        ])).not.toBeNull();
    });
});
