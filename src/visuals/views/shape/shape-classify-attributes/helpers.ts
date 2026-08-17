import {
    RightTriangleCategoryProblem,
    ShapeAngleClassificationProblem,
    ShapeClassificationCoordinate,
    ShapeClassificationFigure,
    ShapeClassificationMarker,
    ShapeClassificationStroke,
    ShapeLineRelationClassificationProblem
} from '../../../../types/problems.ts';

type Grade4ClassificationProblem =
    | ShapeLineRelationClassificationProblem
    | ShapeAngleClassificationProblem
    | RightTriangleCategoryProblem;
type AngleClass = 'right' | 'acute' | 'obtuse';
type LineRelation = 'parallel' | 'perpendicular';

const COORDINATE_EPSILON = 0.001;
const ANGLE_EPSILON = 0.6;
const OPTION_IDS = ['A', 'B', 'C', 'D'] as const;
const RELATION_ORDER: readonly LineRelation[] = ['parallel', 'perpendicular'];

const isCoordinate = (point: ShapeClassificationCoordinate): boolean => typeof point === 'object'
    && point !== null
    && Number.isFinite(point.x)
    && Number.isFinite(point.y)
    && point.x >= 0
    && point.x <= 100
    && point.y >= 0
    && point.y <= 100;

const sameCoordinate = (
    left: ShapeClassificationCoordinate,
    right: ShapeClassificationCoordinate
): boolean => Math.abs(left.x - right.x) < COORDINATE_EPSILON
    && Math.abs(left.y - right.y) < COORDINATE_EPSILON;

const sameStroke = (left: ShapeClassificationStroke, right: ShapeClassificationStroke): boolean => (
    sameCoordinate(left.start, right.start) && sameCoordinate(left.end, right.end)
) || (
    sameCoordinate(left.start, right.end) && sameCoordinate(left.end, right.start)
);

const strokeVector = (stroke: ShapeClassificationStroke) => ({
    x: stroke.end.x - stroke.start.x,
    y: stroke.end.y - stroke.start.y
});

const cross = (
    first: ShapeClassificationCoordinate,
    second: ShapeClassificationCoordinate,
    third: ShapeClassificationCoordinate
): number => (second.x - first.x) * (third.y - first.y)
    - (second.y - first.y) * (third.x - first.x);

const isStroke = (stroke: ShapeClassificationStroke): boolean => typeof stroke === 'object'
    && stroke !== null
    && isCoordinate(stroke.start)
    && isCoordinate(stroke.end)
    && !sameCoordinate(stroke.start, stroke.end);

const pointOnStroke = (
    point: ShapeClassificationCoordinate,
    stroke: ShapeClassificationStroke
): boolean => Math.abs(cross(stroke.start, stroke.end, point)) < COORDINATE_EPSILON
    && point.x >= Math.min(stroke.start.x, stroke.end.x) - COORDINATE_EPSILON
    && point.x <= Math.max(stroke.start.x, stroke.end.x) + COORDINATE_EPSILON
    && point.y >= Math.min(stroke.start.y, stroke.end.y) - COORDINATE_EPSILON
    && point.y <= Math.max(stroke.start.y, stroke.end.y) + COORDINATE_EPSILON;

const strokesIntersect = (
    first: ShapeClassificationStroke,
    second: ShapeClassificationStroke
): boolean => {
    const turns = [
        cross(first.start, first.end, second.start),
        cross(first.start, first.end, second.end),
        cross(second.start, second.end, first.start),
        cross(second.start, second.end, first.end)
    ];
    const crosses = (turns[0] > COORDINATE_EPSILON && turns[1] < -COORDINATE_EPSILON
            || turns[0] < -COORDINATE_EPSILON && turns[1] > COORDINATE_EPSILON)
        && (turns[2] > COORDINATE_EPSILON && turns[3] < -COORDINATE_EPSILON
            || turns[2] < -COORDINATE_EPSILON && turns[3] > COORDINATE_EPSILON);
    return crosses
        || pointOnStroke(second.start, first)
        || pointOnStroke(second.end, first)
        || pointOnStroke(first.start, second)
        || pointOnStroke(first.end, second);
};

const isSimpleConvexFigure = (figure: ShapeClassificationFigure): boolean => {
    if (typeof figure !== 'object'
        || figure === null
        || !Array.isArray(figure.vertices)
        || !Array.isArray(figure.sides)
        || figure.vertices.length < 3
        || figure.vertices.length > 6
        || figure.sides.length !== figure.vertices.length
        || !figure.vertices.every(isCoordinate)
        || !figure.sides.every(isStroke)
        || figure.vertices.some((vertex, index) => figure.vertices.some(
            (other, otherIndex) => index !== otherIndex && sameCoordinate(vertex, other)
        ))) {
        return false;
    }

    const sideCount = figure.sides.length;
    if (!figure.sides.every((side, index) => sameStroke(side, {
        start: figure.vertices[index],
        end: figure.vertices[(index + 1) % sideCount]
    }))) {
        return false;
    }

    const vertexTurns = figure.vertices.map((vertex, index) => cross(
        vertex,
        figure.vertices[(index + 1) % sideCount],
        figure.vertices[(index + 2) % sideCount]
    ));
    if (vertexTurns.some(turn => Math.abs(turn) < COORDINATE_EPSILON)
        || !(vertexTurns.every(turn => turn > 0) || vertexTurns.every(turn => turn < 0))) {
        return false;
    }

    for (let first = 0; first < sideCount; first++) {
        for (let second = first + 1; second < sideCount; second++) {
            const adjacent = second === first + 1 || first === 0 && second === sideCount - 1;
            if (!adjacent && strokesIntersect(figure.sides[first], figure.sides[second])) return false;
        }
    }
    return true;
};

const markerShapeIsValid = (marker: ShapeClassificationMarker): boolean => {
    if (typeof marker !== 'object' || marker === null) return false;
    if (marker.kind === 'angle-arc') {
        return isCoordinate(marker.center)
            && Number.isFinite(marker.radius)
            && marker.radius > 0
            && marker.radius <= 40
            && Number.isFinite(marker.startDegrees)
            && Number.isFinite(marker.endDegrees)
            && marker.startDegrees !== marker.endDegrees;
    }
    if (marker.kind === 'right-angle') {
        return Array.isArray(marker.points)
            && marker.points.length === 3
            && marker.points.every(isCoordinate);
    }
    return marker.kind === 'parallel'
        && Array.isArray(marker.strokes)
        && marker.strokes.length === 2
        && marker.strokes.every(isStroke);
};

const relationOf = (
    first: ShapeClassificationStroke,
    second: ShapeClassificationStroke
): LineRelation | 'neither' => {
    const left = strokeVector(first);
    const right = strokeVector(second);
    const scale = Math.hypot(left.x, left.y) * Math.hypot(right.x, right.y);
    const crossProduct = left.x * right.y - left.y * right.x;
    const dotProduct = left.x * right.x + left.y * right.y;
    if (Math.abs(crossProduct) / scale < COORDINATE_EPSILON) return 'parallel';
    if (Math.abs(dotProduct) / scale < COORDINATE_EPSILON) return 'perpendicular';
    return 'neither';
};

const relationsInFigure = (figure: ShapeClassificationFigure): LineRelation[] => RELATION_ORDER.filter(
    relation => figure.sides.some((first, firstIndex) => figure.sides.some(
        (second, secondIndex) => secondIndex > firstIndex && relationOf(first, second) === relation
    ))
);

const findSharedOrigin = (
    first: ShapeClassificationStroke,
    second: ShapeClassificationStroke
): [ShapeClassificationStroke, ShapeClassificationStroke] | null => {
    const origin = [first.start, first.end].find(
        point => sameCoordinate(point, second.start) || sameCoordinate(point, second.end)
    );
    if (!origin) return null;
    const orient = (stroke: ShapeClassificationStroke): ShapeClassificationStroke => sameCoordinate(stroke.start, origin)
        ? stroke
        : {start: origin, end: stroke.start};
    return [orient(first), orient(second)];
};

const angleBetween = (first: ShapeClassificationStroke, second: ShapeClassificationStroke): number => {
    const left = strokeVector(first);
    const right = strokeVector(second);
    const cosine = (left.x * right.x + left.y * right.y)
        / (Math.hypot(left.x, left.y) * Math.hypot(right.x, right.y));
    return Math.acos(Math.min(1, Math.max(-1, cosine))) * 180 / Math.PI;
};

const angleClassOf = (first: ShapeClassificationStroke, second: ShapeClassificationStroke): AngleClass => {
    const measure = angleBetween(first, second);
    if (Math.abs(measure - 90) < ANGLE_EPSILON) return 'right';
    return measure < 90 ? 'acute' : 'obtuse';
};

const angleClassesInFigure = (figure: ShapeClassificationFigure): AngleClass[] => figure.vertices.map(
    (vertex, index) => angleClassOf(
            {start: vertex, end: figure.vertices[(index + figure.vertices.length - 1) % figure.vertices.length]},
            {start: vertex, end: figure.vertices[(index + 1) % figure.vertices.length]}
    )
);

const sameStringSet = <T extends string>(actual: readonly T[], expected: readonly T[]): boolean => actual.length === expected.length
    && new Set(actual).size === actual.length
    && actual.every(value => expected.includes(value));

const sameSequence = <T extends string>(actual: readonly T[], expected: readonly T[]): boolean => actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);

const rayDegrees = (ray: ShapeClassificationStroke): number => {
    const vector = strokeVector(ray);
    const value = Math.atan2(vector.y, vector.x) * 180 / Math.PI;
    return value < 0 ? value + 360 : value;
};

const degreeDistance = (first: number, second: number): number => {
    const normalized = Math.abs(((first - second) % 360 + 360) % 360);
    return Math.min(normalized, 360 - normalized);
};

const angleArcMatches = (
    marker: Extract<ShapeClassificationMarker, {kind: 'angle-arc'}>,
    rays: [ShapeClassificationStroke, ShapeClassificationStroke]
): boolean => sameCoordinate(marker.center, rays[0].start)
    && (degreeDistance(marker.startDegrees, rayDegrees(rays[0])) < ANGLE_EPSILON
        && degreeDistance(marker.endDegrees, rayDegrees(rays[1])) < ANGLE_EPSILON
        || degreeDistance(marker.startDegrees, rayDegrees(rays[1])) < ANGLE_EPSILON
        && degreeDistance(marker.endDegrees, rayDegrees(rays[0])) < ANGLE_EPSILON);

const rightMarkerMatches = (
    marker: Extract<ShapeClassificationMarker, {kind: 'right-angle'}>,
    rays: [ShapeClassificationStroke, ShapeClassificationStroke]
): boolean => {
    const [first, corner, second] = marker.points;
    const origin = rays[0].start;
    const endsLieOnRays = pointOnStroke(first, rays[0]) && pointOnStroke(second, rays[1])
        || pointOnStroke(first, rays[1]) && pointOnStroke(second, rays[0]);
    return endsLieOnRays
        && !sameCoordinate(first, origin)
        && !sameCoordinate(second, origin)
        && sameCoordinate(corner, {
            x: first.x + second.x - origin.x,
            y: first.y + second.y - origin.y
        });
};

const parallelMarkerMatches = (
    marker: Extract<ShapeClassificationMarker, {kind: 'parallel'}>,
    sides: [ShapeClassificationStroke, ShapeClassificationStroke]
): boolean => relationOf(marker.strokes[0], marker.strokes[1]) === 'parallel'
    && (strokesIntersect(marker.strokes[0], sides[0]) && strokesIntersect(marker.strokes[1], sides[1])
        || strokesIntersect(marker.strokes[0], sides[1]) && strokesIntersect(marker.strokes[1], sides[0]));

const evidenceStrokesAreFigureSides = (
    evidence: readonly ShapeClassificationStroke[],
    figure: ShapeClassificationFigure
): boolean => evidence.length === 2
    && evidence.every(isStroke)
    && !sameStroke(evidence[0], evidence[1])
    && evidence.every(stroke => figure.sides.some(side => sameStroke(side, stroke)));

const markerMatchesEvidence = (
    marker: ShapeClassificationMarker | null,
    evidence: [ShapeClassificationStroke, ShapeClassificationStroke]
): boolean => {
    const relation = relationOf(evidence[0], evidence[1]);
    if (relation === 'parallel') {
        return marker !== null
            && markerShapeIsValid(marker)
            && marker.kind === 'parallel'
            && parallelMarkerMatches(marker, evidence);
    }
    if (relation === 'perpendicular') {
        const rays = findSharedOrigin(evidence[0], evidence[1]);
        return rays !== null
            && marker !== null
            && markerShapeIsValid(marker)
            && marker.kind === 'right-angle'
            && rightMarkerMatches(marker, rays);
    }
    return marker === null;
};

const angleMarkerMatchesEvidence = (
    marker: ShapeClassificationMarker,
    evidence: [ShapeClassificationStroke, ShapeClassificationStroke],
    angleClass: AngleClass
): boolean => markerShapeIsValid(marker)
    && (angleClass === 'right'
        ? marker.kind === 'right-angle' && rightMarkerMatches(marker, evidence)
        : marker.kind === 'angle-arc' && angleArcMatches(marker, evidence));

const answerPartitionIsValid = (data: Grade4ClassificationProblem): boolean => {
    if (!Array.isArray(data.options)
        || data.options.length !== 4
        || !Array.isArray(data.answerIds)
        || data.answerIds.length !== 2
        || data.options.some(option => typeof option !== 'object' || option === null)) {
        return false;
    }
    const ids = data.options.map(option => option.id);
    const satisfyingIds = data.options.filter(option => option.satisfies).map(option => option.id).sort();
    return ids.every((id, index) => id === OPTION_IDS[index])
        && new Set(ids).size === 4
        && satisfyingIds.length === 2
        && new Set(data.answerIds).size === 2
        && [...data.answerIds].sort().every((id, index) => id === satisfyingIds[index]);
};

const commonTextIsValid = (data: Grade4ClassificationProblem): boolean => data.prompt.trim().length > 0
    && data.positiveLabel.trim().length > 0
    && data.negativeLabel.trim().length > 0
    && data.answerStatement === `Figures ${data.answerIds.join(' and ')} ${
        data.task === 'classify-right-triangle-category'
            ? 'are right triangles.'
            : data.task === 'classify-line-relation'
                ? `have ${data.criterion === 'parallel' ? 'parallel sides' : 'perpendicular sides'}.`
                : `each have ${data.criterion === 'right' ? 'a' : 'an'} ${data.criterion} angle.`
    }`
    && data.explanation.trim().length > 0;

const isValidLineRelationProblem = (data: ShapeLineRelationClassificationProblem): boolean => {
    const phrase = data.criterion === 'parallel' ? 'parallel sides' : 'perpendicular sides';
    return answerPartitionIsValid(data)
        && commonTextIsValid(data)
        && data.prompt === `Classify each figure by whether it has ${phrase}.`
        && data.positiveLabel === `has ${phrase}`
        && data.negativeLabel === `does not have ${phrase}`
        && data.explanation === (data.criterion === 'parallel'
            ? 'Their marked sides stay the same distance apart and never intersect.'
            : 'Their marked sides intersect to form a right angle.')
        && data.options.every(option => {
            if (option.figureName.trim().length === 0
                || !isSimpleConvexFigure(option.figure)
                || !Array.isArray(option.relations)
                || !Array.isArray(option.evidenceStrokes)
                || !evidenceStrokesAreFigureSides(option.evidenceStrokes, option.figure)) return false;
            const actualRelations = relationsInFigure(option.figure);
            const nominatedRelation = relationOf(option.evidenceStrokes[0], option.evidenceStrokes[1]);
            return sameStringSet(option.relations, actualRelations)
                && markerMatchesEvidence(option.marker, option.evidenceStrokes)
                && option.satisfies === actualRelations.includes(data.criterion)
                && (!option.satisfies || nominatedRelation === data.criterion);
        });
};

const angleOptionIsValid = (
    option: ShapeAngleClassificationProblem['options'][number] | RightTriangleCategoryProblem['options'][number],
    criterion: AngleClass
): boolean => {
    if (option.figureName.trim().length === 0
        || !isSimpleConvexFigure(option.figure)
        || !Array.isArray(option.angleClasses)
        || !Array.isArray(option.evidenceRays)
        || !evidenceStrokesAreFigureSides(option.evidenceRays, option.figure)
        || !sameCoordinate(option.evidenceRays[0].start, option.evidenceRays[1].start)) return false;
    const actualClasses = angleClassesInFigure(option.figure);
    const nominatedClass = angleClassOf(option.evidenceRays[0], option.evidenceRays[1]);
    return sameSequence(option.angleClasses, actualClasses)
        && option.angleClass === nominatedClass
        && angleMarkerMatchesEvidence(option.marker, option.evidenceRays, nominatedClass)
        && option.satisfies === actualClasses.includes(criterion)
        && (!option.satisfies || nominatedClass === criterion);
};

const isValidAngleClassificationProblem = (data: ShapeAngleClassificationProblem): boolean => {
    const article = data.criterion === 'right' ? 'a' : 'an';
    return answerPartitionIsValid(data)
        && commonTextIsValid(data)
        && data.prompt === `Classify each figure by whether it has ${article} ${data.criterion} angle.`
        && data.positiveLabel === `has ${article} ${data.criterion} angle`
        && data.negativeLabel === `does not have ${article} ${data.criterion} angle`
        && data.explanation === (data.criterion === 'right'
            ? 'Each highlighted angle forms a square corner.'
            : data.criterion === 'acute'
                ? 'Each highlighted angle is smaller than a right angle.'
                : 'Each highlighted angle is larger than a right angle and smaller than a straight angle.')
        && data.options.every(option => angleOptionIsValid(option, data.criterion));
};

const isValidRightTriangleProblem = (
    data: RightTriangleCategoryProblem,
    visualRecognition: boolean | undefined
): boolean => answerPartitionIsValid(data)
    && commonTextIsValid(data)
    && visualRecognition === true
    && data.prompt === 'Which figures are right triangles?'
    && data.positiveLabel === 'right triangle'
    && data.negativeLabel === 'not a right triangle'
    && Array.isArray(data.attributes)
    && data.attributes.length === 2
    && data.attributes[0] === '3 straight sides'
    && data.attributes[1] === '1 right angle'
    && data.category === 'triangle'
    && data.categoryStatement === 'Every right triangle is a triangle.'
    && data.explanation === 'Each has three straight sides and one right angle. Every right triangle is a triangle.'
    && data.options.every(option => option.figure.vertices.length === 3 && angleOptionIsValid(option, 'right'));

export const isValidGrade4ShapeClassificationProblem = (
    data: Grade4ClassificationProblem,
    visualRecognition: boolean | undefined
): boolean => {
    if (data.task === 'classify-line-relation') return isValidLineRelationProblem(data);
    if (data.task === 'classify-angle-size') return isValidAngleClassificationProblem(data);
    return isValidRightTriangleProblem(data, visualRecognition);
};
