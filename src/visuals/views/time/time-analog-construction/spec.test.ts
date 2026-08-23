import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec, TimeAnalogConstructionViewSchema} from './spec.ts';

describe('time-analog-construction view spec', () => {
    it('owns construction of analog clock hands from numeral time', () => {
        expect(spec.generalLabels).toEqual([
            Scope.AnalogClock,
            Scope.ArabicNumerals,
            Ability.VisualArticulation
        ]);
        expect(TimeAnalogConstructionViewSchema).toEqual({});
    });
});
