import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {GeometryPrimitiveKind, GeometryPrimitiveScene} from '../../../types/problems.ts';
import {completedPrimitiveScene, primitiveGuideScene} from './primitive-contract.ts';
import {PrimitiveScene} from './primitive-scene.tsx';

const kinds: readonly GeometryPrimitiveKind[] = ['point', 'line', 'line-segment', 'ray',
    'right-angle', 'acute-angle', 'obtuse-angle', 'perpendicular-lines', 'parallel-lines'];
const attribute = (markup: string, name: string): string | undefined =>
    new RegExp(`${name}="([^"]+)"`).exec(markup)?.[1];
const render = (scene: GeometryPrimitiveScene, kind: GeometryPrimitiveKind): string =>
    renderToStaticMarkup(<PrimitiveScene scene={scene} kind={kind} markerId="clearance" accent="#047857" />);

/** Read the actual rendered marker polygons and transform them into scene coordinates. */
function arrowBounds(markup: string) {
    const markers = new Map([...markup.matchAll(/<marker\b([^>]*)>(.*?)<\/marker>/g)].map(([, attrs, body]) => {
        const viewBox = attribute(attrs!, 'viewBox')!.split(' ').map(Number);
        const path = attribute(body!, 'd')!;
        return [attribute(attrs!, 'id')!, {attrs: attrs!, viewBox,
            vertices: [...path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(([, x, y]) => [Number(x), Number(y)])}];
    }));
    return [...markup.matchAll(/<line\b([^>]*)/g)].flatMap(([, attrs]) => {
        const x1 = Number(attribute(attrs!, 'x1')), y1 = Number(attribute(attrs!, 'y1'));
        const x2 = Number(attribute(attrs!, 'x2')), y2 = Number(attribute(attrs!, 'y2'));
        const angle = Math.atan2(y2 - y1, x2 - x1);
        return (['start', 'end'] as const).flatMap(end => {
            const markerUrl = attribute(attrs!, `marker-${end}`);
            if (!markerUrl) return [];
            const marker = markers.get(markerUrl.slice(5, -1))!;
            const unitScale = attribute(marker.attrs, 'markerUnits') === 'userSpaceOnUse'
                ? 1 : Number(attribute(attrs!, 'stroke-width'));
            const scaleX = Number(attribute(marker.attrs, 'markerWidth')) / marker.viewBox[2]! * unitScale;
            const scaleY = Number(attribute(marker.attrs, 'markerHeight')) / marker.viewBox[3]! * unitScale;
            const refX = Number(attribute(marker.attrs, 'refX')), refY = Number(attribute(marker.attrs, 'refY'));
            const points = marker.vertices.map(([x, y]) => {
                const localX = (x! - refX) * scaleX, localY = (y! - refY) * scaleY;
                return {x: (end === 'start' ? x1 : x2) + localX * Math.cos(angle) - localY * Math.sin(angle),
                    y: (end === 'start' ? y1 : y2) + localX * Math.sin(angle) + localY * Math.cos(angle)};
            });
            return [{left: Math.min(...points.map(point => point.x)), right: Math.max(...points.map(point => point.x)),
                top: Math.min(...points.map(point => point.y)), bottom: Math.max(...points.map(point => point.y))}];
        });
    });
}

describe('primitive scene arrow and label clearance', () => {
    it('keeps line arrowheads away from A and B independently of the thick construction stroke', () => {
        const markup = render(completedPrimitiveScene('line'), 'line');
        const arrows = arrowBounds(markup);
        expect(arrows).toHaveLength(2);
        for (const arrow of arrows) {
            expect(arrow.bottom - arrow.top).toBeLessThanOrEqual(8);
        }
        expect(arrows[0]!.right).toBeLessThan(19 - 3.5);
        expect(arrows[1]!.left).toBeGreaterThan(79 + 3.5);
        // A rounded 3.2-unit shaft extends 1.6 units past its endpoint.
        // The triangle must project beyond that cap to retain a visible tip.
        expect(arrows[0]!.left).toBeLessThan(8 - 3.2 / 2);
        expect(arrows[1]!.right).toBeGreaterThan(92 + 3.2 / 2);
    });

    it.each(kinds)('keeps all %s guide and solution labels clear of arrowhead bounds', kind => {
        for (const scene of [primitiveGuideScene(kind), completedPrimitiveScene(kind)]) {
            const arrows = arrowBounds(render(scene, kind));
            for (const arrow of arrows) {
                expect(arrow.left).toBeGreaterThanOrEqual(0);
                expect(arrow.right).toBeLessThanOrEqual(100);
                expect(arrow.top).toBeGreaterThanOrEqual(0);
                expect(arrow.bottom).toBeLessThanOrEqual(100);
            }
            for (const point of scene.points) for (const arrow of arrows) {
                // Conservative box for a bold seven-unit capital at its SVG baseline.
                const label = {left: point.labelPosition.x - 3.5, right: point.labelPosition.x + 3.5,
                    top: point.labelPosition.y - 7, bottom: point.labelPosition.y + 1};
                const clear = label.right + 1 < arrow.left || label.left - 1 > arrow.right
                    || label.bottom + 1 < arrow.top || label.top - 1 > arrow.bottom;
                expect(clear, `${kind}: label ${point.label} intersects an arrowhead`).toBe(true);
            }
        }
    });
});
