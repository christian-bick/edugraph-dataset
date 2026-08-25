import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementToolSelectionGenerator} from './generator.ts';

describe('measurement-tool-selection spec', () => {
    it('consumes the selected physical tool label', () => {
        const stub = generateWithLabels(new MeasurementToolSelectionGenerator(), [
            Area.MeasuringLength,
            Scope.PhysicalRuler,
            Ability.ConceptClassification
        ]);
        expect(stub?.data.correctTool).toBe('ruler');
        expect(stub?.labels).toContain(Scope.PhysicalRuler);
    });
});
