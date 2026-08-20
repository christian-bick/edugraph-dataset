import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('measurement-data-table view spec', () => {
    it('owns observable measurement from depicted objects', () => {
        expect(spec.generalLabels).toEqual([
            Scope.PhysicalRuler,
            Scope.DataTable,
            Scope.ObservedMeasurement,
            Ability.ProcedureExecution
        ]);
    });
});
