import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidShapeHierarchy} from '../shape-hierarchy-helpers.ts';
import {ShapeHierarchyBody} from '../shape-hierarchy-view.tsx';
import {ShapeInheritedAttributesViewConfig, ShapeInheritedAttributesViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-inherited-attributes';
interface CoreProps {
    config: ShapeInheritedAttributesViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

export const ShapeInheritedAttributesCore = ({payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'categoryAttributes', 'directInclusions', 'inheritance']);
    if (!isValidShapeHierarchy(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected exact category attributes, the complete inclusion diamond, and valid figure witnesses.');
    }
    return <ShapeHierarchyBody data={data} isSolutionView={payload.isSolutionView} task="inherit" />;
};

export const ShapeInheritedAttributesView = withConfig(
    ShapeInheritedAttributesViewSchema, ShapeInheritedAttributesCore
);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeInheritedAttributesView payload={payload} />);
};
