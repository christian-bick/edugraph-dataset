import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionRectangleAreaGenerator} from '../../../generators/fraction/fraction-rectangle-area/generator.ts';
import {formatRectangleRational} from './fraction-rectangle-area-helpers.ts';
import {FractionRectangleAreaBody} from './fraction-rectangle-area-view.tsx';
import type {FractionRectangleTask} from './fraction-rectangle-area-view.tsx';

const generator = new FractionRectangleAreaGenerator();
const profiles = ['fraction-side-product', 'square-tile-proof'] as const;
const tasks: FractionRectangleTask[] = ['tiling-understanding', 'area-execution', 'product-construction'];
const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('fraction rectangle task projections', () => {
    it.each(profiles)('%s renders all three fixed tasks in Q and S', areaJustification => {
        setSeed(`fraction-rectangle-render-${areaJustification}`);
        const data = generator.generate({areaJustification}).data;
        const area = formatRectangleRational(data.areaSquareUnits);
        for (const task of tasks) {
            const question = renderToStaticMarkup(<FractionRectangleAreaBody data={data} task={task} isSolutionView={false} />);
            const solution = renderToStaticMarkup(<FractionRectangleAreaBody data={data} task={task} isSolutionView />);
            expect(visible(question)).toContain(formatRectangleRational(data.outerRectangle.length));
            expect(visible(question)).toContain(formatRectangleRational(data.outerRectangle.width));
            expect(visible(question)).not.toContain('Side product:');
            expect(visible(question)).not.toContain('Tile count:');
            expect(visible(solution)).toContain(`${area} square units`);
            if (task === 'tiling-understanding') {
                expect(question).toContain('data-square-tile="true"');
                expect(question).toContain('data-outer-rectangle="true"');
                expect(visible(question)).toContain(`area ${formatRectangleRational(data.tileGrid.squareTile.areaSquareUnits)} square unit`);
                expect(visible(question)).toContain('Explain why counting');
                expect(visible(solution)).toContain(`${data.tileGrid.tileCount} ×`);
                expect(visible(solution)).toContain('without gaps or overlaps');
            } else if (task === 'area-execution') {
                expect(question).toContain('data-outer-rectangle="true"');
                expect(question).not.toContain('data-square-tile="true"');
                expect(visible(question)).toContain('Area = ______ square units');
                expect(visible(solution)).toContain('Length × width =');
                expect(visible(solution)).not.toContain('Tile count:');
            } else {
                expect(question).toContain('data-blank-lattice="true"');
                expect(question).not.toContain('data-outer-rectangle="true"');
                expect(question).not.toContain('data-square-tile="true"');
                expect(visible(question)).toContain('Product: ____________________');
                expect(solution).toContain('data-outer-rectangle="true"');
                expect(visible(solution)).toContain('Completed rectangle and product');
            }
        }
    });

    it('draws exactly the supplied square cells and a separate outer border for tiling', () => {
        setSeed('fraction-rectangle-cell-count');
        const data = generator.generate({areaJustification: 'square-tile-proof'}).data;
        const markup = renderToStaticMarkup(<FractionRectangleAreaBody data={data}
            task="tiling-understanding" isSolutionView={false} />);
        expect(markup.match(/data-square-tile="true"/g)?.length).toBe(data.tileGrid.tileCount);
        expect(markup.match(/data-outer-rectangle="true"/g)?.length).toBe(1);
    });
});
