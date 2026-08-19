import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ShapeLineSymmetryView} from '../shape-line-symmetry-view.tsx';
import {
    ShapeLineSymmetryIdentificationViewConfig,
    ShapeLineSymmetryIdentificationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-line-symmetry-identification';

interface CoreProps {
    config: ShapeLineSymmetryIdentificationViewConfig;
    payload: ViewRenderPayload<'shape-line-symmetry-identification'>;
}

const ShapeLineSymmetryIdentificationCore = ({payload}: CoreProps) => (
    <ShapeLineSymmetryView
        mode="identify"
        payload={payload}
        viewId={VIEW_ID}
    />
);

export const ShapeLineSymmetryIdentification = withConfig(
    ShapeLineSymmetryIdentificationViewSchema,
    ShapeLineSymmetryIdentificationCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-line-symmetry-identification'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapeLineSymmetryIdentification payload={payload} />);
    }
};
