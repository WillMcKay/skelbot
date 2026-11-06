import { CartesianRoot } from "./cartesian-root"
import { LineCanvas } from "./line-canvas"

export function LineChart(props) {
  return <CartesianRoot chartType="line" Canvas={LineCanvas} {...props} />
}
