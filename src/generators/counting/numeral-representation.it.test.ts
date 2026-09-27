import {fileURLToPath} from 'node:url';
import {beforeAll, describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {matchTarget, matchesTarget} from '../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';

const quantityLabels = [
    Area.NumerationWithIntegers,
    Scope.IntegerNumbers,
    Scope.NumbersWithoutZero,
    Scope.NumbersWithoutNegatives,
    Scope.NumbersSmaller10
];

const numeralConsumers = [
    ['counting-selection', 'counting-objects-count-out', Ability.ProcedureExecution],
    ['counting-basic', 'counting-objects-one-to-one', Ability.ProcedureExecution],
    ['counting-basic', 'counting-objects-simple', Ability.ProcedureUnderstanding],
    ['counting-basic', 'counting-objects-parity', Ability.ConceptClassification],
    ['counting-basic', 'counting-objects-cardinality', Ability.ProcedureUnderstanding],
    ['counting-classify-count', 'sorting-classify-count', Ability.ConceptClassification],
    ['counting-classify-sort', 'sorting-classify-order', Ability.ProcedureExecution]
] as const;

const objectOnlyConsumers = [
    ['counting-basic', 'counting-conservation', Ability.DirectUnderstanding],
    ['counting-classify-sort', 'sorting-classify-sort', Ability.ProcedureExecution]
] as const;

describe('counting numeral representation ownership', () => {
    let generators: Awaited<ReturnType<typeof loadGeneratorModelCatalog>>;
    let views: Awaited<ReturnType<typeof loadViewModelCatalog>>;

    beforeAll(async () => {
        const pairs = [...numeralConsumers, ...objectOnlyConsumers];
        const generatorIds = [...new Set(pairs.map(([generatorId]) => generatorId))];
        const viewIds = [...new Set(pairs.map(([, viewId]) => viewId))];
        [generators, views] = await Promise.all([
            loadGeneratorModelCatalog(undefined, undefined, new Map(generatorIds.map(id =>
                [id, fileURLToPath(new URL(`./${id}/spec.ts`, import.meta.url))]))),
            loadViewModelCatalog(undefined, undefined, new Map(viewIds.map(id => {
                const category = id.startsWith('sorting-') ? 'sorting' : 'counting';
                return [id, fileURLToPath(new URL(`../../visuals/views/${category}/${id}/spec.ts`, import.meta.url))];
            })))
        ]);
    });

    it.each(objectOnlyConsumers)(
        '%s / %s retains quantity capabilities without promising a numeral system',
        (generatorId, viewId, ability) => {
            const generator = generators.find(entry => entry.generatorId === generatorId)!;
            const view = views.find(entry => entry.viewId === viewId)!;
            const labels = [...quantityLabels, ability];

            expect(matchesTarget(labels, generator, view)).toEqual({matched: true});
            for (const representation of [Scope.Base10, Scope.ArabicNumerals]) {
                expect(matchesTarget([...labels, representation], generator, view)).toEqual({
                    matched: false,
                    reason: 'unsupported-label',
                    label: representation
                });
            }
        }
    );

    it.each(numeralConsumers)(
        '%s / %s satisfies the decimal representation through the view',
        (generatorId, viewId, ability) => {
            const generator = generators.find(entry => entry.generatorId === generatorId)!;
            const view = views.find(entry => entry.viewId === viewId)!;
            const result = matchTarget({
                id: `numeral-response-${viewId}`,
                labels: [
                    ...quantityLabels, ability, Scope.Base10,
                    ...(viewId === 'sorting-classify-order' ? [Area.NumericOrder] : [])
                ]
            }, generator, view);

            expect(result.matched).toBe(true);
            if (!result.matched) return;
            expect(result.plan.generatorLabels).not.toContain(Scope.Base10);
            expect(result.plan.viewLabels).toContain(Scope.Base10);
        }
    );

});
