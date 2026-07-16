/* Generates PRODUCTS/puzzles-vol1.json — 100 Target puzzles for the
   printable puzzle book. Same algorithm as the website (assets/js/target.js),
   but with book-specific seeds so the book never duplicates daily puzzles.
   Run: node tools/gen-puzzles.mjs */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* ---------- seeded RNG (identical to core.js) ---------- */
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = (s) => mulberry32(xmur3(String(s))());

/* ---------- generator (identical logic to target.js) ---------- */
const TIER_CFG = [
  { ops: 2, minT: 11,  label: "Warm-up" },
  { ops: 3, minT: 25,  label: "Easy"    },
  { ops: 3, minT: 60,  label: "Medium"  },
  { ops: 4, minT: 100, label: "Hard"    },
  { ops: 5, minT: 150, label: "Expert"  }
];
const ri = (rand, a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

function genNums(rand, t) {
  const out = [];
  if (t === 0) {
    while (out.length < 6) {
      const v = ri(rand, 1, 9);
      if (out.filter(x => x === v).length < 2) out.push(v);
    }
  } else if (t === 1) {
    for (let i = 0; i < 4; i++) out.push(ri(rand, 2, 9));
    for (let i = 0; i < 2; i++) out.push(ri(rand, 10, 20));
  } else if (t === 2) {
    for (let i = 0; i < 4; i++) out.push(ri(rand, 3, 12));
    for (let i = 0; i < 2; i++) out.push(ri(rand, 15, 45));
  } else if (t === 3) {
    for (let i = 0; i < 3; i++) out.push(ri(rand, 2, 9));
    for (let i = 0; i < 2; i++) out.push(ri(rand, 11, 30));
    out.push(pick(rand, [25, 50, 75, 100]));
  } else {
    for (let i = 0; i < 3; i++) out.push(ri(rand, 2, 9));
    out.push(ri(rand, 12, 45));
    const L = [25, 50, 75, 100];
    const a = pick(rand, L); let b = pick(rand, L);
    if (b === a) b = L[(L.indexOf(a) + 1) % L.length];
    out.push(a); out.push(b);
  }
  return out;
}
const OP_W = [
  [["+", 5], ["−", 3], ["×", 2]],
  [["+", 4], ["−", 3], ["×", 3], ["÷", 1]],
  [["+", 3], ["−", 3], ["×", 3], ["÷", 2]],
  [["+", 3], ["−", 3], ["×", 4], ["÷", 2]],
  [["+", 2], ["−", 3], ["×", 4], ["÷", 3]]
];
function wop(rand, t) {
  const w = OP_W[t];
  let total = 0;
  for (const [, wt] of w) total += wt;
  let r = rand() * total;
  for (const [op, wt] of w) { r -= wt; if (r < 0) return op; }
  return "+";
}
function tryStep(rand, vals, t) {
  for (let k = 0; k < 40; k++) {
    const i = Math.floor(rand() * vals.length);
    const j = Math.floor(rand() * vals.length);
    if (i === j) continue;
    const a = vals[i], b = vals[j], op = wop(rand, t);
    let A = a, Bv = b, res = null;
    if (op === "+") { res = a + b; if (res > 999) res = null; }
    else if (op === "×") { if (a > 1 && b > 1 && a * b <= 999) res = a * b; }
    else if (op === "−") { A = Math.max(a, b); Bv = Math.min(a, b); res = A - Bv; if (res < 1) res = null; }
    else { A = Math.max(a, b); Bv = Math.min(a, b); if (Bv > 1 && A % Bv === 0) res = A / Bv; }
    if (res === null) continue;
    return { i, j, a: A, b: Bv, op, res };
  }
  return null;
}
function buildPuzzle(tier, seedStr) {
  const rand = rng(seedStr);
  const cfg = TIER_CFG[tier];
  for (let attempt = 0; attempt < 400; attempt++) {
    const minT = attempt < 300 ? cfg.minT : 11;
    const nums = genNums(rand, tier);
    let vals = nums.slice();
    const steps = [];
    let ok = true;
    for (let s = 0; s < cfg.ops; s++) {
      const st = tryStep(rand, vals, tier);
      if (!st) { ok = false; break; }
      vals = vals.filter((_, idx) => idx !== st.i && idx !== st.j);
      vals.push(st.res);
      steps.push(st);
    }
    if (!ok) continue;
    const target = steps[steps.length - 1].res;
    if (target < minT || target > 999) continue;
    if (nums.includes(target)) continue;
    return { nums, target, solution: steps };
  }
  throw new Error("generation failed for " + seedStr);
}

/* ---------- validate (same multiset simulation as site QA) ---------- */
function validate(p) {
  if (p.nums.length !== 6 || p.target < 10 || p.target > 999) return false;
  if (p.nums.includes(p.target)) return false;
  const pool = p.nums.slice();
  for (const st of p.solution) {
    const ia = pool.indexOf(st.a);
    if (ia === -1) return false;
    pool.splice(ia, 1);
    const ib = pool.indexOf(st.b);
    if (ib === -1) return false;
    pool.splice(ib, 1);
    const r = st.op === "+" ? st.a + st.b : st.op === "−" ? st.a - st.b : st.op === "×" ? st.a * st.b : st.a / st.b;
    if (r !== st.res || r < 1 || !Number.isInteger(r)) return false;
    pool.push(r);
  }
  return p.solution[p.solution.length - 1].res === p.target;
}

/* ---------- build the book: 100 puzzles, 20 per tier ---------- */
const puzzles = [];
const seenBoards = new Set();
for (let tier = 0; tier < 5; tier++) {
  let made = 0, salt = 0;
  while (made < 20) {
    const seed = `bvm-book1-t${tier + 1}-n${made + 1}-s${salt}`;
    let p;
    try { p = buildPuzzle(tier, seed); } catch { salt++; continue; }
    const key = p.nums.slice().sort((x, y) => x - y).join(",") + ">" + p.target;
    if (!validate(p) || seenBoards.has(key)) { salt++; continue; }
    seenBoards.add(key);
    puzzles.push({
      n: puzzles.length + 1,
      tier: tier + 1,
      tierName: TIER_CFG[tier].label,
      nums: p.nums,
      target: p.target,
      solution: p.solution.map(s => `${s.a} ${s.op} ${s.b} = ${s.res}`)
    });
    made++;
  }
}

const outDir = path.join(ROOT, "PRODUCTS");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "puzzles-vol1.json"), JSON.stringify(puzzles, null, 1));
console.log(`OK: ${puzzles.length} puzzles written, all validated, ${seenBoards.size} unique boards`);
