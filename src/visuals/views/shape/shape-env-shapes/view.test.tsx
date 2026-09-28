import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ModelSourceIndex} from '../../../../lib/model-source-index.ts';
import {ShapeEnvShapesProblem} from '../../../../types/problems.ts';
import {ShapeEnvShapesCore} from './view.tsx';

const render = (data: ShapeEnvShapesProblem, isSolutionView: boolean) => renderToStaticMarkup(
    <ShapeEnvShapesCore config={{}} payload={{viewId: 'shape-env-shapes',
        problem: {type: 'shape', data, labels: []}, targetLabels: [], seed: 42, isSolutionView}} />
);
const examples = [
    {target: 'clock', answer: 'circle', asset: 'clock', subject: 'clock face'},
    {target: 'window', answer: 'square', asset: 'window', subject: 'window frame'},
    {target: 'table', answer: 'rectangle', asset: 'table', subject: 'tabletop'},
    {target: 'pennant', answer: 'triangle', asset: 'pennant', subject: 'pennant'},
    {target: 'honeycomb cell', answer: 'hexagon', asset: 'honeycomb', subject: 'opening of a honeycomb cell'}
];

describe('environmental object images', () => {
    it.each(examples)('preserves the $target image and reveals only the solution choice', example => {
        const question = render(example, false);
        const solution = render(example, true);
        const image = (html: string) => html.match(/<img[^>]+>/)?.[0];
        expect(image(question)).toContain(`/icons/environment-objects/${example.asset}.png`);
        expect(image(question)).toBe(image(solution));
        expect(question).toContain(`What shape is the ${example.subject}?`);
        expect(question).not.toContain('border-green-600');
        expect(solution.match(/border-green-600/g)).toHaveLength(1);
        expect(solution).toMatch(new RegExp(`border-green-600[^>]*>${example.answer[0].toUpperCase()}${example.answer.slice(1)}</div>`));
        expect(render(example, false)).toBe(question);
    });

    it('includes every saved image in the view dependency closure', () => {
        const projectRoot = fileURLToPath(new URL('../../../../../', import.meta.url));
        const viewPath = fileURLToPath(new URL('./view.tsx', import.meta.url));
        const dependencies = new ModelSourceIndex(projectRoot).dependencies([viewPath]);
        for (const {asset} of examples) {
            const imagePath = resolve(projectRoot, `public/icons/environment-objects/${asset}.png`);
            expect(dependencies).toContain(imagePath);
            expect(readFileSync(imagePath).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
        }
    });

    it('rejects an unknown object or shape instead of rendering an incomplete answer', () => {
        expect(() => render({target: 'unknown', answer: 'circle'}, false)).toThrow(/Unsupported target/);
        expect(() => render({target: 'clock', answer: 'unknown'}, false)).toThrow(/Unsupported shape answer/);
        expect(() => render({target: 'clock', answer: undefined!}, false)).toThrow(/Required field/);
    });
});
