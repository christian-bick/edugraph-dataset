import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {buildFractionalRectangularPrismVolumeProblem, type FractionalPrismRelationProfile} from '../../../generators/measurement/fractional-rectangular-prism-helpers.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {RectangularPrismVolumeProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {fractionalPrismLiteral, integerPrismLiteral} from './fractional-prism-fixtures.ts';
import {prismFormulaEvidence} from './fractional-prism-view-policy.ts';
import {RectangularPrismBody, type PrismTask} from './volume-rectangular-prism-view.tsx';
import {isValidRectangularPrismVolume} from './volume-rectangular-prism-helpers.ts';

type ViewId = 'volume-fractional-packing-count' | 'volume-packing-product-explanation' | 'volume-product-model'
    | 'volume-formula-execution' | 'volume-formula-story';
type Core = (props: {config: {}; payload: ViewRenderPayload<ViewId>}) => React.ReactNode;
const cores = new Map<ViewId, Core>();
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const modules = await Promise.all([
        import('./volume-fractional-packing-count/view.tsx'), import('./volume-packing-product-explanation/view.tsx'),
        import('./volume-product-model/view.tsx'), import('./volume-formula-execution/view.tsx'), import('./volume-formula-story/view.tsx')
    ]);
    const components = [modules[0].VolumeFractionalPackingCountCore, modules[1].VolumePackingProductExplanationCore,
        modules[2].VolumeProductModelCore, modules[3].VolumeFormulaExecutionCore, modules[4].VolumeFormulaStoryCore];
    const ids: ViewId[] = ['volume-fractional-packing-count', 'volume-packing-product-explanation', 'volume-product-model',
        'volume-formula-execution', 'volume-formula-story'];
    ids.forEach((id, index) => cores.set(id, components[index] as Core));
});
afterAll(() => vi.unstubAllGlobals());
const render = (id: ViewId, data: RectangularPrismVolumeProblem, solution: boolean): string => {
    const Component = cores.get(id)!;
    return renderToStaticMarkup(<Component config={{}} payload={{viewId: id, problem: {type: 'measurement', data, labels: []},
        targetLabels: [], isSolutionView: solution, seed: 7}} />);
};
const text = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const allIds: ViewId[] = ['volume-fractional-packing-count', 'volume-packing-product-explanation', 'volume-product-model',
    'volume-formula-execution', 'volume-formula-story'];
const profiles: readonly FractionalPrismRelationProfile[] = ['packing-count', 'packing-equivalence', 'triple-product',
    'associative-triple-product', 'edge-formula', 'base-area-formula'];
const built = (profile: FractionalPrismRelationProfile, denominator = 3) => buildFractionalRectangularPrismVolumeProblem({
    packingBounds: {columns: 4, rows: 2, layers: 3}, partitionDenominator: denominator, relationProfile: profile
});

describe('fractional prism consumers', () => {
    it('preserves the independent six-cube versus three-quarter-volume oracle', () => {
        expect(isValidRectangularPrismVolume(fractionalPrismLiteral)).toBe(true);
        const q = render('volume-fractional-packing-count', fractionalPrismLiteral, false);
        const s = render('volume-fractional-packing-count', fractionalPrismLiteral, true);
        expect(q.match(/data-prism-cell=/g)).toHaveLength(6);
        expect(q).not.toContain('cube-ordinal');
        expect(q).not.toContain('prism-count-answer');
        expect(q).not.toContain('prism-volume-answer');
        expect(q).not.toContain('emerald');
        expect(text(q)).toContain('Every small cube has edge 1/2 u');
        expect(s.match(/data-role="cube-ordinal"/g)).toHaveLength(6);
        expect(text(s)).toContain('6 small cubes');
        expect(text(s)).toContain('6 × (1/8) = 3/4 u³');
        expect(text(s)).not.toContain('Prism volume: 6 u³');
        expect(s).toContain('text-emerald-900');
    });

    it('explains both physical products and the actual extra edge/layer certificate', () => {
        const q = render('volume-packing-product-explanation', fractionalPrismLiteral, false);
        const s = text(render('volume-packing-product-explanation', fractionalPrismLiteral, true));
        expect(text(q)).toContain('Explain why');
        expect(q).not.toContain('packing-equivalence-work');
        expect(q).not.toContain('cube-volume-work');
        expect(q).not.toContain('prism-volume-answer');
        expect(s).toContain('3 × (1/2) = 3/2 u');
        expect(s).toContain('2 × (1/2) = 1 u');
        expect(s).toContain('Physical base area times small-cube height: (3/2) × (1/2) = 3/4 u³');
        expect(s).toContain('Counting disjoint small cubes');
    });

    it('builds the same cube model by layers and columns without revealing a completed Q', () => {
        const data = built('associative-triple-product');
        const q = render('volume-product-model', data, false), s = render('volume-product-model', data, true);
        expect(q.match(/data-empty-slot=/g)).toHaveLength(48);
        expect(q).not.toContain('data-prism-cell=');
        expect(q).not.toContain('prism-volume-answer');
        expect(q).not.toContain('emerald');
        expect(text(q)).toContain('((4/3) × (2/3)) × 1 and (4/3) × ((2/3) × 1)');
        expect(s.match(/data-prism-cell=/g)).toHaveLength(48);
        expect(s).toContain('association-work');
        expect(s).toContain('#34d399');
        expect(text(s)).toContain('Prism volume: 8/9 u³');
    });

    it.each(['edge-formula', 'base-area-formula'] as const)('keeps %s formula questions unsolved and physical', profile => {
        const data = built(profile, 2);
        const q = render('volume-formula-execution', data, false), s = render('volume-formula-execution', data, true);
        expect(text(q)).not.toContain('V =');
        expect(q).not.toContain('packed-prism');
        expect(q).not.toContain('layer-groups');
        expect(q).not.toContain('cube-scale-premise');
        expect(q).not.toContain('emerald');
        expect(text(q)).toContain('Height: 3/2 u');
        expect(text(s)).toContain('Prism volume: 3 u³');
        expect(text(s)).toContain(profile === 'edge-formula' ? 'V = length × width × height' : 'V = base area × height');
    });

    it('requires story reading for both physical input variants without hidden numeric diagram clues', () => {
        for (const profile of ['edge-formula', 'base-area-formula'] as const) {
            const q = render('volume-formula-story', built(profile), false);
            expect(text(q)).toContain('storage crate');
            expect(text(q)).toContain(profile === 'edge-formula' ? 'inside length of 4/3 u' : 'inside base area of 8/9 u²');
            expect(q).not.toContain('prism-measured-input');
            expect(q).not.toContain('<text');
            expect(q).not.toContain('cube-scale-premise');
            expect(q).not.toContain('packed-prism');
            expect(text(q)).not.toContain('V =');
            expect(text(render('volume-formula-story', built(profile), true))).toContain('The crate holds 8/9 u³');
        }
    });

    it('formats commuted supplied arithmetic without replacing the stored witness', () => {
        const data = structuredClone(fractionalPrismLiteral);
        const swapped = {...data, packingVolumeProduct: {...data.packingVolumeProduct,
            operands: [data.packingVolumeProduct.operands[1], data.packingVolumeProduct.operands[0]] as const}};
        expect(isValidRectangularPrismVolume(swapped)).toBe(true);
        expect(text(render('volume-fractional-packing-count', swapped, true))).toContain('(1/8) × 6 = 3/4 u³');
    });

    it('accepts every fractional profile through every runtime leaf, including optional absence', () => {
        for (const profile of profiles) for (const n of [2, 3, 4]) {
            const data = built(profile, n);
            for (const id of allIds) for (const solution of [false, true]) expect(() => render(id, data, solution)).not.toThrow();
        }
        const oneCell = buildFractionalRectangularPrismVolumeProblem({packingBounds: {columns: 1, rows: 1, layers: 1},
            partitionDenominator: 2, relationProfile: 'edge-formula'});
        const wider = buildFractionalRectangularPrismVolumeProblem({packingBounds: {columns: 5, rows: 1, layers: 2},
            partitionDenominator: 3, relationProfile: 'packing-count'});
        for (const id of allIds) for (const data of [oneCell, wider]) for (const solution of [false, true]) {
            const markup = render(id, data, solution);
            expect(markup).not.toMatch(/NaN|undefined|\[object Object\]|□/);
        }
    });

    it('preserves the unchanged integer body through all four adopted wrappers in both modes', () => {
        const tasks: readonly [ViewId, PrismTask][] = [
            ['volume-packing-product-explanation', 'packing-explanation'], ['volume-product-model', 'product-model'],
            ['volume-formula-execution', 'formula-execution'], ['volume-formula-story', 'formula-story']
        ];
        for (const [id, task] of tasks) for (const solution of [false, true]) expect(render(id, integerPrismLiteral, solution))
            .toBe(renderToStaticMarkup(<RectangularPrismBody data={integerPrismLiteral} isSolutionView={solution} task={task} />));
        const q = render('volume-fractional-packing-count', integerPrismLiteral, false);
        const s = text(render('volume-fractional-packing-count', integerPrismLiteral, true));
        expect(q.match(/data-prism-cell=/g)).toHaveLength(8);
        expect(q).not.toContain('prism-volume-answer');
        expect(s).toContain('8 small cubes');
        expect(s).toContain('Prism volume: 8 u³');
    });

    it('rejects malformed exact witnesses, sparse cells and forged measurement repeats in every wrapper', () => {
        const data = fractionalPrismLiteral;
        const malformed: unknown[] = [null, {...data, occupiedCells: new Array(6)}, {...data, heightLayers: [{...data.heightLayers[0], cells: new Array(6)}]},
            {...data, countingTrace: data.countingTrace!.map(row => ({...row, ordinal: 1}))},
            {...data, unitCubeVolumeCubicUnits: {numerator: 1, denominator: 4}},
            {...data, packingBounds: {...data.packingBounds, columns: 4}},
            {...data, physicalProducts: {...data.physicalProducts, volume: {...data.physicalProducts.volume, result: {numerator: 5, denominator: 4}}}},
            {...data, measuredInput: {kind: 'three-edges', lengthUnits: {numerator: 1, denominator: 2}, widthUnits: {numerator: 1, denominator: 1}, heightUnits: {numerator: 1, denominator: 2}}}];
        for (const bad of malformed) for (const id of allIds) expect(() => render(id, bad as RectangularPrismVolumeProblem, false)).toThrow(ViewValidationError);
    });

    it('admits formula evidence only without either selected packing or cube-scale capability', () => {
        const predicate = (selected: readonly string[]) => prismFormulaEvidence.predicate({
            has: (scope, label) => scope === 'generator' && selected.includes(label),
            exact: (scope, label) => scope === 'generator' && selected.includes(label)
        });
        expect(predicate([Area.Equation, Scope.FractionNumbers])).toBe(true);
        expect(predicate([Area.Equation, Area.MeasuringVolumes])).toBe(false);
        expect(predicate([Area.Equation, Scope.CubeScale])).toBe(false);
        expect(predicate([Area.Equation, Area.MeasuringVolumes, Scope.CubeScale])).toBe(false);
        expect(prismFormulaEvidence.dependencies).toEqual([
            {scope: 'generator', label: Area.MeasuringVolumes}, {scope: 'generator', label: Scope.CubeScale}
        ]);
    });
});
