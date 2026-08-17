import {
    GeometryPrimitiveCoordinate,
    GeometryPrimitiveKind,
    GeometryPrimitivePoint,
    GeometryPrimitiveScene,
    GeometryPrimitiveStroke
} from '../../../types/problems.ts';

const EPSILON = 0.001;

const isCoordinate = (point: GeometryPrimitiveCoordinate): boolean => typeof point === 'object'
    && point !== null
    && Number.isFinite(point.x)
    && Number.isFinite(point.y)
    && point.x >= 0
    && point.x <= 100
    && point.y >= 0
    && point.y <= 100;

const samePoint = (left: GeometryPrimitiveCoordinate, right: GeometryPrimitiveCoordinate): boolean => (
    Math.abs(left.x - right.x) < EPSILON && Math.abs(left.y - right.y) < EPSILON
);

const pointOnStroke = (point: GeometryPrimitiveCoordinate, stroke: GeometryPrimitiveStroke): boolean => {
    const cross = (point.x - stroke.start.x) * (stroke.end.y - stroke.start.y)
        - (point.y - stroke.start.y) * (stroke.end.x - stroke.start.x);
    const dot = (point.x - stroke.start.x) * (stroke.end.x - stroke.start.x)
        + (point.y - stroke.start.y) * (stroke.end.y - stroke.start.y);
    const squaredLength = (stroke.end.x - stroke.start.x) ** 2 + (stroke.end.y - stroke.start.y) ** 2;
    return Math.abs(cross) < EPSILON && dot >= -EPSILON && dot <= squaredLength + EPSILON;
};

const angleBetween = (left: GeometryPrimitiveStroke, right: GeometryPrimitiveStroke): number => {
    const leftVector = {x: left.end.x - left.start.x, y: left.end.y - left.start.y};
    const rightVector = {x: right.end.x - right.start.x, y: right.end.y - right.start.y};
    const dot = leftVector.x * rightVector.x + leftVector.y * rightVector.y;
    const magnitudes = Math.hypot(leftVector.x, leftVector.y) * Math.hypot(rightVector.x, rightVector.y);
    return Math.acos(Math.min(1, Math.max(-1, dot / magnitudes))) * 180 / Math.PI;
};

const hasExactPointLabels = (points: GeometryPrimitivePoint[], labels: readonly string[]): boolean => (
    points.length === labels.length
    && labels.every(label => points.some(point => point.id === label && point.label === label))
);

const hasValidSceneParts = (scene: GeometryPrimitiveScene): boolean => {
    if (typeof scene !== 'object'
        || scene === null
        || !Array.isArray(scene.points)
        || !Array.isArray(scene.strokes)
        || !Array.isArray(scene.markers)
        || scene.points.some(point => typeof point !== 'object' || point === null)
        || scene.strokes.some(stroke => typeof stroke !== 'object' || stroke === null)
        || scene.markers.some(marker => typeof marker !== 'object' || marker === null)) {
        return false;
    }
    const pointIds = new Set(scene.points.map(point => point.id));
    const strokeIds = new Set(scene.strokes.map(stroke => stroke.id));
    return pointIds.size === scene.points.length
        && strokeIds.size === scene.strokes.length
        && scene.points.every(point => point.id.length > 0
            && point.label.length > 0
            && isCoordinate(point)
            && isCoordinate(point.labelPosition))
        && scene.strokes.every(stroke => stroke.id.length > 0
            && isCoordinate(stroke.start)
            && isCoordinate(stroke.end)
            && !samePoint(stroke.start, stroke.end)
            && typeof stroke.arrowStart === 'boolean'
            && typeof stroke.arrowEnd === 'boolean')
        && scene.markers.every(marker => {
            if (marker.kind === 'angle-arc') {
                return isCoordinate(marker.center)
                    && Number.isFinite(marker.radius)
                    && marker.radius > 0
                    && marker.radius <= 50
                    && Number.isFinite(marker.startDegrees)
                    && Number.isFinite(marker.endDegrees)
                    && marker.startDegrees !== marker.endDegrees;
            }
            if (marker.kind === 'right-angle') {
                return Array.isArray(marker.points)
                    && marker.points.length === 3
                    && marker.points.every(isCoordinate)
                    && !samePoint(marker.points[0], marker.points[1])
                    && !samePoint(marker.points[1], marker.points[2]);
            }
            return marker.kind === 'parallel'
                && Array.isArray(marker.strokes)
                && marker.strokes.length === 2
                && marker.strokes.every(stroke => Array.isArray(stroke)
                    && stroke.length === 2
                    && isCoordinate(stroke[0])
                    && isCoordinate(stroke[1])
                    && !samePoint(stroke[0], stroke[1]));
        });
};

const isCompletedLinePrimitive = (
    kind: 'line' | 'line-segment' | 'ray',
    scene: GeometryPrimitiveScene
): boolean => {
    if (!hasExactPointLabels(scene.points, ['A', 'B']) || scene.strokes.length !== 1 || scene.markers.length !== 0) {
        return false;
    }
    const [stroke] = scene.strokes;
    const pointA = scene.points.find(point => point.id === 'A')!;
    const pointB = scene.points.find(point => point.id === 'B')!;
    if (!pointOnStroke(pointA, stroke) || !pointOnStroke(pointB, stroke)) return false;
    if (kind === 'line') return stroke.arrowStart && stroke.arrowEnd;
    if (kind === 'line-segment') {
        return !stroke.arrowStart
            && !stroke.arrowEnd
            && samePoint(stroke.start, pointA)
            && samePoint(stroke.end, pointB);
    }
    return !stroke.arrowStart
        && stroke.arrowEnd
        && samePoint(stroke.start, pointA);
};

const isCompletedAngle = (
    kind: 'right-angle' | 'acute-angle' | 'obtuse-angle',
    scene: GeometryPrimitiveScene
): boolean => {
    if (!hasExactPointLabels(scene.points, ['O', 'A', 'B']) || scene.strokes.length !== 2 || scene.markers.length !== 1) {
        return false;
    }
    const rayOA = scene.strokes.find(stroke => stroke.id === 'OA');
    const rayOB = scene.strokes.find(stroke => stroke.id === 'OB');
    const pointO = scene.points.find(point => point.id === 'O')!;
    const pointA = scene.points.find(point => point.id === 'A')!;
    const pointB = scene.points.find(point => point.id === 'B')!;
    if (!rayOA || !rayOB
        || !samePoint(rayOA.start, pointO)
        || !samePoint(rayOB.start, pointO)
        || rayOA.arrowStart
        || rayOB.arrowStart
        || !rayOA.arrowEnd
        || !rayOB.arrowEnd
        || !pointOnStroke(pointA, rayOA)
        || !pointOnStroke(pointB, rayOB)) {
        return false;
    }
    const measure = angleBetween(rayOA, rayOB);
    if (kind === 'right-angle') {
        return Math.abs(measure - 90) < EPSILON && scene.markers[0].kind === 'right-angle';
    }
    if (scene.markers[0].kind !== 'angle-arc') return false;
    return kind === 'acute-angle'
        ? measure > 0 && measure < 90
        : measure > 90 && measure < 180;
};

const isCompletedRelation = (
    kind: 'perpendicular-lines' | 'parallel-lines',
    scene: GeometryPrimitiveScene
): boolean => {
    if (scene.points.length !== 1 || scene.strokes.length !== 2 || scene.markers.length !== 1) return false;
    const [first, second] = scene.strokes;
    if (!first.arrowStart || !first.arrowEnd || !second.arrowStart || !second.arrowEnd) return false;
    const firstVector = {x: first.end.x - first.start.x, y: first.end.y - first.start.y};
    const secondVector = {x: second.end.x - second.start.x, y: second.end.y - second.start.y};
    const dot = firstVector.x * secondVector.x + firstVector.y * secondVector.y;
    const cross = firstVector.x * secondVector.y - firstVector.y * secondVector.x;
    if (kind === 'perpendicular-lines') {
        return hasExactPointLabels(scene.points, ['O'])
            && pointOnStroke(scene.points[0], first)
            && pointOnStroke(scene.points[0], second)
            && Math.abs(dot) < EPSILON
            && scene.markers[0].kind === 'right-angle';
    }
    return hasExactPointLabels(scene.points, ['P'])
        && Math.abs(cross) < EPSILON
        && (pointOnStroke(scene.points[0], first) || pointOnStroke(scene.points[0], second))
        && scene.markers[0].kind === 'parallel';
};

export const isCompletedPrimitiveScene = (
    kind: GeometryPrimitiveKind,
    scene: GeometryPrimitiveScene
): boolean => {
    if (!hasValidSceneParts(scene)) return false;
    if (kind === 'point') {
        return hasExactPointLabels(scene.points, ['P'])
            && scene.strokes.length === 0
            && scene.markers.length === 0;
    }
    if (kind === 'line' || kind === 'line-segment' || kind === 'ray') {
        return isCompletedLinePrimitive(kind, scene);
    }
    if (kind === 'right-angle' || kind === 'acute-angle' || kind === 'obtuse-angle') {
        return isCompletedAngle(kind, scene);
    }
    return isCompletedRelation(kind, scene);
};

export const isValidPrimitiveGuide = (
    kind: GeometryPrimitiveKind,
    scene: GeometryPrimitiveScene
): boolean => {
    if (!hasValidSceneParts(scene) || scene.markers.length !== 0) return false;
    if (kind === 'point') return scene.points.length === 0 && scene.strokes.length === 0;
    if (kind === 'line' || kind === 'line-segment' || kind === 'ray') {
        return hasExactPointLabels(scene.points, ['A', 'B']) && scene.strokes.length === 0;
    }
    if (kind === 'right-angle' || kind === 'acute-angle' || kind === 'obtuse-angle') {
        return hasExactPointLabels(scene.points, ['O', 'A'])
            && scene.strokes.length === 1
            && scene.strokes[0].id === 'OA'
            && !scene.strokes[0].arrowStart
            && scene.strokes[0].arrowEnd;
    }
    if (kind === 'perpendicular-lines') {
        return hasExactPointLabels(scene.points, ['O'])
            && scene.strokes.length === 1
            && scene.strokes[0].arrowStart
            && scene.strokes[0].arrowEnd
            && pointOnStroke(scene.points[0], scene.strokes[0]);
    }
    return hasExactPointLabels(scene.points, ['P'])
        && scene.strokes.length === 1
        && scene.strokes[0].arrowStart
        && scene.strokes[0].arrowEnd
        && !pointOnStroke(scene.points[0], scene.strokes[0]);
};
