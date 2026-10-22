import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {UnitDimensionRelationsGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('unit-dimension-relations capabilities', () => {
    it('owns dimensional composition and rational mathematics without a learner action', () => {
        expect(spec.generalLabels).toEqual([Area.UnitDimensionality, Scope.RationalNumbers]);
    });

    it.each([[Area.Multiplication, 'multiplication'], [Area.Division, 'division']] as const)(
        'resolves the required real-standard operation %s', (label, operation) => {
            setSeed(25);
            const problem = generateWithLabels(new UnitDimensionRelationsGenerator(), [
                Area.UnitDimensionality, Scope.RationalNumbers, label,
                Ability.ProcedureExecution, Ability.ProcedureUnderstanding
            ])!;
            expect(problem.data.kind).toBe('unit-dimension-relation');
            expect(problem.data.operation).toBe(operation);
            expect(problem.labels).toEqual([label]);
        }
    );

    it('rejects conflicting operation capabilities', () => {
        expect(() => generateWithLabels(new UnitDimensionRelationsGenerator(), [Area.Multiplication, Area.Division])).toThrow();
    });

    it('records an admitted operation capability when the target leaves it unspecified', () => {
        const problem = generateWithLabels(new UnitDimensionRelationsGenerator(), [Area.UnitDimensionality])!;
        expect(problem.labels).toEqual([problem.data.operation === 'multiplication' ? Area.Multiplication : Area.Division]);
    });

    it('keeps explanation and execution requests out of the canonical relation', () => {
        const labels = [Area.UnitDimensionality, Scope.RationalNumbers, Area.Division];
        setSeed(17);
        const execution = generateWithLabels(new UnitDimensionRelationsGenerator(), [...labels, Ability.ProcedureExecution]);
        setSeed(17);
        expect(generateWithLabels(new UnitDimensionRelationsGenerator(), [...labels, Ability.ProcedureUnderstanding])).toEqual(execution);
    });
});
