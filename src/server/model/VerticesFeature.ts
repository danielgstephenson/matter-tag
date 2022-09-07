import Matter from 'matter-js'
import PolygonFeature from './PolygonFeature'

export default class VerticesFeature extends PolygonFeature {
  constructor ({ x, y, vertices, isObstacle = true, density = 0.001, color = 'gray' }: {
    x: number
    y: number
    vertices: Matter.Vector[]
    isObstacle?: boolean
    density?: number
    color?: string
  }) {
    const body = Matter.Bodies.fromVertices(x, y, [vertices])
    super({ body, isObstacle, density, color })
  }
}
