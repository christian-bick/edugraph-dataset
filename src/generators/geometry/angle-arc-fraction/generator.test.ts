import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {AngleArcFractionGenerator} from './generator.ts';

const generator = new AngleArcFractionGenerator();

describe('AngleArcFractionGenerator', () => {
    it.each([2, 3, 4, 6] as const)('relates denominator %i to a full turn', denominator => {
        const data = generator.generate({denominator}).data;
        expect(data).toEqual({
            kind: 'fractional-arc', fullTurnDegrees: 360,
            angleDegrees: 360 / denominator, arcFraction: {numerator: 1, denominator}
        });
        expect(data.angleDegrees * data.arcFraction.denominator).toBe(data.fullTurnDegrees);
    });

    it.each([undefined, null, {}, {denominator: 0}, {denominator: 5}, {denominator: '4'}])(
        'rejects malformed or unsupported configuration %j', config => {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    );
});
