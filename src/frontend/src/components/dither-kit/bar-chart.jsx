import { BarCanvas } from "./bar-canvas"
import { CartesianRoot } from "./cartesian-root";

export function BarChart(props) {
  return <CartesianRoot chartType="bar" Canvas={BarCanvas} {...props} />
}
