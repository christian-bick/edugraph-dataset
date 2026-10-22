import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {isRationalOppositeRelation} from '../signed-meaning-helpers.ts';
import {RationalOppositeBody} from '../rational-opposite-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {NumbersZeroOppositeViewSchema, type NumbersZeroOppositeViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-zero-opposite';
export const NumbersZeroOppositeCore = ({payload}: {config: NumbersZeroOppositeViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'axis', 'original', 'opposite', 'doubleOpposite', 'zeroFixedPoint', 'oppositePair', 'unequalSignedPair']);
    if (!isRationalOppositeRelation(data)) throw new ViewValidationError(VIEW_ID, 'The exact signed values, semantic metadata or relation witnesses are inconsistent.');
    return <RationalOppositeBody data={data} task="zero-opposite" isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const NumbersZeroOpposite = withConfig(NumbersZeroOppositeViewSchema, NumbersZeroOppositeCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersZeroOpposite payload={payload} />);
};
