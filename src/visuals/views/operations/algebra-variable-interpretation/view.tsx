import {createRoot} from 'react-dom/client';
import {isAlgebraVariableMeaningProblem} from '../../../../generators/algebra/algebra-variable-meaning-helpers.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {AlgebraVariableMeaningBody} from '../algebra-variable-meaning-view.tsx';
import {AlgebraVariableInterpretationViewSchema, type AlgebraVariableInterpretationViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'algebra-variable-interpretation';
export const AlgebraVariableInterpretationCore = ({payload}: {config: AlgebraVariableInterpretationViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'domain', 'symbol', 'quantity', 'proofDomain', 'expressions', 'relation', 'role']);
    if (!isAlgebraVariableMeaningProblem(data)) throw new ViewValidationError(VIEW_ID, 'The named domain, original relation or variable-role evidence is inconsistent.');
    return <AlgebraVariableMeaningBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const AlgebraVariableInterpretation = withConfig(AlgebraVariableInterpretationViewSchema, AlgebraVariableInterpretationCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<AlgebraVariableInterpretation payload={payload} />);
};
