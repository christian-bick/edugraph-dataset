import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {isPolyhedralNetProblem} from '../../../../generators/shape/polyhedral-net-helpers.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {PolyhedralNetBody} from '../polyhedral-net-view.tsx';
import {SolidNetConstructionViewSchema, type SolidNetConstructionViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'solid-net-construction';
export const SolidNetConstructionCore = ({payload}: {config: SolidNetConstructionViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'solidKind', 'unit', 'context', 'solid', 'net', 'surfaceArea']);
    // The complete guard handles the valid empty surfaceAdditivity branch.
    if (!isPolyhedralNetProblem(data)) throw new ViewValidationError(VIEW_ID, 'The solid, congruent faces, connected net, fold closure or exact area evidence is inconsistent.');
    return <PolyhedralNetBody data={data} task="construction" story={false} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const SolidNetConstruction = withConfig(SolidNetConstructionViewSchema, SolidNetConstructionCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<SolidNetConstruction payload={payload} />);
};
