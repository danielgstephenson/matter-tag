import Matter from 'matter-js'

export default class DebugLine {
  static lines: DebugLine[] = []
  static RAYCAST = false
  static COLLISION = false
  static PLAYER_PATH = false
  static BOT_GOAL = false
  static GOAL_PATHS = false
  static DIRECTION = false
  readonly start: Matter.Vector
  readonly end: Matter.Vector
  readonly color: string

  constructor ({ start, end, color = 'black' }: {
    start: Matter.Vector
    end: Matter.Vector
    color: string
  }) {
    this.start = { x: start.x, y: start.y }
    this.end = { x: end.x, y: end.y }
    this.color = color
    DebugLine.lines.push(this)
  }
}
