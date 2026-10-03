import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidShapeHierarchy} from '../shape-hierarchy-helpers.ts';
import {ShapeHierarchyBody} from '../shape-hierarchy-view.tsx';
import {ShapeHierarchyClassificationViewConfig, ShapeHierarchyClassificationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-hierarchy-classification';
interface CoreProps {
    config: ShapeHierarchyClassificationViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

export const ShapeHierarchyClassificationCore = ({payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'categoryAttributes', 'directInclusions', 'inheritance']);
    if (!isValidShapeHierarchy(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected exact category attributes, the complete inclusion diamond, and valid figure witnesses.');
    }
    return <ShapeHierarchyBody data={data} isSolutionView={payload.isSolutionView} task="classify" />;
};

export const ShapeHierarchyClassificationView = withConfig(
    ShapeHierarchyClassificationViewSchema, ShapeHierarchyClassificationCore
);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeHierarchyClassificationView payload={payload} />);
};
