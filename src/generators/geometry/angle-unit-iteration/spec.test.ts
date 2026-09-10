import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {AngleUnitIterationGenerator} from './generator.ts';

describe('AngleUnitIterationGenerator schema', () => {
    it('keeps the number of repeated units independent of ontology configuration', () => {
        const result = generateWithLabels(new AngleUnitIterationGenerator(), [])!;
        expect(result.data.angleDegrees).toBe(result.data.count * result.data.unitDegrees);
        expect(result.labels).toEqual([]);
    });
});
