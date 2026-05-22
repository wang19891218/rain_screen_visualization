// js/geometry.js — house, ground and the corrugated rain screen panel.

import * as THREE from 'three';
import {
  PANEL_W, PANEL_H, PITCH, N_RIBS, RIB_DEPTH, SHEET_T, PANEL_DEPTH,
  WALL_HALF_W, WALL_H, DEPTH_HALF, RIDGE_Y, FRONT_WALL_Z, PANEL_CENTER_Y,
  GROUND_COLOR,
} from './config.js';

// ----------------------------------------------------------------------
// Procedural OSB / oriented-strand-board texture — matte, light tan.
// ----------------------------------------------------------------------
export function makeOSBTexture() {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.fillStyle = '#c6a878';
  g.fillRect(0, 0, S, S);
  const tans = ['#b6925f', '#caaf82', '#bda06f', '#d3bd93',
                '#a98a58', '#c8ab7b', '#d8c49a', '#b09064'];
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * S, y = Math.random() * S;
    const w = 16 + Math.random() * 52, h = 5 + Math.random() * 8;
    g.save();
    g.translate(x, y);
    g.rotate(Math.random() * Math.PI);
    g.globalAlpha = 0.30 + Math.random() * 0.45;
    g.fillStyle = tans[(Math.random() * tans.length) | 0];
    g.fillRect(-w / 2, -h / 2, w, h);
    g.restore();
  }
  for (let i = 0; i < 5200; i++) {
    g.globalAlpha = 0.05 + Math.random() * 0.13;
    g.fillStyle = Math.random() < 0.5 ? '#806444' : '#e7d6ad';
    g.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// ----------------------------------------------------------------------
// Text-on-canvas sprite — sensor ids and EXTERIOR / INTERIOR labels.
// ----------------------------------------------------------------------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

export function makeTextSprite(text, opts = {}) {
  const {
    fontSize = 52, padding = 22, bg = 'rgba(255,255,255,0.95)',
    color = '#1d2733', border = '#8c98a6', scale = 0.0042,
  } = opts;
  const cv = document.createElement('canvas');
  let ctx = cv.getContext('2d');
  const font = '600 ' + fontSize + 'px "Segoe UI", Arial, sans-serif';
  ctx.font = font;
  const tw = ctx.measureText(text).width;
  cv.width  = Math.ceil(tw + padding * 2);
  cv.height = Math.ceil(fontSize + padding * 2);
  ctx = cv.getContext('2d');
  ctx.font = font;
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, cv.width, cv.height, 18);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = border;
  roundRect(ctx, 1.5, 1.5, cv.width - 3, cv.height - 3, 16);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cv.width / 2, cv.height / 2 + 2);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest: true, depthWrite: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(cv.width * scale, cv.height * scale, 1);
  sp.renderOrder = 10;
  return sp;
}

// ----------------------------------------------------------------------
// Ground plane + faint orientation grid.
// ----------------------------------------------------------------------
export function buildGround() {
  const g = new THREE.Group();
  g.name = 'ground';
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(20, 64),
    new THREE.MeshStandardMaterial({ color: GROUND_COLOR, roughness: 1, metalness: 0 }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.receiveShadow = true;
  g.add(disc);

  const grid = new THREE.GridHelper(24, 24, 0xb4bcc4, 0xd0d6dc);
  grid.position.y = 0.003;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  g.add(grid);
  return g;
}

// ----------------------------------------------------------------------
// Semi-transparent ("ghosted") gable house.
// ----------------------------------------------------------------------
export function buildHouse() {
  const g = new THREE.Group();
  g.name = 'house';
  const hw = WALL_HALF_W, hh = WALL_H, hd = DEPTH_HALF, ry = RIDGE_Y;

  const A  = [-hw, 0, hd],  B  = [hw, 0, hd],  C  = [hw, 0, -hd],  D  = [-hw, 0, -hd];
  const A2 = [-hw, hh, hd], B2 = [hw, hh, hd], C2 = [hw, hh, -hd], D2 = [-hw, hh, -hd];
  const R0 = [0, ry, hd],   R1 = [0, ry, -hd];

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xaecadb, roughness: 0.95, metalness: 0.0,
    transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x97a4b1, roughness: 0.9, metalness: 0.0,
    transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false,
  });

  function poly(pts, mat) {
    const flat = [];
    pts.forEach(p => flat.push(p[0], p[1], p[2]));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(flat, 3));
    geo.setIndex(pts.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2]);
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, mat));
  }

  poly([A, B, B2, A2], wallMat);   // front wall
  poly([C, D, D2, C2], wallMat);   // back wall
  poly([D, A, A2, D2], wallMat);   // left wall
  poly([B, C, C2, B2], wallMat);   // right wall
  poly([A2, B2, R0],   wallMat);   // front gable
  poly([C2, D2, R1],   wallMat);   // back gable
  poly([B2, C2, R1, R0], roofMat); // right roof slope
  poly([D2, A2, R0, R1], roofMat); // left roof slope

  const E = [
    A, A2,  B, B2,  C, C2,  D, D2,             // wall verticals
    A2, B2, B2, C2,  C2, D2, D2, A2,           // wall-top ring
    A, B,   B, C,    C, D,   D, A,             // ground sill ring
    A2, R0, B2, R0,  D2, R1, C2, R1,           // gable rakes
    R0, R1,                                    // ridge
  ];
  const ePts = [];
  E.forEach(p => ePts.push(p[0], p[1], p[2]));
  const eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.Float32BufferAttribute(ePts, 3));
  g.add(new THREE.LineSegments(eGeo, new THREE.LineBasicMaterial({
    color: 0x47546a, transparent: true, opacity: 0.85,
  })));

  function addWallOutline(points, color = 0x506078, opacity = 0.72) {
    const flat = [];
    points.forEach(p => flat.push(p[0], p[1], p[2]));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(flat, 3));
    g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
      color, transparent: true, opacity,
    })));
  }

  // Simple architectural cues keep the transparent shell reading as a house.
  const zFront = hd + 0.006;
  addWallOutline([
    [-2.15, 0.0, zFront], [-2.15, 1.0, zFront],
    [-2.15, 1.0, zFront], [-1.55, 1.0, zFront],
    [-1.55, 1.0, zFront], [-1.55, 0.0, zFront],
    [-2.15, 0.0, zFront], [-1.55, 0.0, zFront],
    [1.45, 1.65, zFront], [2.15, 1.65, zFront],
    [2.15, 1.65, zFront], [2.15, 2.18, zFront],
    [2.15, 2.18, zFront], [1.45, 2.18, zFront],
    [1.45, 2.18, zFront], [1.45, 1.65, zFront],
  ]);

  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.62, 0.22),
    new THREE.MeshStandardMaterial({
      color: 0x6f7d88, roughness: 0.9, metalness: 0.0,
      transparent: true, opacity: 0.38, depthWrite: false,
    }),
  );
  chimney.position.set(-1.35, ry + 0.13, -0.75);
  g.add(chimney);

  return g;
}

// ----------------------------------------------------------------------
// The ONE rain screen panel — trapezoidal vertical corrugation.
//
// Profile across the width (one 6 in pitch = 4 equal 1.5 in segments):
//   flat valley -> sloped web -> flat crown -> sloped web
// Ribs run vertically. Flat-shaded facets give sharp rib edges.
// Returns { group, panelMesh }; group is placed on the front wall.
// ----------------------------------------------------------------------
export function buildPanel() {
  const W = PANEL_W, H = PANEL_H, D = RIB_DEPTH, T = SHEET_T;
  const seg  = PITCH / 4;          // one of four equal segments per pitch
  const nSeg = N_RIBS * 4;         // 32 segments across the 48 in width
  const dc   = PANEL_DEPTH / 2;    // depth-centring offset
  const yT = H / 2, yB = -H / 2;

  // corrugation depth at station i: valley(0) valley(0) crown(D) crown(D) ...
  const corr = (i) => { const m = ((i % 4) + 4) % 4; return (m === 2 || m === 3) ? D : 0; };
  const xAt  = (i) => i * seg - W / 2;
  const zF   = (i) => corr(i) + T - dc;   // weather (front) surface
  const zB   = (i) => corr(i) - dc;       // building-side (back) surface

  const pos = [], uv = [], idx = [];
  const V = (x, y, z, u, v) => { pos.push(x, y, z); uv.push(u, v); return pos.length / 3 - 1; };
  const Q = (a, b, c, d) => { idx.push(a, b, c, a, c, d); };

  for (let i = 0; i < nSeg; i++) {            // front (weather) face
    const x0 = xAt(i), x1 = xAt(i + 1);
    const u0 = (x0 + W / 2) / W, u1 = (x1 + W / 2) / W;
    Q(V(x0, yB, zF(i), u0, 0), V(x1, yB, zF(i + 1), u1, 0),
      V(x1, yT, zF(i + 1), u1, 1), V(x0, yT, zF(i), u0, 1));
  }
  for (let i = 0; i < nSeg; i++) {            // back (building-side) face
    const x0 = xAt(i), x1 = xAt(i + 1);
    const u0 = (x0 + W / 2) / W, u1 = (x1 + W / 2) / W;
    Q(V(x0, yB, zB(i), u0, 0), V(x0, yT, zB(i), u0, 1),
      V(x1, yT, zB(i + 1), u1, 1), V(x1, yB, zB(i + 1), u1, 0));
  }
  for (let i = 0; i < nSeg; i++) {            // top + bottom caps
    const x0 = xAt(i), x1 = xAt(i + 1);
    Q(V(x0, yT, zF(i), 0, 0), V(x1, yT, zF(i + 1), 1, 0),
      V(x1, yT, zB(i + 1), 1, 1), V(x0, yT, zB(i), 0, 1));
    Q(V(x0, yB, zF(i), 0, 0), V(x0, yB, zB(i), 0, 1),
      V(x1, yB, zB(i + 1), 1, 1), V(x1, yB, zF(i + 1), 1, 0));
  }
  {                                            // left side cap
    const x = xAt(0);
    Q(V(x, yB, zF(0), 0, 0), V(x, yB, zB(0), 1, 0),
      V(x, yT, zB(0), 1, 1), V(x, yT, zF(0), 0, 1));
  }
  {                                            // right side cap
    const x = xAt(nSeg);
    Q(V(x, yB, zF(nSeg), 0, 0), V(x, yT, zF(nSeg), 0, 1),
      V(x, yT, zB(nSeg), 1, 1), V(x, yB, zB(nSeg), 1, 0));
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const panelMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: makeOSBTexture(),
    color: 0xffffff,
    roughness: 0.97,
    metalness: 0.0,
    flatShading: true,
    side: THREE.DoubleSide,
  }));
  panelMesh.name = 'panel';
  panelMesh.castShadow = true;
  panelMesh.receiveShadow = true;

  // dark mounting frame around the panel edges
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x53575c, roughness: 0.55, metalness: 0.15,
  });
  const fr = 0.06, fd = PANEL_DEPTH + 0.03;
  const frame = new THREE.Group();
  frame.name = 'panelFrame';
  for (const sy of [H / 2 + fr / 2, -H / 2 - fr / 2]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(W + 2 * fr, fr, fd), frameMat);
    b.position.set(0, sy, 0); b.castShadow = true; frame.add(b);
  }
  for (const sx of [W / 2 + fr / 2, -W / 2 - fr / 2]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(fr, H, fd), frameMat);
    b.position.set(sx, 0, 0); b.castShadow = true; frame.add(b);
  }

  const group = new THREE.Group();
  group.name = 'panelAssembly';
  group.add(panelMesh);
  group.add(frame);
  group.position.set(0, PANEL_CENTER_Y, FRONT_WALL_Z);

  return { group, panelMesh };
}
