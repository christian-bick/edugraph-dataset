# Parameter Harmonization: K-6 Consolidated Views

This document outlines the unified parameter interfaces for the consolidated views proposed in the K-6 curriculum task backlogs. Harmonizing these interfaces ensures that views remain highly reusable, extensible, and clean across all grade levels.

---

## 1. Number Line (`number-line`)
A flexible linear visualizer used for ordering, skip-counting, rounding, fractions, inequalities, and elapsed time calculations.

```typescript
interface NumberLineParams {
  min: number;
  max: number;
  step: number;            // Major tick interval
  subdivisions?: number;   // Minor ticks (e.g. 4 for quarter-units)
  format?: 'integer' | 'fraction' | 'decimal';
  denominators?: number[];  // Denominators to render (e.g. [2, 3, 4, 6, 8])
  markedPoints?: Array<{
    value: number;
    label?: string;
    interactive?: boolean; // If student needs to select/drag here
    color?: string;
  }>;
  hops?: Array<{
    start: number;
    end: number;
    label?: string;
  }>;
  ranges?: Array<{
    start: number;
    end: number;
    color?: string;
    inclusiveStart?: boolean;
    inclusiveEnd?: boolean;
  }>;
}
```

---

## 2. Coordinate Plane (`coordinate-plane`)
Used for Cartesian graphing in Quadrant 1 (Grade 5) or all Quadrants (Grade 6), plotting shape vertices, coordinate reflections, and pattern grids.

```typescript
interface CoordinatePlaneParams {
  gridRange: {
    xMin: number; xMax: number;
    yMin: number; yMax: number;
  };
  axesFormat?: 'integer' | 'decimal';
  quadrants: 1 | 4; // 1st quadrant only (Grade 5) or all 4 quadrants (Grade 6)
  points?: Array<{
    x: number; y: number;
    label?: string;
    interactive?: boolean;
    color?: string;
  }>;
  polygons?: Array<{
    vertices: Array<{ x: number; y: number }>;
    fillColor?: string;
    strokeColor?: string;
  }>;
  reflections?: Array<{
    axis: 'x' | 'y';
    originalPoint: { x: number; y: number };
    reflectedPoint: { x: number; y: number };
  }>;
}
```

---

## 3. Fractions Visualizer (`fractions-visual`)
Displays circular, rectangular, or square partition fraction grids for representation, equivalence matching, and simple area compositions.

```typescript
interface FractionsVisualParams {
  shape: 'circle' | 'rectangle' | 'square';
  denominator: number;
  numerator: number;
  mode: 'display' | 'interactive' | 'comparison';
  showLabels?: boolean;
  equivalentTo?: {
    denominator: number;
    numerator: number;
  }; // For side-by-side equivalence visual comparisons
}
```

---

## 4. Fraction Operations Model (`fractions-operations-visual`)
A advanced visualizer demonstrating fraction multiplication (grids), fraction division (bars), and unit tiling area models.

```typescript
interface FractionsOperationsVisualParams {
  operation: 'multiplication' | 'division' | 'tiling';
  fractionA: { numerator: number; denominator: number };
  fractionB: { numerator: number; denominator: number }; // Or whole number
  mode: 'area-model' | 'bar-model' | 'grid-tiling';
  interactive?: boolean;
}
```

---

## 5. Geometry Attributes Viewer (`geometry-viewer`)
Displays 2D polygons or 3D solids, net flat unfold diagrams, and relative spatial positions.

```typescript
interface GeometryViewerParams {
  dimension: '2D' | '3D';
  shapeType: string; // e.g. 'triangle', 'quadrilateral', 'prism', 'cube', 'net'
  attributes: {
    sides?: number;
    angles?: number[];
    parallelPairs?: number;
    faces?: number;
    edges?: number;
    vertices?: number;
  };
  netVertices?: Array<Array<{ x: number; y: number }>>; // Flat unfold layout
  compositionParts?: Array<{ shape: string; position: { x: number; y: number } }>;
  rotationAngle?: number;
}
```

---

## 6. Shape Hierarchy Classifier (`geometry-classifier`)
Used to classify shapes (especially quadrilaterals) by property matching, hierarchy sorting, or drag-and-drop categorization.

```typescript
interface GeometryClassifierParams {
  shapesList: Array<{
    id: string;
    shapeType: string;
    attributes: Record<string, any>;
  }>;
  categories: string[]; // e.g. ['Parallelograms', 'Trapezoids', 'Rectangles']
  mode: 'drag-and-drop' | 'property-match' | 'hierarchy-sort';
}
```

---

## 7. Categorical Data Graphs (`data-graphs`)
Renders scaled bar charts or picture graphs (pictographs) with variable symbols and frequency distributions.

```typescript
interface DataGraphsParams {
  graphType: 'bar' | 'picture';
  categories: string[];
  values: number[];
  scale: number; // e.g. 1 unit, 2 units, 5 units, 10 units per bar division / icon
  symbolType?: 'star' | 'circle' | 'square' | 'custom';
  interactive?: boolean;
}
```

---

## 8. Line Plot Visualizer (`line-plot`)
Renders frequency dot plots representing whole number, fractional, or decimal data points along a horizontal number line.

```typescript
interface LinePlotParams {
  min: number;
  max: number;
  denominator: number; // Fractions interval (e.g. 2, 4, 8)
  dataPoints: number[]; // Values to plot as Xs
  interactive?: boolean;
  label?: string;
}
```

---

## 9. Base-10 blocks (`place-value-blocks`)
Used to visually count, bundle, and decompose ones, tens, and hundreds Base-10 units.

```typescript
interface PlaceValueBlocksParams {
  value: number; // e.g. 143
  showGrouping?: boolean; // Show ones grouped into tens, tens into hundreds
  decomposedMode?: 'standard' | 'expanded-blocks';
  interactive?: boolean;
}
```

---

## 10. Operations Word Problems (`operations-word-problem`)
Displays contextual text questions with missing blanks at variables positions, integrating simple horizontal and vertical operators.

```typescript
interface OperationsWordProblemParams {
  textTemplate: string;
  values: Record<string, number | string>;
  equationFormat?: string; // e.g. "x + p = q"
  blankPosition: 'num1' | 'num2' | 'answer';
}
```
