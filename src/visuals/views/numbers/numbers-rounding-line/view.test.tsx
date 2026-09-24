import {renderToStaticMarkup} from 'react-dom/server';
import {Ability, Area, Scope} from 'edugraph-ts';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {IntegerRoundingGenerator} from '../../../../generators/place-value/integer-rounding/generator.ts';
import {IntegerRoundingGeneratorSchema, spec as generatorSpec} from '../../../../generators/place-value/integer-rounding/spec.ts';
import {planModelCompatibility} from '../../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../../lib/planned-generation.ts';
import {NumbersRoundingLineViewSchema, spec as viewSpec} from './spec.ts';

let NumbersRoundingLine: typeof import('./view.tsx')['NumbersRoundingLine'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({NumbersRoundingLine} = await import('./view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

const attrs = (tag: string): Record<string, string> =>
    Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]));
const elements = (markup: string, tag: string) =>
    [...markup.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map(match => attrs(match[0]));

function recordedDraw() {
    const target = {id: '3.NBT.A.1-round-nearest-10-100~b099aaf9', labels: [
        Area.IntegerRounding, Scope.ArabicNumerals, Scope.Base10, Scope.NumbersSmaller1000,
        Scope.NumbersWithoutNegatives, Ability.ProcedureExecution, Scope.StepsOf100
    ]};
    const planned = planModelCompatibility(target,
        {...generatorSpec, schema: IntegerRoundingGeneratorSchema, spec: generatorSpec},
        {...viewSpec, schema: NumbersRoundingLineViewSchema, spec: viewSpec});
    if (!planned.supported) throw new Error(`Rounding regression is unsupported: ${planned.reason}`);
    const draw = generatePlannedDraw({generator: new IntegerRoundingGenerator(), viewSchema: NumbersRoundingLineViewSchema,
        plan: planned.plan, sampleKey: `${target.id}#integer-rounding#numbers-rounding-line#train#question#inst:0`,
        attempt: 1, seed: 1340117192});
    expect(draw.stub!.data).toMatchObject({number: 851, lowerMultiple: 800, upperMultiple: 900,
        midpoint: 850, roundedValue: 900, distanceLower: 51, distanceUpper: 49, isMidpointTie: false});
    return {draw, target};
}

describe('legacy rounding source precision', () => {
    it.each([[801, false], [801, true], [899, false], [899, true]] as const)(
        'preserves the source marker near endpoint %s in solution mode %s', (number, isSolutionView) => {
            const {draw, target} = recordedDraw();
            const roundedValue = number === 801 ? 800 : 900;
            const data = {...draw.stub!.data, number, roundedValue, direction: number === 801 ? 'down' : 'up',
                distanceLower: number - 800, distanceUpper: 900 - number};
            const markup = renderToStaticMarkup(<NumbersRoundingLine payload={{
                problem: {type: 'arithmetic', data, labels: draw.labels},
                targetLabels: target.labels, viewId: 'numbers-rounding-line', isSolutionView,
                seed: draw.replay.seed, preparedView: draw.view
            }} />);
            const circles = elements(markup, 'circle');
            const source = circles.find(element => element.fill === '#2563eb')!;
            const axis = elements(markup, 'line').find(element => element.stroke === '#334155')!;
            expect((Number(source.cx) - Number(axis.x1)) / (Number(axis.x2) - Number(axis.x1)))
                .toBeCloseTo((number - 800) / 100);
            const endpoint = circles.find(element => element.fill === '#059669');
            if (isSolutionView) {
                expect(endpoint).toBeDefined();
                // Later SVG paint must keep the small source visible when both markers overlap.
                expect(circles.indexOf(source)).toBeGreaterThan(circles.indexOf(endpoint!));
                expect(markup).toContain(`${number} → ${roundedValue}`);
            } else {
                expect(endpoint).toBeUndefined();
                expect(markup).toContain(`${number} → ?`);
            }
        });

    it.each([false, true])('keeps recorded 851 separate from the 850 tick in solution mode %s', isSolutionView => {
        const {draw, target} = recordedDraw();
        const markup = renderToStaticMarkup(<NumbersRoundingLine payload={{
            problem: {type: 'arithmetic', data: draw.stub!.data, labels: draw.labels},
            targetLabels: target.labels, viewId: 'numbers-rounding-line', isSolutionView,
            seed: draw.replay.seed, preparedView: draw.view
        }} />);
        const point = elements(markup, 'circle').find(element => element.fill === '#2563eb')!;
        const axis = elements(markup, 'line').find(element => element.stroke === '#334155')!;
        const pointX = Number(point.cx);
        const midpointX = (Number(axis.x1) + Number(axis.x2)) / 2;
        expect((pointX - Number(axis.x1)) / (Number(axis.x2) - Number(axis.x1))).toBeCloseTo(0.51);
        const midpointTick = elements(markup, 'line').find(element =>
            element.stroke === '#475569' && Number(element.x1) === midpointX)!;
        const pointExtent = Number(point.r) + Number(point['stroke-width']) / 2;
        expect(pointX - pointExtent).toBeGreaterThan(midpointX + Number(midpointTick['stroke-width']) / 2);
        const leader = elements(markup, 'line').find(element => element.stroke === '#2563eb')!;
        expect(Number(leader.x1)).toBe(pointX);
        expect(Number(leader.x2)).toBeGreaterThan(pointX);
        expect(Number(leader.y1)).toBeLessThan(Number(point.cy));
        const text = markup.replace(/<[^>]+>/g, '');
        expect(text).toContain('Local scale: 850 &lt; 851 &lt; 860');
        if (isSolutionView) {
            expect(text).toContain('851 → 900. 851 is closer to 900.');
            expect(text).toContain('distance 51');
            expect(text).toContain('distance 49');
        } else {
            expect(text).toContain('851 → ?');
            expect(text).not.toContain('851 → 900');
            expect(text).not.toContain('distance ');
        }
    });
});
