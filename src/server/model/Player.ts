import Character from './Character'
import { Socket } from 'socket.io'
import Shape from '../../shared/Shape'
import DebugLine from '../../shared/DebugLine'
import DebugCircle from '../../shared/DebugCircle'
import DebugLabel from '../../shared/DebugLabel'
import VISION from '../../shared/VISION'
import { getDistance } from '../lib/engine'
import Wall from './Wall'
import Waypoint from './Waypoint'
import isClear, { raycast } from '../lib/raycast'

export default class Player extends Character {
  static players = new Map<string, Player>()
  readonly socket: Socket

  constructor ({ x = 0, y = 0, socket, radius = 15, color = 'green' }: {
    x: number
    y: number
    socket: Socket
    angle?: number
    color?: string
    radius?: number
  }) {
    super({ x, y, color })

    this.socket = socket
    Player.players.set(this.socket.id, this)
  }

  updateClient (): void {
    const visibleFeatures = this.getVisibleFeatures()
    const shapes = visibleFeatures.map(feature => new Shape(feature.body))
    const message = {
      shapes,
      debugLines: DebugLine.lines,
      debugCircles: DebugCircle.circles,
      debugLabels: DebugLabel.labels,
      torsoId: this.feature.body.id
    }
    this.socket.emit('updateClient', message)
  }

  isPointWallClear (point: Matter.Vector): boolean {
    return isClear({
      start: this.feature.body.position,
      end: point,
      obstacles: Wall.wallObstacles
    })
  }

  isPointWallVisible (point: Matter.Vector): boolean {
    const start = this.feature.body.position
    const visibleX = start.x - VISION.width < point.x && point.x < start.x + VISION.width
    if (!visibleX) return false
    const visibleY = start.y - VISION.height < point.y && point.y < start.y + VISION.height
    if (!visibleY) return false
    const clearSearchPos = this.isPointWallClear(point)
    return clearSearchPos
  }

  getGoalWaypoint (goal: Matter.Vector): Waypoint {
    const start = this.feature.body.position
    const visibleFromStart = Waypoint.waypoints.filter(waypoint => {
      return this.isPointWallVisible(waypoint.position)
    })
    const distances = visibleFromStart.map(visibleWaypoint => {
      const startToWaypoint = getDistance(visibleWaypoint.position, start)
      const waypointToGoal = visibleWaypoint.getDistance(goal)
      return startToWaypoint + waypointToGoal
    })
    return visibleFromStart[distances.indexOf(Math.min(...distances))]
  }

  getGoalTarget (goal: Matter.Vector): Matter.Vector {
    const start = this.feature.body.position
    const goalWaypoint = this.getGoalWaypoint(goal)
    const path = goalWaypoint.getVectorPath(goal)
    // Should this path be allowed to go through walls?
    /*
    path.slice(0, path.length - 1).forEach((point, index) => {
      const next = path[index + 1]
      return new DebugLine({ start: point, end: next, color: 'purple' })
    })
    */
    const target = path.reduce((a, b) => {
      const hit = raycast({ start, end: b, obstacles: Wall.wallObstacles })
      return hit === false ? b : a
    })
    return target
  }

  debugPath (): void {
    const goal = Waypoint.waypoints[59].position
    const target = this.getGoalTarget(goal)
    void new DebugLine({ start: this.feature.body.position, end: target, color: 'teal' })
    void new DebugLine({ start: this.feature.body.position, end: goal, color: 'yellow' })
  }
}
