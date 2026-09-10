import {ViewValidationError} from '../../helpers/validation.ts';

function interiorAngleMarker(
    vertex: {x: number; y: number},
    previous: {x: number; y: number},
    next: {x: number; y: number}
) {
    const pointOnRay = (end: {x: number; y: number}, distance: number) => {
        const dx = end.x - vertex.x;
        const dy = end.y - vertex.y;
        const length = Math.hypot(dx, dy);
        return {x: vertex.x + dx / length * distance, y: vertex.y + dy / length * distance};
    };
    const start = pointOnRay(previous, 13);
    const end = pointOnRay(next, 13);
    const centroidDirection = {
        x: (previous.x + next.x) / 2,
        y: (previous.y + next.y) / 2
    };
    const label = pointOnRay(centroidDirection, 19);
    return {
        path: `M ${start.x} ${start.y} Q ${vertex.x} ${vertex.y} ${end.x} ${end.y}`,
        label
    };
}

export function verticesForShape(shape: string, viewId: string): Array<{x: number; y: number}> {
    let vertices: Array<{ x: number; y: number }> = [];

    if (shape === 'square') {
        vertices = [{ x: 15, y: 15 }, { x: 85, y: 15 }, { x: 85, y: 85 }, { x: 15, y: 85 }];
    } else if (shape === 'rectangle') {
        vertices = [{ x: 10, y: 25 }, { x: 90, y: 25 }, { x: 90, y: 75 }, { x: 10, y: 75 }];
    } else if (shape === 'triangle') {
        vertices = [{ x: 50, y: 15 }, { x: 85, y: 85 }, { x: 15, y: 85 }];
    } else if (shape === 'quadrilateral') {
        vertices = [{ x: 18, y: 18 }, { x: 87, y: 12 }, { x: 75, y: 88 }, { x: 10, y: 72 }];
    } else if (shape === 'pentagon') {
        vertices = [{ x: 50, y: 8 }, { x: 90, y: 38 }, { x: 75, y: 88 }, { x: 25, y: 88 }, { x: 10, y: 38 }];
    } else if (shape === 'hexagon') {
        vertices = [
            { x: 50, y: 10 }, { x: 85, y: 30 }, { x: 85, y: 70 },
            { x: 50, y: 90 }, { x: 15, y: 70 }, { x: 15, y: 30 }
        ];
    } else {
        throw new ViewValidationError(viewId, `Unsupported shape: ${shape}`);
    }

    return vertices;
}

export function ShapeSVG({
    shape,
    viewId,
    size = 100,
    solved = false,
    markAngles = false
}: {
    shape: string;
    viewId: string;
    size?: number;
    solved?: boolean;
    markAngles?: boolean;
}) {
    const vertices = verticesForShape(shape, viewId);

    const pointsStr = vertices.map(v => `${v.x},${v.y}`).join(' ');

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className="overflow-visible"
            aria-label={markAngles ? `${vertices.length} marked interior angles` : undefined}
        >
            {/* Sticks (sides) */}
            <polygon points={pointsStr} fill="none" stroke={solved ? 'forestgreen' : '#64748b'} strokeWidth="5" strokeLinejoin="miter" />
            {/* Clay balls (corners) */}
            {!markAngles && vertices.map((v, i) => (
                <circle key={i} cx={v.x} cy={v.y} r="7" fill={solved ? '#dcfce7' : '#e11d48'} stroke={solved ? 'forestgreen' : '#be123c'} strokeWidth="1.5" />
            ))}
            {markAngles && vertices.map((vertex, index) => {
                const marker = interiorAngleMarker(
                    vertex,
                    vertices[(index - 1 + vertices.length) % vertices.length],
                    vertices[(index + 1) % vertices.length]
                );
                return (
                    <g key={index}>
                        <path
                            d={marker.path}
                            fill="none"
                            stroke="#ea580c"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                        <text
                            x={marker.label.x}
                            y={marker.label.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#9a3412"
                            fontSize="8"
                            fontWeight="800"
                        >
                            {index + 1}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export function MaterialTray({sides, corners}: {sides: number; corners: number}) {
    return (
        <div className="flex flex-col items-center justify-center gap-6" aria-label="Unassembled construction materials">
            <div className="flex flex-wrap justify-center gap-2 max-w-[270px]">
                {Array.from({length: sides}, (_, index) => (
                    <span
                        key={`stick-${index}`}
                        className="block w-[58px] h-[6px] rounded-full bg-slate-500"
                        style={{transform: `rotate(${index % 2 === 0 ? -7 : 8}deg)`}}
                    />
                ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3 max-w-[220px]">
                {Array.from({length: corners}, (_, index) => (
                    <span key={`corner-${index}`} className="block w-[18px] h-[18px] rounded-full bg-rose-600 border border-rose-700" />
                ))}
            </div>
        </div>
    );
}

export function LoosePartsAssemblyLayout({
    target,
    sides,
    corners,
    isSolutionView
}: {
    target: string;
    sides: number;
    corners: number;
    isSolutionView: boolean;
}) {
    return (
        <div className="flex w-fit items-center justify-center rounded-2xl bg-white p-[30px] font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex w-[620px] flex-col items-center gap-5">
                <div className="text-center text-[1.3rem] font-bold leading-normal text-slate-700">
                    {isSolutionView
                        ? `${target[0].toUpperCase()}${target.slice(1)} built from ${sides} sticks and ${corners} corners`
                        : `Use the loose sticks and corners to build a ${target}.`}
                </div>
                <div className="grid w-full grid-cols-2 gap-4">
                    <div className="flex h-[250px] flex-col items-center justify-center rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                        <div className="mb-5 text-sm font-extrabold uppercase tracking-wide text-amber-800">
                            {isSolutionView ? 'Parts used' : 'Loose parts'}
                        </div>
                        {isSolutionView
                            ? (
                                <div className="flex flex-col items-center gap-3 text-center font-bold text-emerald-700">
                                    <span className="text-4xl">✓</span>
                                    <span>All {sides} sticks and {corners} corners</span>
                                </div>
                            )
                            : <MaterialTray sides={sides} corners={corners} />}
                    </div>
                    <div className="flex h-[250px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
                        <div className="mb-3 text-sm font-extrabold uppercase tracking-wide text-slate-500">Assembly area</div>
                        {isSolutionView
                            ? <ShapeSVG viewId="shape-build-from-parts" shape={target} size={175} solved />
                            : <div className="flex h-[175px] items-center text-lg font-bold text-slate-400">Build here</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
