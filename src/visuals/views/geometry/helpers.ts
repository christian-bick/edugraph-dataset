export type GeometryPoint = {x: number; y: number};

export const pointOnAngleCircle = (
    centerX: number,
    centerY: number,
    radius: number,
    degrees: number
): GeometryPoint => {
    const radians = degrees * Math.PI / 180;
    return {
        x: centerX + radius * Math.cos(radians),
        y: centerY - radius * Math.sin(radians)
    };
};

export const counterclockwiseAngleArc = (
    centerX: number,
    centerY: number,
    radius: number,
    startDegrees: number,
    endDegrees: number
): string => {
    const start = pointOnAngleCircle(centerX, centerY, radius, startDegrees);
    const end = pointOnAngleCircle(centerX, centerY, radius, endDegrees);
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${endDegrees - startDegrees > 180 ? 1 : 0} 0 ${end.x} ${end.y}`;
};
