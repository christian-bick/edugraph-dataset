import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidFractionDivisionRelation} from '../fraction-division-helpers.ts';
import {GeneralFractionDivisionBody} from '../fraction-division-view.tsx';
import {FractionsGeneralDivisionExecutionViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-general-division-execution';

export const FractionsGeneralDivisionExecutionCore = ({payload}: {
    payload: ViewRenderPayload<'fractions-general-division-execution'>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'operandProfile', 'dividend', 'divisor', 'quotient', 'reciprocal', 'reciprocalProduct', 'inverse', 'model', 'context']);
    if (!isValidFractionDivisionRelation(data)) {
        throw new ViewValidationError(VIEW_ID, 'General division, common-unit model, and contextual witnesses must agree exactly.');
    }
    return <GeneralFractionDivisionBody data={data} isSolutionView={payload.isSolutionView} task="division-execution" />;
};

export const FractionsGeneralDivisionExecution = withConfig(FractionsGeneralDivisionExecutionViewSchema, FractionsGeneralDivisionExecutionCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'fractions-general-division-execution'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsGeneralDivisionExecution payload={payload} />);
    }
};
