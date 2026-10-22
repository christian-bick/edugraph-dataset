import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {isCommonFactorMultiple} from '../../../helpers/common-factor-helpers.ts';
import {GreatestCommonFactorBody} from '../../../components/common-factor-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {NumbersGreatestCommonFactorViewSchema, type NumbersGreatestCommonFactorViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-greatest-common-factor';
export const NumbersGreatestCommonFactorCore = ({payload}: {config: NumbersGreatestCommonFactorViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ["kind","inputs","gcd","lcm"]);
    if (!isCommonFactorMultiple(data)) throw new ViewValidationError(VIEW_ID, 'The complete factor, cofactor, multiple or distributive witnesses are inconsistent.');
    return <GreatestCommonFactorBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const NumbersGreatestCommonFactor = withConfig(NumbersGreatestCommonFactorViewSchema, NumbersGreatestCommonFactorCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersGreatestCommonFactor payload={payload} />);
};
