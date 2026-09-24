import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';
import {withConfig} from './withConfig.tsx';
import {getRandomState, random, setSeed} from '../../lib/random.ts';
import {ontologyNeutral} from '../../lib/resolvers.ts';
import type {RenderPayload} from '../../types/ml-engine.ts';

function payload(): RenderPayload {
    setSeed(36);
    random();
    return {viewId: 'demo', targetLabels: ['unrelated'], seed: 900, isSolutionView: false,
        problem: {type: 'counting', data: {}, labels: []},
        preparedView: {version: 1, viewId: 'demo', planHash: 'plan', variantHash: 'variant', labels: [],
            config: {style: 'prepared'}, randomState: getRandomState()}};
}

describe('prepared view boundary', () => {
    it('uses the admitted configuration and exact presentation continuation without resolving again', () => {
        const resolver = vi.fn(() => 'forbidden fallback');
        const View = withConfig({style: ontologyNeutral(resolver)}, ({config}) =>
            <span>{config.style}:{random()}</span>);
        const input = payload();
        const continuation = random();
        setSeed(765);
        expect(renderToStaticMarkup(<View payload={input} />)).toBe(`<span>prepared:${continuation}</span>`);
        expect(resolver).not.toHaveBeenCalled();
        setSeed(842);
        expect(renderToStaticMarkup(<View payload={input} />)).toBe(`<span>prepared:${continuation}</span>`);
    });

    it('fails explicitly on missing, malformed or incomplete prepared configuration', () => {
        const View = withConfig({style: ['prepared']}, () => <span>rendered</span>);
        const input = payload();
        expect(() => renderToStaticMarkup(<View payload={{...input, preparedView: undefined}} />)).toThrow('plan-prepared');
        expect(() => renderToStaticMarkup(<View payload={{...input, viewId: 'another-view'}} />)).toThrow('different view');
        expect(() => renderToStaticMarkup(<View payload={{...input,
            preparedView: {...input.preparedView!, planHash: ''}}} />)).toThrow('plan-prepared');
        expect(() => renderToStaticMarkup(<View payload={{...input,
            preparedView: {...input.preparedView!, config: null as never}}} />)).toThrow('must be an object');
        expect(() => renderToStaticMarkup(<View payload={{...input,
            preparedView: {...input.preparedView!, config: {}}}} />)).toThrow('parameter "style" is missing');
        expect(() => renderToStaticMarkup(<View payload={{...input,
            preparedView: {...input.preparedView!, randomState: -1}}} />)).toThrow('unsigned 32-bit');
    });
});
