import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('measure-conversion-execution view spec', () => {
    it('owns execution and requires generator-established measurement mathematics', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureExecution]);
        expect(spec.requiredLabels).toEqual([Area.MeasuringWithUnits]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
