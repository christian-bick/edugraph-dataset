import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {AreaPerimeterRelationsGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('AreaPerimeterRelationsGenerator spec integration', () => {
    const labels = [
        Area.PerimeterCalculation,
        Area.AreaCalculation,
        Area.Rectangle,
        Scope.Equal
    ];

    it('declares the reviewed relation labels', () => {
        expect(spec.generalLabels).toEqual(labels);
    });

    it('generates the reviewed area-perimeter relation target', () => {
        const stub = generateWithLabels(new AreaPerimeterRelationsGenerator(), [
            ...labels,
            Ability.ConceptClassification
        ]);

        expect(stub).not.toBeNull();
        if (stub!.data.task === 'same-perimeter') {
            expect(stub!.data.first.perimeter).toBe(stub!.data.second.perimeter);
            expect(stub!.data.first.area).not.toBe(stub!.data.second.area);
        } else {
            expect(stub!.data.first.area).toBe(stub!.data.second.area);
            expect(stub!.data.first.perimeter).not.toBe(stub!.data.second.perimeter);
        }
    });
});
