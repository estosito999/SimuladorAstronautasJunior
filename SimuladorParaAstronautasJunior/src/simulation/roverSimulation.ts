import type { RouteId, Vec2 } from '../types'

export const ROVER_HOME: Vec2 = [-1, 6]

export interface ExplorationRoute {
  id: RouteId
  name: string
  description: string
  destination: Vec2
  cost: number
  duration: number
}

export const ROUTES: ExplorationRoute[] = [
  { id: 'crater', name: 'Cráter cercano', description: 'Una primera observación, cerca de la base.', destination: [-9, 10], cost: 24, duration: 8 },
  { id: 'rocks', name: 'Rocas del horizonte', description: 'Un recorrido más largo para observar rocas.', destination: [8, 10], cost: 50, duration: 11 },
  { id: 'ridge', name: 'Colina lejana', description: 'Necesita casi toda la batería. Comprueba la reserva.', destination: [12, -11], cost: 94, duration: 15 },
]

export const getRoute = (id: RouteId) => ROUTES.find((route) => route.id === id) ?? ROUTES[0]
export const canCompleteRoute = (battery: number, id: RouteId) => battery >= getRoute(id).cost + 5
export const atRoverBase = (position: Vec2) => Math.hypot(position[0] - ROVER_HOME[0], position[1] - ROVER_HOME[1]) < 0.05
export const lerpPosition = (start: Vec2, end: Vec2, t: number): Vec2 => [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t]
