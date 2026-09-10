import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {AngleUnitPartitionGenerator} from './generator.ts';

describe('AngleUnitPartitionGenerator schema', () => {
    it('needs no configurable distinction to establish a one-degree partition', () => {
        const result = generateWithLabels(new AngleUnitPartitionGenerator(), [])!;
        expect(result.data.parts).toBe(360);
        expect(result.data.angleDegrees).toBe(1);
        expect(result.labels).toEqual([]);
    });
});
