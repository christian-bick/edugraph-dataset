import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {MeasurementMassGenerator} from './generator.ts';
import {MeasurementMassGeneratorSchema as schema, spec} from './spec.ts';
import {massReadingRangeProfiles, massReadingsForRange} from './numeric-domain.ts';

describe('measurement-mass spec', () => {
    it('retains both scales and resolves each feasible cell directly and through planned choices', () => {
        const evaluator = createLabelDependencyEvaluator();
        let cells = 0;
        for (const scale of [Scope.GramScale, Scope.KilogramScale]) {
            const measurement = scale === Scope.GramScale ? 'gram-weight' : 'kilogram-weight';
            expect(generateWithLabels(new MeasurementMassGenerator(), [scale])!.data.unit).toBe(scale === Scope.GramScale ? 'g' : 'kg');
            for (const profile of massReadingRangeProfiles) {
                if (massReadingsForRange(measurement, profile.range).length === 0) continue;
                cells++;
                const labels = [scale, ...profile.labels];
                expect(extractConfig(schema, labels).config).toEqual({measurement, range: profile.range});
                expect(resolveSchemaChoices(schema, labels, {measurement: [scale], range: profile.labels}).config)
                    .toEqual({measurement, range: profile.range});
                const result = evaluator.evaluate([...spec.generalLabels!, ...labels, Ability.ProcedureExecution]);
                expect(result.errors).toEqual([]);
                expect(result.conflicts).toEqual([]);
                expect(result.assessments.filter(item => item.status === 'missing')).toEqual([]);
            }
        }
        expect(cells).toBe(3);
        expect(generateWithLabels(new MeasurementMassGenerator(), [])!.data.measurementKind).toBe('mass');
    });

    it('rejects infeasible scale and canonical-range conjunctions', () => {
        expect(() => extractConfig(schema, [Scope.GramScale, Scope.NumbersSmaller5])).toThrow('cannot complete');
        expect(spec.compatibility).toHaveLength(1);
    });
});
