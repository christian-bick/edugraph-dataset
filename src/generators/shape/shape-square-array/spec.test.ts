import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapeSquareArrayGenerator} from './generator.ts';
import {spec} from './spec.ts';

const generator = new ShapeSquareArrayGenerator();

describe('ShapeSquareArrayGenerator spec integration', () => {
    it('declares square composition and rectangular arrangement once', () => {
        expect(spec.generalLabels).toEqual([
            Area.Square,
            Area.ShapeComposition,
            Scope.BoxArrangement,
            Scope.EqualShares
        ]);
        expect(spec.generalLabels).not.toContain(Area.Rectangle);
    });

    it.each([
        [Ability.VisualArticulation, 'partition'],
        [Ability.ProcedureExecution, 'count']
    ] as const)('resolves %s to one exact task', (ability, task) => {
        const stub = generateWithLabels(generator, [
            Area.Rectangle,
            Area.Square,
            Area.ShapeComposition,
            Scope.BoxArrangement,
            Scope.EqualShares,
            ability
        ])!;

        expect(stub.data.task).toBe(task);
        expect(stub.tags).toContain(ability);
    });
});
