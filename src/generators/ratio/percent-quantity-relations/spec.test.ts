import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {CANONICAL_RANGE_THRESHOLDS} from '../../../lib/canonical-numeric-range.ts';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {spec as forwardView} from '../../../visuals/views/ratio/percent-of-quantity/spec.ts';
import {spec as inverseView} from '../../../visuals/views/ratio/percent-whole-inversion/spec.ts';
import {PercentQuantityRelationsGenerator} from './generator.ts';
import {PercentQuantityRelationsGeneratorSchema, spec} from './spec.ts';

const mathematicalLabels = [
    Area.PercentageRateApplication, Area.PercentageEquivalence, Area.ProportionalScaling,
    Scope.RationalNumbers, Scope.NumbersWithoutNegatives
];

describe('percent-quantity-relations capabilities', () => {
    it('owns only the reviewed invariant percent and scaling mathematics', () => {
        expect(spec.generalLabels).toEqual([...mathematicalLabels, Scope.NumbersWithoutZero]);
    });

    it('preserves application and inverse target projections with their independent equivalence and scaling claims', () => {
        const targets = activeTargets.filter(target => target.id.startsWith('6.RP.A.3c-'));
        expect(targets).toHaveLength(2);
        for (const target of targets) {
            expect(target.labels).toEqual(expect.arrayContaining(mathematicalLabels));
            for (const view of [forwardView, inverseView]) {
                const result = planCompatibility({
                    identity: {targetId: target.id, generatorId: spec.generatorId, viewId: view.viewId},
                    targetLabels: target.labels, generatorLabels: spec.generalLabels, viewLabels: view.generalLabels,
                    fields: normalizeSchemaChoices(PercentQuantityRelationsGeneratorSchema, target.labels, 'generator')
                });
                expect(result.supported).toBe(target.labels.includes(view.generalLabels[0]!));
            }
        }
    });

    it.each([Ability.ProcedureExecution, Ability.ProcedureInversion])(
        'generates the real broad target for %s without a magnitude label', ability => {
            setSeed(23);
            const problem = generateWithLabels(new PercentQuantityRelationsGenerator(), [...mathematicalLabels, ability])!;
            expect(problem.data.kind).toBe('percent-quantity');
            expect(problem.data.whole.numerator).toBeLessThan(10000);
            expect(problem.data.part.numerator).toBeLessThan(10000);
            expect(problem.labels).toHaveLength(1);
            expect([Scope.NumbersSmaller100, Scope.NumbersSmaller120, Scope.NumbersSmaller1000,
                Scope.NumbersSmaller10000]).toContain(problem.labels[0]);
        }
    );

    it.each([[Scope.NumbersSmaller100, 100], [Scope.NumbersSmaller120, 120],
        [Scope.NumbersSmaller1000, 1000], [Scope.NumbersSmaller10000, 10000]] as const)(
        'resolves the supported magnitude label %s', (label, bound) => {
            const problem = generateWithLabels(new PercentQuantityRelationsGenerator(), [...mathematicalLabels, label])!;
            expect(problem.labels).toEqual([label]);
            const {whole, part, percent} = problem.data;
            const maximum = Math.max(percent, 100, whole.numerator / whole.denominator, part.numerator / part.denominator);
            expect(maximum).toBeLessThanOrEqual(bound);
            expect(maximum).toBeGreaterThan(CANONICAL_RANGE_THRESHOLDS[CANONICAL_RANGE_THRESHOLDS.indexOf(bound) - 1]!);
        }
    );

    it('keeps forward and inverse learner actions out of the canonical relation', () => {
        setSeed(54);
        const forward = generateWithLabels(new PercentQuantityRelationsGenerator(), [
            ...mathematicalLabels, Ability.ProcedureExecution
        ]);
        setSeed(54);
        expect(generateWithLabels(new PercentQuantityRelationsGenerator(), [
            ...mathematicalLabels, Ability.ProcedureInversion
        ])).toEqual(forward);
    });
});
