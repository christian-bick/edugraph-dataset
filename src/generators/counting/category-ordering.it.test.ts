import {fileURLToPath} from 'node:url';
import {beforeAll, describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {matchTarget, matchesTarget} from '../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';
import {spec as ccssTargets} from '../../spec/ccss/kindergarten.ts';

const baseLabels = [
    Area.NumerationWithIntegers, Area.ObjectSorting, Area.ShapeRecognition,
    Scope.NumbersWithoutZero, Scope.NumbersWithoutNegatives, Scope.NumbersSmaller10,
    Ability.ProcedureExecution
];

describe('category-count task matching', () => {
    let generator: Awaited<ReturnType<typeof loadGeneratorModelCatalog>>[number];
    let extrema: Awaited<ReturnType<typeof loadViewModelCatalog>>[number];
    let order: typeof extrema;
    beforeAll(async () => {
        [generator] = await loadGeneratorModelCatalog(undefined, undefined, new Map([
            ['counting-classify-sort', fileURLToPath(new URL('./counting-classify-sort/spec.ts', import.meta.url))]
        ]));
        const views = await loadViewModelCatalog(undefined, undefined, new Map([
            ['sorting-classify-sort', fileURLToPath(new URL('../../visuals/views/sorting/sorting-classify-sort/spec.ts', import.meta.url))],
            ['sorting-classify-order', fileURLToPath(new URL('../../visuals/views/sorting/sorting-classify-order/spec.ts', import.meta.url))]
        ]));
        extrema = views.find(view => view.viewId === 'sorting-classify-sort')!;
        order = views.find(view => view.viewId === 'sorting-classify-order')!;
    });

    it.each([Scope.Least, Scope.Most])('keeps %s selection distinct from full ordering and numeral representation', relation => {
        const labels = [...baseLabels, relation];
        expect(matchesTarget(labels, generator, extrema).matched).toBe(true);
        expect(matchesTarget(labels, generator, order).matched).toBe(false);
        for (const unsupported of [Area.NumericOrder, Scope.ArabicNumerals, Scope.Base10]) {
            expect(matchesTarget([...labels, unsupported], generator, extrema).matched).toBe(false);
        }
        expect(matchesTarget([...labels, Area.NumericOrder], generator, order).matched).toBe(false);
    });

    it.each([Scope.AscendingOrder, Scope.DescendingOrder])('matches complete %s ordering only to its own leaf', relation => {
        const target = {id: 'category-order', labels: [...baseLabels, Area.NumericOrder, Scope.Base10, Scope.ArabicNumerals, relation]};
        const result = matchTarget(target, generator, order);
        expect(result.matched).toBe(true);
        if (!result.matched) throw new Error(result.reason);
        expect(result.plan.viewLabels).toContain(Area.NumericOrder);
        expect(result.plan.viewLabels).toContain(Scope.Base10);
        expect(result.plan.generatorLabels).not.toContain(Area.NumericOrder);
        expect(result.plan.domains.find(domain => domain.owner === 'generator' && domain.field === 'relation')!.alternatives
            .flatMap(alternative => alternative.labels)).toEqual([relation]);
        expect(matchesTarget(target.labels, generator, extrema).matched).toBe(false);
    });

    it('restricts unspecified generator relation choices to each leaf\'s mathematical contract', () => {
        for (const [view, extraLabels, allowed] of [
            [extrema, [], [Scope.Least, Scope.Most]],
            [order, [Area.NumericOrder], [Scope.AscendingOrder, Scope.DescendingOrder]]
        ] as const) {
            const result = matchTarget({id: 'unspecified-relation', labels: [...baseLabels, ...extraLabels]}, generator, view);
            expect(result.matched).toBe(true);
            if (!result.matched) throw new Error(result.reason);
            const relations = result.plan.domains.find(domain => domain.owner === 'generator' && domain.field === 'relation')!
                .alternatives.flatMap(alternative => alternative.labels);
            expect(relations.sort()).toEqual([...allowed].sort());
        }
    });

    it('requires an explicit complete-order claim instead of matching ordinary numeral counting', () => {
        expect(matchesTarget([...baseLabels, Scope.ArabicNumerals, Scope.Base10], generator, order)).toEqual({
            matched: false, reason: 'missing-required-label', label: Area.NumericOrder
        });
    });

    it('keeps the two standard-order targets and two supporting endpoint targets separately matched', () => {
        const targets = ccssTargets.filter(target => /^K\.MD\.B\.3-(sort|select)-by-count~/.test(target.id));
        expect(targets).toHaveLength(4);
        for (const target of targets) {
            const isOrder = target.id.includes('-sort-by-count~');
            expect(target.labels.includes(Area.NumericOrder)).toBe(isOrder);
            expect(target.labels.includes(Scope.Base10)).toBe(isOrder);
            expect(target.labels.includes(Scope.ArabicNumerals)).toBe(isOrder);
            expect(matchesTarget(target.labels, generator, isOrder ? order : extrema).matched).toBe(true);
            expect(matchesTarget(target.labels, generator, isOrder ? extrema : order).matched).toBe(false);
        }
    });
});
