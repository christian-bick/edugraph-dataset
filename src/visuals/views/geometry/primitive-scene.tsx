import {
    GeometryPrimitiveCoordinate,
    GeometryPrimitiveKind,
    GeometryPrimitiveScene
} from '../../../types/problems.ts';

const polarPoint = (
    center: GeometryPrimitiveCoordinate,
    radius: number,
    degrees: number
): GeometryPrimitiveCoordinate => {
    const radians = degrees * Math.PI / 180;
    return {
        x: center.x + radius * Math.cos(radians),
        y: center.y + radius * Math.sin(radians)
    };
};

const angleArcPath = (
    center: GeometryPrimitiveCoordinate,
    radius: number,
    startDegrees: number,
    endDegrees: number
): string => {
    const start = polarPoint(center, radius, startDegrees);
    const end = polarPoint(center, radius, endDegrees);
    const sweep = endDegrees >= startDegrees ? 1 : 0;
    const large = Math.abs(endDegrees - startDegrees) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} ${sweep} ${end.x} ${end.y}`;
};

export function PrimitiveScene({
    scene,
    kind,
    markerId,
    accent
}: {
    scene: GeometryPrimitiveScene;
    kind: GeometryPrimitiveKind;
    markerId: string;
    accent: string;
}) {
    return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
            <defs>
                <marker id={`${markerId}-start`} markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
                    <path d="M6,0 L6,6 L0,3 z" fill={accent} />
                </marker>
                <marker id={`${markerId}-end`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill={accent} />
                </marker>
            </defs>
            {scene.strokes.map(stroke => (
                <line
                    key={stroke.id}
                    x1={stroke.start.x}
                    y1={stroke.start.y}
                    x2={stroke.end.x}
                    y2={stroke.end.y}
                    stroke={accent}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    markerStart={stroke.arrowStart ? `url(#${markerId}-start)` : undefined}
                    markerEnd={stroke.arrowEnd ? `url(#${markerId}-end)` : undefined}
                />
            ))}
            {scene.markers.map((marker, index) => {
                if (marker.kind === 'angle-arc') {
                    return (
                        <path
                            key={`angle-${index}`}
                            d={angleArcPath(marker.center, marker.radius, marker.startDegrees, marker.endDegrees)}
                            fill="none"
                            stroke="#d97706"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                        />
                    );
                }
                if (marker.kind === 'right-angle') {
                    return (
                        <polyline
                            key={`right-${index}`}
                            points={marker.points.map(point => `${point.x},${point.y}`).join(' ')}
                            fill="none"
                            stroke="#d97706"
                            strokeWidth="2.4"
                            strokeLinejoin="round"
                        />
                    );
                }
                return (
                    <g key={`parallel-${index}`} stroke="#d97706" strokeWidth="2.6" strokeLinecap="round">
                        {marker.strokes.map(([start, end], strokeIndex) => (
                            <line
                                key={strokeIndex}
                                x1={start.x}
                                y1={start.y}
                                x2={end.x}
                                y2={end.y}
                            />
                        ))}
                    </g>
                );
            })}
            {scene.points.map(point => (
                <g key={point.id}>
                    <circle
                        cx={point.x}
                        cy={point.y}
                        r={kind === 'point' ? 3.3 : 2.8}
                        fill={kind === 'point' ? accent : '#ffffff'}
                        stroke={accent}
                        strokeWidth="2.2"
                    />
                    <text
                        x={point.labelPosition.x}
                        y={point.labelPosition.y}
                        textAnchor="middle"
                        fill="#1e293b"
                        className="text-[7px] font-extrabold"
                    >
                        {point.label}
                    </text>
                </g>
            ))}
        </svg>
    );
}
