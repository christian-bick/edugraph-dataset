import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ShapeBuildShapeGenerator} from '../../../generators/shape/shape-build-shape/generator.ts';
import {ShapeCircleDefinitionGenerator} from '../../../generators/shape/shape-circle-definition/generator.ts';
import {ShapeAttributeCountGenerator} from '../../../generators/shape/shape-attribute-count/generator.ts';
import {ShapeExcludedQuadrilateralGenerator} from '../../../generators/shape/shape-excluded-quadrilateral/generator.ts';
import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {setSeed} from '../../../lib/random.ts';
import {ShapeConstructionView} from './shape-construction-view.tsx';
import {ShapeDrawingView} from './shape-drawing-view.tsx';

const payload = <T,>(data: T, isSolutionView: boolean): RenderPayload<AbstractProblem<T>> => ({
    problem: {type: 'shape', data, labels: []}, viewId: 'test', targetLabels: [], isSolutionView, seed: 17
});

describe('shape family render totality', () => {
    it.each(['triangle', 'square', 'rectangle', 'quadrilateral', 'pentagon', 'hexagon'] as const)(
        'constructs, draws and rotates the complete %s definition', shape => {
            const data = new ShapeBuildShapeGenerator().generate({shape}).data;
            for (const solution of [false, true]) {
                expect(renderToStaticMarkup(<ShapeConstructionView payload={payload(data, solution)} />)).toContain('Defining attributes');
                for (const mode of ['attributes', 'rotation'] as const) {
                    const markup = renderToStaticMarkup(<ShapeDrawingView mode={mode} expectedFamily="linear"
                        payload={payload(data, solution)} viewId={mode === 'rotation' ? 'shape-draw-linear-rotation' : 'shape-draw-linear-shape'} />);
                    expect(markup).toContain(solution ? 'forestgreen' : mode === 'rotation' ? 'Draw here' : 'Draw a shape');
                    if (mode === 'rotation') expect(markup).not.toContain('rotate(0 ');
                }
            }
        }
    );
    it('draws both circle projections from the same definition', () => {
        const data = new ShapeCircleDefinitionGenerator().generate({}).data;
        for (const solution of [false, true]) for (const mode of ['attributes', 'rotation'] as const) {
            expect(renderToStaticMarkup(<ShapeDrawingView mode={mode} expectedFamily="circular"
                payload={payload(data, solution)} viewId={mode === 'rotation' ? 'shape-draw-circular-rotation' : 'shape-draw-circular-shape'} />))
                .toContain(solution ? 'forestgreen' : mode === 'rotation' ? 'Draw here' : 'Draw a shape');
        }
    });
    it('renders each count witness in both modes, including five and six angles', () => {
        for (const attribute of ['vertices', 'angles', 'equal-faces'] as const) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const data = new ShapeAttributeCountGenerator().generate({attribute}).data;
                for (const solution of [false, true]) {
                    const markup = renderToStaticMarkup(<ShapeConstructionView payload={payload(data, solution)} />);
                    expect(markup).toContain('Required attribute');
                    if (solution && attribute === 'angles') expect(markup).toContain(data.requiredCount + ' angles counted');
                }
            }
        }
    });
    it('retains the defining evidence for the excluded quadrilateral', () => {
        const data = new ShapeExcludedQuadrilateralGenerator().generate({}).data;
        for (const solution of [false, true]) {
            const markup = renderToStaticMarkup(<ShapeDrawingView mode="exclusions" expectedFamily="linear"
                payload={payload(data, solution)} viewId="shape-draw-excluded-quadrilateral" />);
            expect(markup).toContain('Sides are not all equal');
            expect(markup).toContain('Has no right angles');
            expect(markup.includes('stroke="forestgreen"')).toBe(solution);
        }
    });
});
