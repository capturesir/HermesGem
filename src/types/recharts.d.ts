/* eslint-disable @typescript-eslint/no-unused-vars */
declare module 'recharts' {
  import * as React from 'react';

  export interface Props {
    children?: React.ReactNode;
  }

  export class Component<P = {}, S = {}> extends React.Component<P & Props, S> {}

  export class XAxis extends Component<any, any> {}
  export class YAxis extends Component<any, any> {}
  export class ZAxis extends Component<any, any> {}
  export class CartesianGrid extends Component<any, any> {}
  export class Tooltip extends Component<any, any> {}
  export class Legend extends Component<any, any> {}
  export class Bar extends Component<any, any> {}
  export class Line extends Component<any, any> {}
  export class Area extends Component<any, any> {}
  export class Pie extends Component<any, any> {}
  export class Cell extends Component<any, any> {}
  export class Scatter extends Component<any, any> {}
  export class Funnel extends Component<any, any> {}
  export class Radar extends Component<any, any> {}
  export class RadialBar extends Component<any, any> {}
  export class CircularBarReferenceArea extends Component<any, any> {}
  export class ReferenceLine extends Component<any, any> {}
  export class ReferenceDot extends Component<any, any> {}
  export class ResponsiveContainer extends Component<any, any> {}
  export class Brush extends Component<any, any> {}
  export class AreaChart extends Component<any, any> {}
  export class BarChart extends Component<any, any> {}
  export class LineChart extends Component<any, any> {}
  export class PieChart extends Component<any, any> {}
  export class RadarChart extends Component<any, any> {}
  export class RadialBarChart extends Component<any, any> {}
  export class ScatterChart extends Component<any, any> {}
  export class Treemap extends Component<any, any> {}
  export class Sankey extends Component<any, any> {}
  export class FunnelChart extends Component<any, any> {}

  export interface TooltipProps<TValue, TName> {
    content?: React.ReactElement | ((props: TooltipProps<TValue, TName>) => React.ReactElement) | null;
    formatter?: ((value: TValue, name: TName, props: TooltipProps<TValue, TName>) => React.ReactElement | string) | null;
    labelFormatter?: ((label: string, props: TooltipProps<TValue, TName>) => React.ReactElement | string) | null;
  }
}
