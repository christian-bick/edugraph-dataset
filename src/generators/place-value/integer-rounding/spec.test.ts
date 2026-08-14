import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {IntegerRoundingGenerator} from './generator.ts';

describe('IntegerRoundingGenerator spec integration', () => {
    const generator = new IntegerRoundingGenerator();

    it.each([Scope.StepsOf10, Scope.StepsOf100])('resolves %s', roundingMagnitude => {
        const stub = generateWithLabels(generator, [
            Scope.NumbersSmaller1000,
            roundingMagnitude
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Scope.NumbersSmaller1000,
            roundingMagnitude
        ]));
    });
});
