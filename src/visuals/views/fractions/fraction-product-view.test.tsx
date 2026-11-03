import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionProductFixtureGenerator as FractionProductsGenerator, productRelationFixture} from '../../../generators/fraction/fraction-product-fixtures.ts';
import {formatProductValue} from './fraction-product-helpers.ts';
import {FractionProductBody} from './fraction-product-view.tsx';
import {buildFractionProduct} from '../../../generators/fraction/fraction-product-domain.ts';

const generator = new FractionProductsGenerator();
const profiles = ['fraction-partition-proper', 'fraction-partition-improper',
    'fraction-equation-proper', 'fraction-equation-improper', 'mixed-equation'] as const;
const sample = (productProfile: typeof profiles[number]) => {
    setSeed(`fraction-product-render-${productProfile}`);
    return generator.generate({productProfile}).data;
};
const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('fraction product task projections', () => {
    it('requires both interpretation orders while leaving the story at its equal-parts relation', () => {
        const data = buildFractionProduct({operandForm: 'fractions', multiplier: {form: 'fraction', numerator: 17, denominator: 6},
            quantity: {form: 'fraction', numerator: 6, denominator: 1}}, 'fraction-partition-improper', 'ribbon');
        const question = visible(renderToStaticMarkup(<FractionProductBody data={data} task="partition-interpretation" isSolutionView={false} />));
        const solution = visible(renderToStaticMarkup(<FractionProductBody data={data} task="partition-interpretation" isSolutionView />));
        const story = visible(renderToStaticMarkup(<FractionProductBody data={productRelationFixture(data)} task="story-creation" isSolutionView />));
        expect(question).toContain('Show both calculation orders:');
        expect(question).toContain('multiply the numerator by the complete quantity before dividing by the denominator');
        expect(question).not.toContain('102');
        expect(solution).toContain('(17 × 6) ÷ 6 = 102 ÷ 6');
        expect(story).toContain('uses 17 of these pieces');
        expect(story).not.toContain('102 ÷ 6');
    });
    it.each(profiles)(
        '%s keeps the three requested actions distinct in Q/S', productProfile => {
            const data = sample(productProfile);
            const relation = productRelationFixture(data);
            const partitionQ = renderToStaticMarkup(<FractionProductBody data={data} task="partition-interpretation" isSolutionView={false} />);
            const partitionS = renderToStaticMarkup(<FractionProductBody data={data} task="partition-interpretation" isSolutionView />);
            const storyQ = renderToStaticMarkup(<FractionProductBody data={relation} task="story-creation" isSolutionView={false} />);
            const storyS = renderToStaticMarkup(<FractionProductBody data={relation} task="story-creation" isSolutionView />);
            const wordQ = renderToStaticMarkup(<FractionProductBody data={relation} task="word-problem" isSolutionView={false} />);
            const wordS = renderToStaticMarkup(<FractionProductBody data={relation} task="word-problem" isSolutionView />);

            expect(partitionQ).toContain('Each row is the complete');
            expect(partitionQ).toContain('Blue sections are selected');
            expect(partitionQ).toContain('viewBox="0 0 750 270"');
            const captionY = Number(partitionQ.match(/<text x="20" y="(\d+)"[^>]*>Each row/)?.[1]);
            const zeroTickY = Number(partitionQ.match(/<text x="132" y="(\d+)"[^>]*>0 m/)?.[1]);
            expect(zeroTickY - captionY).toBeGreaterThanOrEqual(24);
            expect(visible(partitionQ).includes(' = ')).toBe(data.equationWitness !== undefined);
            expect(visible(partitionQ)).not.toContain('One part is');
            expect(visible(partitionS)).toContain('One part is');
            expect(visible(partitionS)).toContain('÷');

            expect(visible(storyQ)).toContain('My story:');
            expect(visible(storyQ).includes(' = ')).toBe(data.equationWitness !== undefined);
            expect(visible(storyQ)).not.toContain('Example story:');
            expect(visible(storyS)).toContain('Example story:');
            expect(visible(storyS)).not.toContain('= ______');

            expect(visible(wordQ)).toContain('reference');
            expect(visible(wordQ)).toContain('Equation: ____________________');
            expect(visible(wordQ)).toContain('equal-parts bar model with a measured number line');
            expect(visible(wordQ)).not.toContain('×');
            expect(wordQ).not.toContain('<svg');
            expect(visible(wordS)).toContain('×');
            expect(wordS).toContain('<svg');
            expect(wordS).not.toContain('>0 m</text>');
            expect(storyS).toContain('>0 m</text>');
            expect(visible(wordS)).toContain('meters');
        }
    );

    it('projects mixed multiplier improper numerator across repeated q copies', () => {
        const data = sample('mixed-equation');
        expect(data.operandForm).toBe('mixed-numbers');
        const solution = visible(renderToStaticMarkup(<FractionProductBody data={data}
            task="partition-interpretation" isSolutionView />));
        expect(solution).toContain('full numerator selects');
        expect(solution).toContain(`${data.partition.selectedPartCount} parts across the copies`);
        expect(solution).toContain(`${data.partition.copyCount} copies`);
    });

    it('uses singular meter in both displayed word-problem solution equations when the product is at most one', () => {
        let found = false;
        for (let seed = 0; seed < 100; seed++) {
            setSeed(`fraction-product-singular-${seed}`);
            const data = generator.generate({productProfile: 'fraction-equation-proper'}).data;
            if (data.product.numerator > data.product.denominator) continue;
            const solution = visible(renderToStaticMarkup(<FractionProductBody data={productRelationFixture(data)}
                task="word-problem" isSolutionView />));
            const value = formatProductValue(data.product);
            expect(solution).toContain(`${value} meter`);
            expect(solution).not.toContain(`${value} meters`);
            found = true;
            break;
        }
        expect(found).toBe(true);
    });
});
