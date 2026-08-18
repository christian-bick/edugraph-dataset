import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {DecimalNotationGenerator} from './generator.ts';
import {spec} from './spec.ts';

const targets = [
    ['fraction to decimal', [
        Area.DecimalNotation,
        Area.DecimalEquivalence,
        Area.FractionNotation,
        Scope.DecimalNumbers,
        Scope.FractionNumbers,
        Scope.EqualShares,
        Scope.Equal,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Ability.Formalization
    ], '2ad815fe'],
    ['decimal to fraction', [
        Area.DecimalNotation,
        Area.DecimalEquivalence,
        Area.FractionNotation,
        Scope.DecimalNumbers,
        Scope.FractionNumbers,
        Scope.EqualShares,
        Scope.Equal,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Ability.Interpretation
    ], '9e9450df'],
    ['decimal number line', [
        Area.NumerationWithDecimals,
        Area.DecimalNotation,
        Scope.DecimalNumbers,
        Scope.Numberline,
        Scope.SingleFrameOfReference,
        Ability.VisualArticulation
    ], 'c0474cb0'],
    ['decimal measurement', [
        Area.DecimalNotation,
        Area.DecimalEquivalence,
        Area.FractionNotation,
        Area.MeasuringWithUnits,
        Scope.DecimalNumbers,
        Scope.FractionNumbers,
        Scope.LengthMeasurement,
        Scope.MeterScale,
        Scope.EqualShares,
        Scope.Equal,
        Scope.SingleFrameOfReference,
        Ability.Formalization
    ], '92d84139']
] as const;

describe('DecimalNotationGenerator spec integration', () => {
    const generator = new DecimalNotationGenerator();

    it('declares only the invariant decimal capabilities', () => {
        expect(spec).toEqual({
            generatorId: 'decimal-notation',
            generalLabels: [Area.DecimalNotation, Scope.DecimalNumbers]
        });
    });

    it.each(targets)('resolves the corrected %s target without consuming view labels', (
        _name,
        labels,
        expectedHash
    ) => {
        expect(labelSetHash([...labels])).toBe(expectedHash);
        setSeed(expectedHash);
        const stub = generateWithLabels(generator, [...labels]);
        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('decimal-notation');
        expect(stub!.tags).toEqual([]);
    });

    it('keeps label-driven and direct generation on the identical RNG path', () => {
        const labels = [...targets[0][1]];
        setSeed('decimal-notation-label-path');
        const resolved = generateWithLabels(generator, labels);
        setSeed('decimal-notation-label-path');
        const direct = generator.generate({});
        expect(resolved!.data).toEqual(direct.data);
    });
});
