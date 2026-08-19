import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {AngleConceptsView} from '../angle-concepts-view.tsx';
import {
    GeometryAngleOneDegreeDerivationViewConfig,
    GeometryAngleOneDegreeDerivationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'geometry-angle-one-degree-derivation';

interface CoreProps {
    config: GeometryAngleOneDegreeDerivationViewConfig;
    payload: ViewRenderPayload<'geometry-angle-one-degree-derivation'>;
}

const GeometryAngleOneDegreeDerivationCore = ({payload}: CoreProps) => (
    <AngleConceptsView
        mode="concept-derivation"
        payload={payload}
        viewId={VIEW_ID}
    />
);

export const GeometryAngleOneDegreeDerivation = withConfig(
    GeometryAngleOneDegreeDerivationViewSchema,
    GeometryAngleOneDegreeDerivationCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-angle-one-degree-derivation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<GeometryAngleOneDegreeDerivation payload={payload} />);
    }
};
