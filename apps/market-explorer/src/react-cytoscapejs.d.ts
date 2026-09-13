// react-cytoscapejs ships no TypeScript declarations. Minimal ambient typing
// for the subset of props this app actually uses.
declare module "react-cytoscapejs" {
  import * as React from "react";
  import type { Core, ElementDefinition, Stylesheet, LayoutOptions } from "cytoscape";

  interface CytoscapeComponentProps {
    elements: ElementDefinition[];
    style?: React.CSSProperties;
    stylesheet?: Stylesheet[];
    layout?: LayoutOptions;
    cy?: (cy: Core) => void;
    className?: string;
  }

  export default class CytoscapeComponent extends React.Component<CytoscapeComponentProps> {}
}
