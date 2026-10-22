import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {RatioTablesGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('ratio-tables capabilities', () => {
    it('generates the reviewed table target without a magnitude label', () => {
        const problem = generateWithLabels(new RatioTablesGenerator(), [
            Area.RatioEquivalence, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives,
            Scope.TabularAlgebraicRepresentation, Ability.VisualArticulation
        ])!;
        expect(problem.data.rows).toHaveLength(4);
        expect(problem.data.rows.every(row => row.antecedent < 100 && row.consequent < 100)).toBe(true);
        expect(problem.labels).toEqual([]);
    });

    it('owns ratio equivalence and the whole-number domain', () => {
        expect(spec.generalLabels).toEqual([Area.RatioEquivalence, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives]);
    });

    it.each([[Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100]] as const)(
        'resolves %s into bounded rows', (label, max) => {
            const problem = generateWithLabels(new RatioTablesGenerator(), [label])!;
            expect(problem.labels).toContain(label);
            for (const row of problem.data.rows) {
                expect(row.antecedent).toBeLessThan(max);
                expect(row.consequent).toBeLessThan(max);
            }
        }
    );

    it('shares one canonical table across construction and inversion', () => {
        setSeed(13);
        const first = generateWithLabels(new RatioTablesGenerator(), [Scope.NumbersSmaller100, Ability.VisualArticulation]);
        setSeed(13);
        expect(generateWithLabels(new RatioTablesGenerator(), [Scope.NumbersSmaller100, Ability.ProcedureInversion])).toEqual(first);
    });
});
