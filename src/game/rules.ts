// Pure game rules — no React / three imports.
export const LANES = [-3.2, 0, 3.2];
export const BASE_SPEED = 22;
export const MAX_SPEED = 48;
export const ACCEL = 1.2;
export const LANE_SWITCH = 12;

export type Kind = "tree" | "police" | "beer" | "deer";
export interface Entity { id: number; kind: Kind; lane: number; z: number; hit?: boolean }

export interface GameState {
  z: number; speed: number; lane: number; x: number;
  beers: number; deers: number; score: number;
  entities: Entity[]; nextSpawn: number; nextId: number;
  over: boolean; drunk: number; wobble: number;
}

export const LYRICS = [
  "Eu vou dirigir depois de beber 🍺",
  "O veadinho ali só sabe correr",
  "Se multar, não vou me importar — vou atropelar",
  "O meu tanque tá lotado mermão",
  "Te pulverizar com minha carreta",
  "É o meu Bergentrück — TRUCK!",
  "Sangue no farol, polícia tá alí",
  "Eu acelero o caminhão, podem perseguir",
  "Pega a contra-mão eu vou escapar",
  "Porque o carro do rei nunca vai parar",
  "Dirigir não vou parar…",
  "Chei das sete cerveja",
  "Eles podem até tentar, mas não vão me ultrapassar",
  "Cérebro só vai fritar pra eu prosseguir",
];

export const ENDING = [
  "Aí, me fudi, bati na árvore",
  "Agora só dá pra eu tentar fugir",
  "Não posso ir pra cadeia, minhas flores vão morrer",
  "Eu tenho filhos pra cuidar e uma torta pra comer",
  "Agora tô numa jaula depois de divorciar",
];

export function newGame(): GameState {
  return { z: 0, speed: BASE_SPEED, lane: 1, x: 0, beers: 0, deers: 0, score: 0,
    entities: [], nextSpawn: -40, nextId: 1, over: false, drunk: 0, wobble: 0 };
}

export function steer(s: GameState, dir: -1 | 1) {
  if (s.over) return;
  s.lane = Math.max(0, Math.min(2, s.lane + dir));
}

function spawn(s: GameState) {
  const r = Math.random();
  const kind: Kind = r < 0.38 ? "tree" : r < 0.62 ? "police" : r < 0.88 ? "beer" : "deer";
  const lane = Math.floor(Math.random() * 3);
  s.entities.push({ id: s.nextId++, kind, lane, z: s.nextSpawn });
  // occasionally a second obstacle in another lane, never blocking all three
  if (Math.random() < 0.35) {
    const l2 = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
    s.entities.push({ id: s.nextId++, kind: Math.random() < 0.5 ? "beer" : "tree", lane: l2, z: s.nextSpawn });
  }
  s.nextSpawn -= 14 + Math.random() * 12 - Math.min(8, s.speed / 8);
}

/** Advance simulation. Returns events that happened this step. */
export function step(s: GameState, dt: number): Kind[] {
  const events: Kind[] = [];
  if (s.over) return events;
  s.speed = Math.min(MAX_SPEED, s.speed + ACCEL * dt);
  s.z -= s.speed * dt;
  s.score += s.speed * dt;
  s.wobble += dt * (1 + s.drunk);
  const target = LANES[s.lane] + Math.sin(s.wobble * 2.2) * s.drunk * 0.6;
  s.x += (target - s.x) * Math.min(1, LANE_SWITCH * dt);
  while (s.nextSpawn > s.z - 160) spawn(s);
  for (const e of s.entities) {
    if (e.kind === "police") e.z += 14 * dt; // oncoming, contra-mão
    if (e.hit) continue;
    if (Math.abs(e.z - s.z) < 2.4 && Math.abs(LANES[e.lane] - s.x) < 1.8) {
      e.hit = true;
      events.push(e.kind);
      if (e.kind === "beer") { s.beers++; s.score += 50; s.drunk = Math.min(1.5, s.beers / 7); }
      else if (e.kind === "deer") { s.deers++; s.score += 300; }
      else s.over = true;
    }
  }
  s.entities = s.entities.filter((e) => e.z < s.z + 20);
  return events;
}
