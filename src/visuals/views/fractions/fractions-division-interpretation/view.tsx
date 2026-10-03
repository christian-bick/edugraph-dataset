import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidFractionQuotient} from '../fraction-quotient-helpers.ts';
import {FractionQuotientBody} from '../fraction-quotient-view.tsx';
import {FractionsDivisionInterpretationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-division-interpretation';

export const FractionsDivisionInterpretationCore = ({payload}: {
    payload: ViewRenderPayload<'fractions-division-interpretation'>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'orientation', 'dividend', 'divisor', 'quotient', 'inverse', 'model', 'story']);
    if (!isValidFractionQuotient(data)) {
        throw new ViewValidationError(VIEW_ID, 'Division, model, and inverse evidence must agree exactly.');
    }
    return <FractionQuotientBody data={data} isSolutionView={payload.isSolutionView} task="division-interpretation" />;
};

export const FractionsDivisionInterpretation = withConfig(FractionsDivisionInterpretationViewSchema, FractionsDivisionInterpretationCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'fractions-division-interpretation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsDivisionInterpretation payload={payload} />);
    }
};
