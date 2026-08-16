import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {FractionEquivalenceGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('FractionEquivalenceGenerator spec integration', () => {
    const generator = new FractionEquivalenceGenerator();

    it('declares exactly the invariant equivalence capabilities', () => {
        expect(spec).toEqual({
            generatorId: 'fraction-equivalence',
            generalLabels: [
                Area.FractionEquivalence,
                Area.FractionNotation,
                Scope.EqualShares,
                Scope.Equal
            ]
        });
    });

    it.each([
        [[Ability.ConceptDerivation], 'recognize-equivalence'],
        [[Ability.Formalization, Ability.ProcedureUnderstanding], 'generate-equivalence']
    ] as const)('resolves the exact %j mode', (taskAbilities, expectedTask) => {
        setSeed(expectedTask);
        const stub = generateWithLabels(generator, [
            Area.FractionEquivalence,
            Area.FractionNotation,
            Scope.EqualShares,
            Scope.Equal,
            ...taskAbilities
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe(expectedTask);
        expect(stub!.tags).toEqual(expect.arrayContaining([...taskAbilities]));
    });
});
