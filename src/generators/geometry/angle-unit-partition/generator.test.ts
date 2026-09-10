import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {AngleUnitPartitionGenerator} from './generator.ts';

const generator = new AngleUnitPartitionGenerator();

describe('AngleUnitPartitionGenerator', () => {
    it('relates the equal parts of a full turn to their unit measure', () => {
        const data = generator.generate({}).data;
        expect(data).toEqual({kind: 'equal-angle-partition', fullTurnDegrees: 360, parts: 360, angleDegrees: 1});
        expect(data.parts * data.angleDegrees).toBe(data.fullTurnDegrees);
    });

    it.each([null, undefined])('rejects a missing config %j', config => {
        expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
    });
});
