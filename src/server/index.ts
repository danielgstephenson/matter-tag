import express from 'express'
import path from 'path'
import http from 'http'
import https from 'https'
import config from './config.json'
import fs from 'fs'
import socketIo from 'socket.io'
import DebugCircle from '../shared/DebugCircle'
import { ClientToServerEvents, ServerToClientEvents } from '../shared/socket'
import { DEBUG } from './lib/debug'
import { runner } from './lib/engine'
import Actor from './model/Actor'
import Bot from './model/Bot'
import Character from './model/Character'
import Player from './model/Player'
import Stage from './model/Stage'

const app = express()
const staticPath = path.join(__dirname, '..', '..', 'dist')
const staticMiddleware = express.static(staticPath)
app.use(staticMiddleware)

function makeServer (): https.Server | http.Server {
  if (config.secure) {
    const key = fs.readFileSync('./sis-key.pem')
    const cert = fs.readFileSync('./sis-cert.pem')
    const credentials = { key, cert }
    return new https.Server(credentials, app)
  } else {
    return new http.Server(app)
  }
}

const server = makeServer()
const io = new socketIo.Server<ClientToServerEvents, ServerToClientEvents>(server)
const PORT = process.env.PORT ?? 3000
server.listen(PORT, () => {
  console.log(`Listening on :${PORT}`)
  setInterval(tick, 30)
})

async function updateClients (): Promise<void> {
  const sockets = await io.fetchSockets()
  sockets.forEach(socket => {
    const player = Player.players.get(socket.id)

    if (player == null) {
      throw new Error('player = null')
      /*
          const shapes: Shape[] = []
          Feature.features.forEach(feature => shapes.push(new Shape(feature.body)))
          const message = { shapes, debugLines: DebugLine.lines, debugCircles: DebugCircle.circles }
          socket.emit('updateClient', message)
          */
    } else {
      if (DEBUG.LOST) {
        Bot.lostPoints.forEach(point => {
          void new DebugCircle({ x: point.x, y: point.y, radius: 5, color: 'yellow' })
        })
      }

      player.updateClient()
    }
  })
}

function tick (): void {
  void updateClients()
}

io.on('connection', socket => {
  console.log('connection:', socket.id)
  socket.emit('socketId', socket.id)
  const player = new Player({ x: 0, y: -100, socket, observer: true })

  socket.on('updateServer', message => {
    player.controls = message.controls
    if (player.controls.up) {
      Actor.paused = false
      runner.enabled = !Actor.paused
    }
  })

  socket.on('disconnect', () => {
    console.log('disconnect:', socket.id)
    const player = Player.players.get(socket.id)
    if (Character.it === player) Bot.oldest?.makeIt({ predator: Bot.oldest })
    player?.destroy()
  })
})

void new Stage({
  centerBot: true,
  country: true,
  countryBots: true,
  cornerBots: true,
  gridBots: false,
  greek: true,
  greekBots: false,
  midpointBots: true,
  townBots: true,
  waypointBots: false,
  waypointBricks: true,
  wildBricks: true,
  size: 3000,
  town: true
})
