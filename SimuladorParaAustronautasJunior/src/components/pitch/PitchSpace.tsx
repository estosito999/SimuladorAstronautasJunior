import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import * as THREE from 'three'

export interface PitchSpaceProps {
  slide: number
  transitionId: number
  direction: 1 | -1
  reducedMotion: boolean
  playing: boolean
  interactive?: boolean
}

class SpaceBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function webGLAvailable() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false })
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch { return false }
}

function ContextGuard({ onLost }: { onLost: () => void }) {
  const { gl } = useThree()
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onLost() }
    gl.domElement.addEventListener('webglcontextlost', lost)
    return () => gl.domElement.removeEventListener('webglcontextlost', lost)
  }, [gl, onLost])
  return null
}

function seeded(seed: number) {
  let value = seed
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296 }
}

function StarField({ reducedMotion, playing }: Pick<PitchSpaceProps, 'reducedMotion' | 'playing'>) {
  const points = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const random = seeded(1711)
    const array = new Float32Array(1100 * 3)
    for (let i = 0; i < array.length; i += 3) {
      array[i] = (random() - 0.5) * 70
      array[i + 1] = (random() - 0.5) * 45
      array[i + 2] = -8 - random() * 28
    }
    return array
  }, [])
  useFrame((_, dt) => {
    if (points.current && !reducedMotion) points.current.rotation.z += Math.min(dt, 0.05) * (playing ? 0.003 : 0.001)
  })
  return <points ref={points}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial color="#b6d8f3" size={0.045} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
  </points>
}

function MoonGlobe() {
  const geometry = useMemo(() => {
    const result = new THREE.SphereGeometry(1, 64, 48)
    const random = seeded(1969)
    const craters = Array.from({ length: 25 }, () => ({
      axis: new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize(),
      radius: 0.065 + random() * 0.17,
      depth: 0.007 + random() * 0.025,
    }))
    const p = result.attributes.position
    const colors = new Float32Array(p.count * 3)
    const direction = new THREE.Vector3()
    const color = new THREE.Color()
    for (let i = 0; i < p.count; i++) {
      direction.fromBufferAttribute(p, i).normalize()
      let relief = 1 + Math.sin(direction.x * 49 + direction.z * 31) * Math.sin(direction.y * 37) * 0.0024
      for (const crater of craters) {
        const distance = Math.acos(THREE.MathUtils.clamp(direction.dot(crater.axis), -1, 1)) / crater.radius
        if (distance < 1.7) relief += -crater.depth * Math.exp(-distance * distance * 2.5)
          + crater.depth * 0.7 * Math.exp(-((distance - 1) ** 2) * 27)
      }
      p.setXYZ(i, direction.x * relief, direction.y * relief, direction.z * relief)
      const sea = Math.sin(direction.x * 6 + direction.y * 3) + Math.cos(direction.z * 7 - direction.y * 4) * 0.5
      color.set('#c5cbd2').multiplyScalar(0.8 + sea * 0.07 + (relief - 1) * 2)
      colors.set([color.r, color.g, color.b], i * 3)
    }
    result.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    result.computeVertexNormals()
    return result
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} rotation={[0.2, -0.4, 0.1]}>
    <meshStandardMaterial vertexColors roughness={0.95} metalness={0.05} />
  </mesh>
}

function EarthGlobe() {
  const geometry = useMemo(() => {
    const result = new THREE.SphereGeometry(1, 56, 40)
    const p = result.attributes.position
    const colors = new Float32Array(p.count * 3)
    const color = new THREE.Color()
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      const land = Math.sin(x * 6 + z * 2) + Math.cos(z * 5 - y * 4) * 0.6 + Math.sin(y * 8 + x * 3) * 0.3
      color.set(Math.abs(y) > 0.9 ? '#e2f3f4' : land > 0.55 ? '#4a9f8d' : '#124f8e')
      if (Math.sin(x * 21 + y * 11 + z * 9) > 0.82) color.lerp(new THREE.Color('#d6e8ed'), 0.65)
      colors.set([color.r, color.g, color.b], i * 3)
    }
    result.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return result
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <group rotation={[0.1, 0.7, -0.18]}>
    <mesh geometry={geometry}><meshStandardMaterial vertexColors roughness={0.9} emissive="#123e65" emissiveIntensity={0.15} /></mesh>
    <mesh scale={1.04}>
      <sphereGeometry args={[1, 40, 32]} />
      <shaderMaterial transparent side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending}
        uniforms={{ tint: { value: new THREE.Color('#49c7ee') } }}
        vertexShader={`varying vec3 n; varying vec3 eye; void main(){ vec4 v=modelViewMatrix*vec4(position,1.0); n=normalize(normalMatrix*normal); eye=normalize(-v.xyz); gl_Position=projectionMatrix*v; }`}
        fragmentShader={`uniform vec3 tint; varying vec3 n; varying vec3 eye; void main(){float rim=pow(1.0-abs(dot(normalize(n),normalize(eye))),2.3); gl_FragColor=vec4(tint,rim*.42);}`}
      />
    </mesh>
  </group>
}

function HolographicOrbits({ slide }: { slide: number }) {
  return <group rotation={[0.35, 0, -0.2]}>
    {[0, 1, 2].map(index => <mesh key={index} rotation={[Math.PI / 2 + index * 0.28, index * 0.8, 0]}>
      <torusGeometry args={[1.48 + index * 0.15, 0.007, 5, 100]} />
      <meshBasicMaterial color={index === 2 ? '#e9b56b' : '#71d5ed'} transparent opacity={slide === 3 ? 0.65 : 0.22} depthWrite={false} />
    </mesh>)}
    {slide === 3 && Array.from({ length: 5 }, (_, index) => {
      const a = index / 5 * Math.PI * 2
      return <mesh key={index} position={[Math.cos(a) * 1.67, Math.sin(a) * 1.15, 0.65]}>
        <octahedronGeometry args={[0.07]} /><meshBasicMaterial color={index % 2 ? '#e9b56b' : '#82e2f2'} />
      </mesh>
    })}
  </group>
}

function LearningStation() {
  return <group rotation={[0.18, -0.3, 0]}>
    <mesh position={[0, -0.9, 0]} scale={[2.2, 0.5, 1.7]}><sphereGeometry args={[1, 48, 24]} /><meshStandardMaterial color="#6f7e92" roughness={1} /></mesh>
    <group position={[0.2, -0.3, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.35, 0.85, 6, 18]} /><meshStandardMaterial color="#d8e4ea" metalness={0.25} roughness={0.5} /></mesh>
      <mesh position={[0, 0.1, 0.35]}><boxGeometry args={[0.18, 0.23, 0.04]} /><meshBasicMaterial color="#69d8ef" /></mesh>
      <mesh position={[0, 0.39, 0]}><sphereGeometry args={[0.2, 16, 12]} /><meshStandardMaterial color="#7cc7d7" metalness={0.4} roughness={0.2} /></mesh>
    </group>
    {[-0.7, 0, 0.7].map(z => <group key={z} position={[-1.15, -0.4, z]}>
      <mesh position={[0, -0.15, 0]}><cylinderGeometry args={[0.035, 0.045, 0.4, 6]} /><meshStandardMaterial color="#a8c2ce" /></mesh>
      <mesh rotation={[-0.38, 0, 0]}><boxGeometry args={[0.8, 0.04, 0.45]} /><meshStandardMaterial color="#1b698d" emissive="#1a759f" emissiveIntensity={0.2} metalness={0.5} roughness={0.3} /></mesh>
    </group>)}
    <group position={[1.3, -0.37, 0.3]}>
      <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.035, 0.07, 0.65, 8]} /><meshStandardMaterial color="#d8e4ea" /></mesh>
      <mesh position={[0, 0.38, 0]} rotation={[0.7, 0, 0]}><coneGeometry args={[0.3, 0.16, 20, 1, true]} /><meshStandardMaterial color="#b9d0dd" side={THREE.DoubleSide} /></mesh>
    </group>
    <group position={[0.15, -0.5, 0.95]}>
      <mesh><boxGeometry args={[0.46, 0.16, 0.32]} /><meshStandardMaterial color="#d5e2e8" /></mesh>
      {[-0.16, 0.16].map(x => [-0.2, 0.2].map(z => <mesh key={`${x}-${z}`} position={[x, -0.08, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 0.08, 10]} /><meshStandardMaterial color="#23374a" /></mesh>))}
    </group>
  </group>
}

function Cruiser() {
  const geometry = useMemo(() => {
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.Float32BufferAttribute([
      2.05, 0, 0, -1.5, 0, -1.05, -1.5, 0, 1.05,
      2.05, 0.12, 0, -1.5, 0.35, -1.05, -1.5, 0.35, 1.05,
    ], 3))
    result.setIndex([0, 2, 1, 3, 4, 5, 0, 1, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4])
    result.computeVertexNormals()
    return result
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <group rotation={[0.13, 0, -0.13]}>
    <mesh geometry={geometry}><meshStandardMaterial color="#c5d4e2" metalness={0.65} roughness={0.38} /></mesh>
    <mesh position={[-0.65, 0.46, 0]}><boxGeometry args={[0.55, 0.27, 0.4]} /><meshStandardMaterial color="#8da7bc" metalness={0.7} roughness={0.4} /></mesh>
    <mesh position={[-0.72, 0.66, 0]}><boxGeometry args={[0.24, 0.12, 0.7]} /><meshStandardMaterial color="#b4cbd7" metalness={0.65} roughness={0.4} /></mesh>
    {[-0.65, 0, 0.65].map(z => <mesh key={z} position={[-1.55, 0.16, z]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.1, 0.15, 0.06, 12]} /><meshBasicMaterial color="#9bf0ff" />
    </mesh>)}
    <mesh position={[-2.02, 0.16, 0]} scale={[0.7, 0.09, 0.35]}><sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial color="#46c8f3" transparent opacity={0.28} depthWrite={false} /></mesh>
  </group>
}

function Interceptor() {
  return <group>
    <mesh rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.2, 1.8, 6]} /><meshStandardMaterial color="#dce4e9" metalness={0.7} roughness={0.4} /></mesh>
    <mesh position={[0.05, 0.18, 0]} scale={[0.3, 0.14, 0.14]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#2b7188" metalness={0.8} roughness={0.15} /></mesh>
    <mesh position={[-1.05, 0, 0]} scale={[0.65, 0.045, 0.1]}><sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial color="#67d9f6" transparent opacity={0.32} depthWrite={false} /></mesh>
    {[-1, 1].map(y => [-1, 1].map(z => <group key={`${y}-${z}`} position={[-0.28, y * 0.22, z * 0.38]} rotation={[y * z * 0.42, 0, 0]}>
      <mesh><boxGeometry args={[0.76, 0.045, 0.87]} /><meshStandardMaterial color="#c4d1d9" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0.19, 0, z * 0.41]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.025, 0.025, 1.2, 6]} /><meshStandardMaterial color="#7e9eae" /></mesh>
      <mesh position={[-0.43, 0, z * 0.3]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.075, 0.1, 0.18, 10]} /><meshBasicMaterial color="#86e7f7" /></mesh>
    </group>))}
  </group>
}

function Flyby({ transitionId, direction, reducedMotion }: Pick<PitchSpaceProps, 'transitionId' | 'direction' | 'reducedMotion'>) {
  const fleet = useRef<THREE.Group>(null)
  const { viewport, camera } = useThree()
  const flightPlane = useMemo(() => new THREE.Vector3(0, 0, 2.5), [])
  const viewWidth = useRef(viewport.width)
  // The foreground has a narrower frustum than the planets at the origin.
  // Measure that plane so the ships spend their flight inside the visible area.
  viewWidth.current = viewport.getCurrentViewport(camera, flightPlane).width
  useEffect(() => {
    const group = fleet.current
    if (!group || reducedMotion) return
    const width = viewWidth.current
    group.visible = true
    group.position.set(-direction * (width / 2 + 2), 0.9, 2.5)
    group.rotation.set(0, direction === 1 ? 0 : Math.PI, -direction * 0.07)
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ onComplete: () => { group.visible = false } })
      timeline.to(group.position, { x: direction * (width / 2 + 6), y: -0.7, duration: 2.45, ease: 'none' }, 0)
      timeline.to(group.rotation, { z: direction * 0.07, duration: 2.45, ease: 'sine.inOut' }, 0)
    })
    return () => { context.revert(); group.visible = false }
  }, [transitionId, direction, reducedMotion])
  return <group ref={fleet} visible={false}>
    <group scale={0.6}><Cruiser /></group>
    <group position={[-2.6, 0.65, 0.25]} scale={0.52}><Interceptor /></group>
    <group position={[-3.7, -0.8, -0.2]} scale={0.4}><Interceptor /></group>
  </group>
}

function CosmicScene(props: PitchSpaceProps) {
  const root = useRef<THREE.Group>(null)
  const globe = useRef<THREE.Group>(null)
  const earth = useRef<THREE.Group>(null)
  const orbits = useRef<THREE.Group>(null)
  const { viewport } = useThree()
  const positionX = viewport.width * 0.27
  const size = Math.min(2.45, Math.max(1.45, viewport.width * 0.14))
  useFrame(({ pointer }, dt) => {
    const seconds = Math.min(dt, 0.05)
    if (root.current) {
      const amount = props.interactive === false || props.reducedMotion ? 0 : 0.1
      root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, pointer.x * amount, 3, seconds)
      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, -pointer.y * amount * 0.6, 3, seconds)
    }
    if (!props.reducedMotion) {
      if (globe.current) globe.current.rotation.y += seconds * (props.playing ? 0.035 : 0.012)
      if (earth.current) earth.current.rotation.y += seconds * 0.025
      if (orbits.current) orbits.current.rotation.z += seconds * 0.035
    }
  })
  const globeScale = props.slide === 1 ? 0.65 : props.slide === 3 ? 0.72 : props.slide === 4 ? 0.84 : 1
  return <>
    <ambientLight intensity={0.32} color="#8db2d3" />
    <directionalLight position={[-5, 4, 7]} intensity={2.8} color="#fff1d5" />
    <directionalLight position={[8, -1, -2]} intensity={1.25} color="#58c5ed" />
    <StarField reducedMotion={props.reducedMotion} playing={props.playing} />
    <group ref={root} position={[positionX, 0, -1]} scale={size}>
      <group ref={globe} visible={props.slide !== 5} scale={globeScale} position={props.slide === 1 ? [0.45, -0.1, 0] : [0, 0, 0]}><MoonGlobe /></group>
      <group ref={earth} visible={props.slide === 0 || props.slide === 1 || props.slide === 4} scale={props.slide === 1 ? 0.68 : 0.3} position={props.slide === 1 ? [-0.65, 0.7, 0.1] : [-1.1, 1.2, -0.5]}><EarthGlobe /></group>
      <group ref={orbits} visible={props.slide !== 2 && props.slide !== 6}><HolographicOrbits slide={props.slide} /></group>
      <group visible={props.slide === 5} scale={0.83} rotation={[0.3, 0, 0]}><LearningStation /></group>
      {props.slide === 6 && <group position={[0.3, 0.18, 1.5]} rotation={[0, -0.4, 0.15]} scale={0.27}><Interceptor /></group>}
    </group>
    <Flyby transitionId={props.transitionId} direction={props.direction} reducedMotion={props.reducedMotion} />
  </>
}

function FallbackSpace({ transitionId, direction, reducedMotion }: Pick<PitchSpaceProps, 'transitionId' | 'direction' | 'reducedMotion'>) {
  return <div className="pitch-space-fallback" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    <style>{`@keyframes pitch-fallback-flyby{from{transform:translateX(calc(-55vw - 220px)) rotate(-7deg)}to{transform:translateX(calc(55vw + 220px)) rotate(7deg)}} @keyframes pitch-fallback-reverse{from{transform:translateX(calc(55vw + 220px)) rotateY(180deg)}to{transform:translateX(calc(-55vw - 220px)) rotateY(180deg)}}`}</style>
    <div style={{ position: 'absolute', right: '8%', top: '18%', width: 'min(34vw, 470px)', aspectRatio: 1, borderRadius: '50%', background: 'radial-gradient(circle at 30% 28%, #cad3da, #7b8c9e 38%, #2a4054 66%, #0a1827 84%)', boxShadow: 'inset -35px -25px 55px #030912, 0 0 80px #49b9e51c' }} />
    {!reducedMotion && <div key={transitionId} style={{ position: 'absolute', left: '50%', top: '40%', width: 220, height: 88, clipPath: 'polygon(100% 50%,0 0,16% 50%,0 100%)', background: 'linear-gradient(180deg,#e3edf3,#7e9aae)', filter: 'drop-shadow(-25px 0 12px #65d9ff)', animation: `${direction === 1 ? 'pitch-fallback-flyby' : 'pitch-fallback-reverse'} 2.45s linear both` }} />}
  </div>
}

/** Original geometric spacecraft and planets, rendered locally without assets. */
export default function PitchSpace(props: PitchSpaceProps) {
  const [supported] = useState(webGLAvailable)
  const [contextLost, setContextLost] = useState(false)
  const handleContextLost = useCallback(() => setContextLost(true), [])
  const fallback = <FallbackSpace transitionId={props.transitionId} direction={props.direction} reducedMotion={props.reducedMotion} />
  return <div className="pitch-space" aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: props.interactive === false ? 'none' : 'auto' }}>
    {supported && !contextLost ? <SpaceBoundary fallback={fallback}>
      <Canvas dpr={[1, 1.5]} frameloop={props.reducedMotion ? 'demand' : 'always'} camera={{ position: [0, 0, 12], fov: 45, near: 0.1, far: 120 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => { gl.setClearColor('#02060e', 0); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1 }} fallback={fallback}>
        <ContextGuard onLost={handleContextLost} />
        <CosmicScene {...props} />
      </Canvas>
    </SpaceBoundary> : fallback}
  </div>
}
