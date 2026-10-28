import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import truckAsset from "@/assets/truck.glb.asset.json";
import { LANES, LYRICS, ENDING, newGame, step, steer, type GameState, type Entity } from "./rules";

type Hud = { score: number; beers: number; deers: number; speed: number; over: boolean; flash: string };

function Truck() {
  const { scene } = useGLTF(truckAsset.url);
  const obj = useMemo(() => {
    const c = scene.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const g = new THREE.Group();
    if (size.x > size.z) c.rotation.y = Math.PI / 2;
    g.add(c);
    const b2 = new THREE.Box3().setFromObject(g);
    const s2 = b2.getSize(new THREE.Vector3());
    const k = 6.5 / Math.max(s2.x, s2.z);
    g.scale.setScalar(k);
    const ctr = b2.getCenter(new THREE.Vector3());
    c.position.set(-ctr.x, -b2.min.y, -ctr.z);
    c.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    return g;
  }, [scene]);
  return <primitive object={obj} />;
}

// Stand-in Asgore (rei bode) riding on top of the cab
function Asgore() {
  const fur = "#f4efe6", gold = "#f2c230", cape = "#6b3fa0", horn = "#e9dfc8";
  return (
    <group position={[0, 3.4, -2.1]}>
      <mesh position={[0, 0.6, 0]} castShadow><boxGeometry args={[1.6, 1.3, 1]} /><meshStandardMaterial color={cape} /></mesh>
      <mesh position={[0, 1.6, 0]} castShadow><sphereGeometry args={[0.6, 20, 16]} /><meshStandardMaterial color={fur} /></mesh>
      <mesh position={[0, 1.5, -0.45]}><boxGeometry args={[0.5, 0.35, 0.4]} /><meshStandardMaterial color={fur} /></mesh>
      <mesh position={[0, 1.25, -0.35]}><coneGeometry args={[0.4, 0.7, 12]} /><meshStandardMaterial color={gold} /></mesh>
      <mesh position={[0, 2.05, 0.15]}><sphereGeometry args={[0.55, 16, 12]} /><meshStandardMaterial color={gold} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.55, 2.25, 0]} rotation={[0, 0, -s * 0.9]}><coneGeometry args={[0.16, 0.9, 10]} /><meshStandardMaterial color={horn} /></mesh>
          <mesh position={[s * 0.22, 1.7, -0.55]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color="#222" /></mesh>
          <mesh position={[s * 0.9, 0.9, -0.3]} rotation={[0.9, 0, 0]}><capsuleGeometry args={[0.18, 0.7]} /><meshStandardMaterial color={cape} /></mesh>
        </group>
      ))}
      {/* Skol na mão */}
      <mesh position={[0.95, 1.1, -0.85]}><cylinderGeometry args={[0.12, 0.12, 0.35, 12]} /><meshStandardMaterial color="#f5c400" metalness={0.6} roughness={0.3} /></mesh>
    </group>
  );
}

function Tree() {
  return (<group>
    <mesh position={[0, 1, 0]} castShadow><cylinderGeometry args={[0.3, 0.4, 2]} /><meshStandardMaterial color="#6b4423" /></mesh>
    <mesh position={[0, 3, 0]} castShadow><coneGeometry args={[1.5, 3, 8]} /><meshStandardMaterial color="#2f7a3a" /></mesh>
  </group>);
}
function Police({ t }: { t: number }) {
  const on = Math.floor(t * 6) % 2 === 0;
  return (<group rotation={[0, Math.PI, 0]}>
    <mesh position={[0, 0.7, 0]} castShadow><boxGeometry args={[2, 1, 4]} /><meshStandardMaterial color="#f2f2f2" /></mesh>
    <mesh position={[0, 0.7, 0]}><boxGeometry args={[2.02, 0.4, 2]} /><meshStandardMaterial color="#1a2a6c" /></mesh>
    <mesh position={[0, 1.45, 0.2]}><boxGeometry args={[1.7, 0.6, 2]} /><meshStandardMaterial color="#222" /></mesh>
    <mesh position={[-0.4, 1.85, 0.2]}><boxGeometry args={[0.6, 0.2, 0.4]} /><meshStandardMaterial color="red" emissive="red" emissiveIntensity={on ? 3 : 0.2} /></mesh>
    <mesh position={[0.4, 1.85, 0.2]}><boxGeometry args={[0.6, 0.2, 0.4]} /><meshStandardMaterial color="blue" emissive="blue" emissiveIntensity={on ? 0.2 : 3} /></mesh>
  </group>);
}
function Beer() {
  const r = useRef<THREE.Mesh>(null);
  useFrame((_, d) => { if (r.current) r.current.rotation.y += d * 3; });
  return (<mesh ref={r} position={[0, 1.2, 0]}><cylinderGeometry args={[0.4, 0.4, 1.1, 16]} /><meshStandardMaterial color="#f5c400" emissive="#a07000" emissiveIntensity={0.6} metalness={0.7} roughness={0.25} /></mesh>);
}
function Deer() {
  const c = "#c98a4b";
  return (<group rotation={[0, Math.PI, 0]}>
    <mesh position={[0, 1.2, 0]} castShadow><boxGeometry args={[0.7, 0.7, 1.6]} /><meshStandardMaterial color={c} /></mesh>
    <mesh position={[0, 1.9, 0.8]}><boxGeometry args={[0.5, 0.6, 0.6]} /><meshStandardMaterial color={c} /></mesh>
    <mesh position={[0, 2.35, 0.8]}><coneGeometry args={[0.2, 0.3, 4]} /><meshStandardMaterial color="#ff4aa0" /></mesh>
    {[[-0.25, -0.6], [0.25, -0.6], [-0.25, 0.6], [0.25, 0.6]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.45, z]}><boxGeometry args={[0.15, 0.9, 0.15]} /><meshStandardMaterial color="#7a4b22" /></mesh>
    ))}
    {[-1, 1].map((s) => <mesh key={s} position={[s * 0.25, 2.5, 0.7]} rotation={[0, 0, -s * 0.5]}><cylinderGeometry args={[0.04, 0.04, 0.6]} /><meshStandardMaterial color="#5a3a1a" /></mesh>)}
  </group>);
}

function roadTexture() {
  const c = document.createElement("canvas"); c.width = 256; c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#3a3a3f"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  g.fillStyle = "#f2c230";
  [85, 171].forEach((x) => g.fillRect(x - 3, 20, 6, 100));
  g.fillStyle = "#eee"; g.fillRect(4, 0, 6, 256); g.fillRect(246, 0, 6, 256);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 40); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function World({ s, onHud, onEvent }: { s: React.MutableRefObject<GameState>; onHud: (h: Hud) => void; onEvent: (k: string) => void }) {
  const truck = useRef<THREE.Group>(null);
  const road = useRef<THREE.Mesh>(null);
  const [ents, setEnts] = useState<Entity[]>([]);
  const [t, setT] = useState(0);
  const acc = useRef(0);
  const { camera } = useThree();
  const tex = useMemo(roadTexture, []);
  const grass = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 64; c.height = 64; const g = c.getContext("2d")!;
    g.fillStyle = "#4f8f3a"; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 300; i++) { g.fillStyle = Math.random() < 0.5 ? "#5fa046" : "#3f7a2e"; g.fillRect(Math.random() * 64, Math.random() * 64, 2, 2); }
    const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(30, 120); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const st = s.current;
    step(st, dt).forEach(onEvent);
    if (truck.current) {
      truck.current.position.set(st.x, 0, st.z);
      truck.current.rotation.y = (LANES[st.lane] - st.x) * -0.08 + Math.sin(st.wobble * 3) * st.drunk * 0.05;
      truck.current.rotation.z = st.over ? 0.4 : 0;
    }
    if (road.current) road.current.position.z = st.z - 100;
    tex.offset.y = 0;
    const sway = Math.sin(st.wobble * 1.3) * st.drunk * 0.8;
    camera.position.lerp(new THREE.Vector3(st.x * 0.6 + sway, 7, st.z + 13), 0.15);
    camera.lookAt(st.x * 0.8, 1.5, st.z - 10);
    (camera as THREE.PerspectiveCamera).rotation.z += sway * 0.04;
    acc.current += dt;
    if (acc.current > 0.05) {
      acc.current = 0;
      setEnts([...st.entities]); setT(state.clock.elapsedTime);
      onHud({ score: Math.floor(st.score), beers: st.beers, deers: st.deers, speed: Math.floor(st.speed * 3), over: st.over, flash: "" });
    }
  });

  return (<>
    <mesh ref={road} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[10, 400]} /><meshStandardMaterial map={tex} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, s.current.z]} receiveShadow>
      <planeGeometry args={[300, 4000]} /><meshStandardMaterial map={grass} />
    </mesh>
    <group ref={truck}><Suspense fallback={null}><Truck /></Suspense><Asgore /></group>
    {ents.map((e) => {
      if (e.hit && e.kind !== "tree" && e.kind !== "police") return null;
      const x = LANES[e.lane];
      return (<group key={e.id} position={[x, e.hit ? 0 : 0, e.z]} rotation={[0, 0, e.hit ? 1.2 : 0]}>
        {e.kind === "tree" && <Tree />}{e.kind === "police" && <Police t={t} />}
        {e.kind === "beer" && <Beer />}{e.kind === "deer" && <Deer />}
      </group>);
    })}
    <SideTrees z={s.current.z} />
  </>);
}

function SideTrees({ z }: { z: number }) {
  const base = Math.floor(z / 20) * 20;
  return (<>{Array.from({ length: 14 }, (_, i) => {
    const zz = base - i * 20 + 20;
    return [-1, 1].map((sd) => <group key={`${zz}${sd}`} position={[sd * (9 + ((zz * 7) % 5 + 5) % 5), 0, zz]}><Tree /></group>);
  })}</>);
}

export default function Game() {
  const s = useRef<GameState>(newGame());
  const [hud, setHud] = useState<Hud>({ score: 0, beers: 0, deers: 0, speed: 0, over: false, flash: "" });
  const [started, setStarted] = useState(false);
  const [flash, setFlash] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(e.key)) steer(s.current, -1);
      if (["ArrowRight", "d", "D"].includes(e.key)) steer(s.current, 1);
      if ((e.key === " " || e.key === "Enter") && (!started || s.current.over)) restart();
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  function restart() { s.current = newGame(); setStarted(true); setFlash(""); }
  function onEvent(k: string) {
    const m: Record<string, string> = { beer: "+1 SKOL 🍺", deer: "ATROPELOU A DESS! 🦌💥", tree: "BATI NA ÁRVORE", police: "PEGO PELA POLÍCIA 🚓" };
    setFlash(m[k]); setTimeout(() => setFlash(""), 900);
  }
  useEffect(() => { if (!started) s.current.over = true; }, [started]);

  const lyric = LYRICS[Math.floor(hud.score / 400) % LYRICS.length];

  return (
    <div className="game-root" data-scene-ready={ready ? "" : undefined}>
      <Canvas shadows camera={{ fov: 60, position: [0, 7, 13] }} onCreated={() => setTimeout(() => setReady(true), 500)}>
        <color attach="background" args={["#f7b267"]} />
        <fog attach="fog" args={["#f7b267", 40, 150]} />
        <hemisphereLight args={["#ffe9c7", "#4f6b3a", 0.8]} />
        <directionalLight position={[10, 20, 5]} intensity={2.2} castShadow />
        <Environment><Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} /></Environment>
        <World s={s} onHud={setHud} onEvent={onEvent} />
      </Canvas>

      {started && (
        <div className="hud">
          <div className="hud-stat">🍺 {hud.beers}/7</div>
          <div className="hud-stat">🦌 {hud.deers}</div>
          <div className="hud-stat">{hud.speed} km/h</div>
          <div className="hud-stat">{hud.score} pts</div>
        </div>
      )}
      {started && !hud.over && <div className="lyric">♪ {hud.beers >= 7 ? "Chei das sete cerveja!!" : lyric} ♪</div>}
      {flash && <div className="flash">{flash}</div>}

      {!started && (
        <div className="overlay">
          <h1 className="title">BERGENTRÜCK</h1>
          <p className="subtitle">Asgore Atropelando a Dess</p>
          <p className="hint">← → ou A/D pra trocar de faixa · pegue as Skol · atropele a Dess · desvie das árvores e da polícia na contra-mão</p>
          <button className="btn-game" onClick={restart}>DIRIGIR 🚛</button>
        </div>
      )}
      {started && hud.over && (
        <div className="overlay">
          <h1 className="title">NA JAULA</h1>
          <div className="ending">{ENDING.map((l) => <p key={l}>{l}</p>)}</div>
          <p className="subtitle">{hud.score} pts · {hud.beers} Skol · {hud.deers} Dess</p>
          <button className="btn-game" onClick={restart}>FUGIR DE NOVO</button>
        </div>
      )}
      <div className="touch">
        <button aria-label="Esquerda" onPointerDown={() => steer(s.current, -1)}>◀</button>
        <button aria-label="Direita" onPointerDown={() => steer(s.current, 1)}>▶</button>
      </div>
    </div>
  );
}
