import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {ShapeEqualSquarePartitionGenerator} from './generator.ts';
import {ShapeEqualSquarePartitionGeneratorSchema, spec} from './spec.ts';

const generator = new ShapeEqualSquarePartitionGenerator();
const mathematicalLabels = [
    Area.Square,
    Area.ShapeDecomposition,
    Scope.BoxArrangement,
    Scope.EqualShares
];

describe('ShapeEqualSquarePartitionGenerator spec integration', () => {
    it('owns the complete mathematical partition capability without Ability labels', () => {
        expect(spec.generalLabels).toEqual(mathematicalLabels);
        expect(extractSchemaLabels(ShapeEqualSquarePartitionGeneratorSchema)).toEqual([]);
    });

    it('produces the same relation for articulation and execution projections', () => {
        setSeed(31);
        const articulation = generateWithLabels(generator, [
            ...mathematicalLabels,
            Ability.VisualArticulation
        ])!;
        setSeed(31);
        const execution = generateWithLabels(generator, [
            ...mathematicalLabels,
            Ability.ProcedureExecution
        ])!;

        expect(execution.data).toEqual(articulation.data);
        expect(articulation.labels).not.toContain(Ability.VisualArticulation);
        expect(execution.labels).not.toContain(Ability.ProcedureExecution);
    });
});
