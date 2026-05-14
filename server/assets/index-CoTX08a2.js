import { r as reactExports, V as jsxRuntimeExports } from "./server-DS0FM-f_.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const CELL = 10;
const GRID = 220;
const WORLD = CELL * GRID;
const CENTER = WORLD / 2;
const RADIUS = CENTER - CELL * 4;
const PLAYER_SPEED = 110;
const ENEMY_SPEED = 95;
const N_ENEMIES = 4;
const DIRS = {
  up: {
    x: 0,
    y: -1
  },
  down: {
    x: 0,
    y: 1
  },
  left: {
    x: -1,
    y: 0
  },
  right: {
    x: 1,
    y: 0
  }
};
const COLORS = [{
  id: 1,
  name: "You",
  base: "#22d3ee",
  terr: "rgba(34,211,238,0.35)",
  trail: "#67e8f9"
}, {
  id: 2,
  name: "Crimson",
  base: "#ef4444",
  terr: "rgba(239,68,68,0.30)",
  trail: "#fca5a5"
}, {
  id: 3,
  name: "Amber",
  base: "#f59e0b",
  terr: "rgba(245,158,11,0.30)",
  trail: "#fcd34d"
}, {
  id: 4,
  name: "Violet",
  base: "#a855f7",
  terr: "rgba(168,85,247,0.30)",
  trail: "#d8b4fe"
}, {
  id: 5,
  name: "Lime",
  base: "#84cc16",
  terr: "rgba(132,204,22,0.30)",
  trail: "#bef264"
}];
function key(gx, gy) {
  return gy * GRID + gx;
}
function inCircle(gx, gy) {
  const cx = (gx + 0.5) * CELL - CENTER;
  const cy = (gy + 0.5) * CELL - CENTER;
  return cx * cx + cy * cy <= RADIUS * RADIUS;
}
function Index() {
  const canvasRef = reactExports.useRef(null);
  const [scores, setScores] = reactExports.useState([]);
  const [gameOver, setGameOver] = reactExports.useState(false);
  const [restartKey, setRestartKey] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let last = performance.now();
    const owner = new Uint8Array(GRID * GRID);
    const ents = [];
    function spawnBase(id, cx, cy) {
      for (let gy = cy - 3; gy <= cy + 3; gy++) for (let gx = cx - 3; gx <= cx + 3; gx++) if (inCircle(gx, gy)) owner[key(gx, gy)] = id;
    }
    function makeEntity(id, isPlayer) {
      const angle = (id - 1) / (N_ENEMIES + 1) * Math.PI * 2;
      const r = RADIUS * 0.55;
      const wx = CENTER + Math.cos(angle) * r;
      const wy = CENTER + Math.sin(angle) * r;
      const gx = Math.floor(wx / CELL);
      const gy = Math.floor(wy / CELL);
      spawnBase(id, gx, gy);
      const dir = {
        x: 1,
        y: 0
      };
      return {
        id,
        x: wx,
        y: wy,
        dir,
        nextDir: dir,
        alive: true,
        trail: [],
        trailSet: /* @__PURE__ */ new Set(),
        inTerritory: true,
        isPlayer,
        aiTimer: 0
      };
    }
    const player = makeEntity(1, true);
    ents.push(player);
    for (let i = 0; i < N_ENEMIES; i++) ents.push(makeEntity(i + 2, false));
    const keysDown = /* @__PURE__ */ new Set();
    function onKey(e, down) {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
        e.preventDefault();
        if (down) keysDown.add(k);
        else keysDown.delete(k);
        if (down) {
          let nd = null;
          if (k === "arrowup" || k === "w") nd = DIRS.up;
          else if (k === "arrowdown" || k === "s") nd = DIRS.down;
          else if (k === "arrowleft" || k === "a") nd = DIRS.left;
          else if (k === "arrowright" || k === "d") nd = DIRS.right;
          if (nd && (nd.x !== -player.dir.x || nd.y !== -player.dir.y)) {
            player.nextDir = nd;
          }
        }
      }
    }
    const kd = (e) => onKey(e, true);
    const ku = (e) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    function killEntity(e) {
      e.alive = false;
      for (let i = 0; i < owner.length; i++) if (owner[i] === e.id) owner[i] = 0;
      e.trail = [];
      e.trailSet.clear();
      if (e.isPlayer) {
        setGameOver(true);
      } else {
        e.respawnAt = performance.now() + 2500;
      }
    }
    function respawn(e) {
      const angle = Math.random() * Math.PI * 2;
      const r = RADIUS * (0.3 + Math.random() * 0.4);
      e.x = CENTER + Math.cos(angle) * r;
      e.y = CENTER + Math.sin(angle) * r;
      const gx = Math.floor(e.x / CELL), gy = Math.floor(e.y / CELL);
      spawnBase(e.id, gx, gy);
      e.dir = {
        x: 1,
        y: 0
      };
      e.nextDir = e.dir;
      e.alive = true;
      e.inTerritory = true;
      e.trail = [];
      e.trailSet.clear();
      e.respawnAt = void 0;
    }
    function doCapture(e) {
      if (e.trail.length === 0) return;
      for (const t of e.trail) owner[key(t.gx, t.gy)] = e.id;
      let minX = GRID, minY = GRID, maxX = 0, maxY = 0;
      for (const t of e.trail) {
        if (t.gx < minX) minX = t.gx;
        if (t.gy < minY) minY = t.gy;
        if (t.gx > maxX) maxX = t.gx;
        if (t.gy > maxY) maxY = t.gy;
      }
      minX = Math.max(0, minX - 1);
      minY = Math.max(0, minY - 1);
      maxX = Math.min(GRID - 1, maxX + 1);
      maxY = Math.min(GRID - 1, maxY + 1);
      const w = maxX - minX + 1, h = maxY - minY + 1;
      const visited = new Uint8Array(w * h);
      const stack = [];
      for (let x = minX; x <= maxX; x++) {
        for (const y of [minY, maxY]) {
          const idx = (y - minY) * w + (x - minX);
          if (!visited[idx] && owner[key(x, y)] !== e.id) {
            visited[idx] = 1;
            stack.push(x, y);
          }
        }
      }
      for (let y = minY; y <= maxY; y++) {
        for (const x of [minX, maxX]) {
          const idx = (y - minY) * w + (x - minX);
          if (!visited[idx] && owner[key(x, y)] !== e.id) {
            visited[idx] = 1;
            stack.push(x, y);
          }
        }
      }
      while (stack.length) {
        const y = stack.pop();
        const x = stack.pop();
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy;
          if (nx < minX || ny < minY || nx > maxX || ny > maxY) continue;
          const vi = (ny - minY) * w + (nx - minX);
          if (visited[vi]) continue;
          if (owner[key(nx, ny)] === e.id) continue;
          visited[vi] = 1;
          stack.push(nx, ny);
        }
      }
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const vi = (y - minY) * w + (x - minX);
          if (!visited[vi] && inCircle(x, y)) {
            owner[key(x, y)] = e.id;
          }
        }
      }
      e.trail = [];
      e.trailSet.clear();
    }
    function stepEntity(e, dt) {
      if (!e.alive) return;
      const beforeGX = Math.floor(e.x / CELL);
      const beforeGY = Math.floor(e.y / CELL);
      e.x += e.dir.x * (e.isPlayer ? PLAYER_SPEED : ENEMY_SPEED) * dt;
      e.y += e.dir.y * (e.isPlayer ? PLAYER_SPEED : ENEMY_SPEED) * dt;
      const gx = Math.floor(e.x / CELL);
      const gy = Math.floor(e.y / CELL);
      if (!inCircle(gx, gy)) {
        killEntity(e);
        return;
      }
      if (gx !== beforeGX || gy !== beforeGY) {
        if (e.isPlayer && (e.nextDir.x !== e.dir.x || e.nextDir.y !== e.dir.y)) {
          if (!(e.nextDir.x === -e.dir.x && e.nextDir.y === -e.dir.y)) {
            e.dir = e.nextDir;
          }
        }
        const cellOwner = owner[key(gx, gy)];
        const onOwn = cellOwner === e.id;
        if (e.trailSet.has(key(gx, gy))) {
          killEntity(e);
          return;
        }
        for (const other of ents) {
          if (other === e || !other.alive) continue;
          if (other.trailSet.has(key(gx, gy))) {
            killEntity(other);
          }
        }
        if (onOwn) {
          if (e.trail.length > 0) doCapture(e);
          e.inTerritory = true;
        } else {
          e.inTerritory = false;
          if (!e.trailSet.has(key(gx, gy))) {
            e.trail.push({
              gx,
              gy
            });
            e.trailSet.add(key(gx, gy));
          }
        }
      }
    }
    function headOnCheck() {
      for (let i = 0; i < ents.length; i++) {
        const a = ents[i];
        if (!a.alive) continue;
        for (let j = i + 1; j < ents.length; j++) {
          const b = ents[j];
          if (!b.alive) continue;
          const dx = a.x - b.x, dy = a.y - b.y;
          if (dx * dx + dy * dy < (CELL * 0.9) ** 2) {
            const towardA = b.dir.x === -a.dir.x && b.dir.y === -a.dir.y;
            if (towardA) {
              if (a.isPlayer) killEntity(b);
              else if (b.isPlayer) killEntity(a);
              else killEntity(b);
            } else {
              killEntity(b);
            }
          }
        }
      }
    }
    function aiUpdate(e, dt) {
      if (!e.alive) return;
      e.aiTimer -= dt;
      const gx = Math.floor(e.x / CELL), gy = Math.floor(e.y / CELL);
      const cx = (gx + 0.5) * CELL - CENTER;
      const cy = (gy + 0.5) * CELL - CENTER;
      const distFromCenter = Math.hypot(cx, cy);
      const nearEdge = distFromCenter > RADIUS * 0.85;
      if (e.aiTimer <= 0 || nearEdge) {
        e.aiTimer = 0.6 + Math.random() * 1.4;
        const options = [];
        for (const d of Object.values(DIRS)) {
          if (d.x === -e.dir.x && d.y === -e.dir.y) continue;
          const nx = gx + d.x, ny = gy + d.y;
          if (!inCircle(nx, ny)) continue;
          if (e.trailSet.has(key(nx, ny))) continue;
          options.push(d);
        }
        if (options.length) {
          let chosen = options[Math.floor(Math.random() * options.length)];
          if (nearEdge) {
            let best = chosen, bestD = Infinity;
            for (const d of options) {
              const ncx = (gx + d.x + 0.5) * CELL - CENTER;
              const ncy = (gy + d.y + 0.5) * CELL - CENTER;
              const dd = Math.hypot(ncx, ncy);
              if (dd < bestD) {
                bestD = dd;
                best = d;
              }
            }
            chosen = best;
          }
          e.dir = chosen;
        }
      }
    }
    let scoreTimer = 0;
    function updateScores() {
      const counts = {};
      for (let i = 0; i < owner.length; i++) {
        const o = owner[i];
        if (o) {
          counts[o] = (counts[o] || 0) + 1;
        }
      }
      let totalArea = 0;
      for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (inCircle(x, y)) totalArea++;
      const out = ents.map((e) => {
        const c = COLORS.find((c2) => c2.id === e.id);
        return {
          id: e.id,
          name: c.name,
          pct: (counts[e.id] || 0) / totalArea * 100,
          alive: e.alive
        };
      });
      setScores(out);
    }
    function render() {
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = "#0a0e1a";
      ctx.fillRect(0, 0, W, H);
      const camX = player.x - W / 2;
      const camY = player.y - H / 2;
      ctx.save();
      ctx.translate(-camX, -camY);
      ctx.fillStyle = "#0a0e1a";
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#111827";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const step = CELL * 4;
      const minWX = Math.max(0, camX);
      const maxWX = Math.min(WORLD, camX + W);
      const minWY = Math.max(0, camY);
      const maxWY = Math.min(WORLD, camY + H);
      for (let x = Math.floor(minWX / step) * step; x <= maxWX; x += step) {
        ctx.moveTo(x, minWY);
        ctx.lineTo(x, maxWY);
      }
      for (let y = Math.floor(minWY / step) * step; y <= maxWY; y += step) {
        ctx.moveTo(minWX, y);
        ctx.lineTo(maxWX, y);
      }
      ctx.stroke();
      const minGX = Math.max(0, Math.floor(camX / CELL));
      const maxGX = Math.min(GRID - 1, Math.ceil((camX + W) / CELL));
      const minGY = Math.max(0, Math.floor(camY / CELL));
      const maxGY = Math.min(GRID - 1, Math.ceil((camY + H) / CELL));
      for (let y = minGY; y <= maxGY; y++) {
        for (let x = minGX; x <= maxGX; x++) {
          const o = owner[key(x, y)];
          if (!o) continue;
          const c = COLORS.find((c2) => c2.id === o);
          ctx.fillStyle = c.terr;
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
      for (const e of ents) {
        if (!e.alive) continue;
        const c = COLORS.find((c2) => c2.id === e.id);
        ctx.fillStyle = c.trail;
        for (const t of e.trail) {
          ctx.fillRect(t.gx * CELL + 2, t.gy * CELL + 2, CELL - 4, CELL - 4);
        }
      }
      for (const e of ents) {
        if (!e.alive) continue;
        const c = COLORS.find((c2) => c2.id === e.id);
        ctx.fillStyle = c.base;
        ctx.beginPath();
        ctx.arc(e.x, e.y, CELL * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1e3);
      last = now;
      for (const e of ents) {
        if (!e.alive) {
          if (!e.isPlayer && e.respawnAt && now > e.respawnAt) respawn(e);
          continue;
        }
        if (!e.isPlayer) aiUpdate(e, dt);
        stepEntity(e, dt);
      }
      headOnCheck();
      scoreTimer -= dt;
      if (scoreTimer <= 0) {
        scoreTimer = 0.5;
        updateScores();
      }
      render();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    updateScores();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("resize", resize);
    };
  }, [restartKey]);
  const sorted = [...scores].sort((a, b) => b.pct - a.pct);
  const playerScore = scores.find((s) => s.id === 1);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 overflow-hidden bg-[#0a0e1a] text-white font-sans select-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("canvas", { ref: canvasRef, className: "block w-full h-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-4 left-4 bg-black/50 backdrop-blur px-4 py-3 rounded-xl border border-white/10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-widest text-cyan-300/80", children: "Your Territory" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-bold text-cyan-300", children: [
        playerScore ? playerScore.pct.toFixed(2) : "0.00",
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-4 right-4 bg-black/50 backdrop-blur px-4 py-3 rounded-xl border border-white/10 min-w-[200px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-widest text-white/60 mb-2", children: "Leaderboard" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1", children: sorted.map((s) => {
        const c = COLORS.find((c2) => c2.id === s.id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-3 h-3 rounded-full", style: {
              background: c.base,
              opacity: s.alive ? 1 : 0.3
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
              opacity: s.alive ? 1 : 0.4
            }, children: c.name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono", style: {
            opacity: s.alive ? 1 : 0.4
          }, children: [
            s.pct.toFixed(1),
            "%"
          ] })
        ] }, s.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm text-white/80", children: "WASD / Arrow Keys to move · Capture territory · Hit enemy trails to kill them" }),
    gameOver && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[#0f172a] border border-white/15 rounded-2xl p-8 text-center max-w-sm w-full mx-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-bold text-red-400 mb-2", children: "Game Over" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/70 mb-6", children: [
        "You captured ",
        playerScore ? playerScore.pct.toFixed(2) : "0",
        "% of the world."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "bg-cyan-500 hover:bg-cyan-400 transition text-black font-semibold px-6 py-3 rounded-lg w-full", onClick: () => {
        setGameOver(false);
        setRestartKey((k) => k + 1);
      }, children: "Play Again" })
    ] }) })
  ] });
}
export {
  Index as component
};
