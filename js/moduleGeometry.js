// js/moduleGeometry.js - PACCAR/WSU NET module shell and module-view details.

import * as THREE from 'three';
import {
  MODULE_D, MODULE_H, MODULE_L, MODULE_NORTH_Z, MODULE_PANEL_Y,
  MODULE_ROOF_RISE, MODULE_SOUTH_Z, MODULE_WALL_T, PANEL_DEPTH,
  PANEL_H, PANEL_W,
} from './config.js';
import { buildPanel, makeTextSprite } from './geometry.js';

function makeMat(color, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.86,
    metalness: 0,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 0.55,
  });
}

function addBox(group, name, size, pos, mat, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), mat);
  mesh.name = name;
  mesh.position.set(pos.x, pos.y, pos.z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addLineBox(group, size, pos, color = 0x30363d) {
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x, size.y, size.z));
  const edges = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.78,
  }));
  edges.position.set(pos.x, pos.y, pos.z);
  group.add(edges);
  return edges;
}

export function buildModuleShell({ opacity = 0.78, includeOpenings = true } = {}) {
  const group = new THREE.Group();
  group.name = 'paccarModuleShell';
  const shellParts = [];

  const wallMat = makeMat(0xb79b66, opacity);
  const roofMat = makeMat(0xc5a875, Math.min(1, opacity + 0.04));
  const trimMat = makeMat(0x695c43, Math.min(1, opacity + 0.12));
  const darkMat = makeMat(0x302c24, 1);

  const L = MODULE_L;
  const D = MODULE_D;
  const H = MODULE_H;
  const t = MODULE_WALL_T;
  const halfL = L / 2;
  const halfD = D / 2;

  shellParts.push(addBox(group, 'north wall', { x: L, y: H, z: t }, { x: 0, y: H / 2, z: halfD }, wallMat));
  shellParts.push(addBox(group, 'south wall', { x: L, y: H, z: t }, { x: 0, y: H / 2, z: -halfD }, wallMat));
  shellParts.push(addBox(group, 'west wall', { x: t, y: H, z: D }, { x: -halfL, y: H / 2, z: 0 }, wallMat));
  shellParts.push(addBox(group, 'east wall', { x: t, y: H, z: D }, { x: halfL, y: H / 2, z: 0 }, wallMat));
  shellParts.push(addBox(group, 'floor plate', { x: L, y: t, z: D }, { x: 0, y: t / 2, z: 0 }, trimMat));
  shellParts.push(addBox(group, 'low-slope roof', { x: L + 0.16, y: t + MODULE_ROOF_RISE, z: D + 0.16 },
    { x: 0, y: H + t / 2, z: 0 }, roofMat));

  // Dark perimeter frame visible in the SolidWorks renderings.
  addBox(group, 'north top fascia', { x: L + 0.12, y: 0.13, z: 0.12 }, { x: 0, y: H - 0.07, z: halfD + 0.065 }, trimMat);
  addBox(group, 'south top fascia', { x: L + 0.12, y: 0.13, z: 0.12 }, { x: 0, y: H - 0.07, z: -halfD - 0.065 }, trimMat);
  addBox(group, 'north bottom sill', { x: L + 0.05, y: 0.10, z: 0.12 }, { x: 0, y: 0.09, z: halfD + 0.07 }, trimMat);
  addBox(group, 'south bottom sill', { x: L + 0.05, y: 0.10, z: 0.12 }, { x: 0, y: 0.09, z: -halfD - 0.07 }, trimMat);

  if (includeOpenings) {
    // North-side left vertical opening and west-side small window cue.
    addBox(group, 'north opening void', { x: 0.34, y: 2.10, z: 0.035 }, { x: -2.08, y: 1.38, z: halfD + 0.122 }, darkMat);
    addBox(group, 'north opening bright interior', { x: 0.22, y: 1.96, z: 0.025 }, { x: -2.08, y: 1.42, z: halfD + 0.145 }, makeMat(0xf7f7ef, 1));
    addBox(group, 'west small window', { x: 0.035, y: 0.86, z: 0.42 }, { x: -halfL - 0.062, y: 1.55, z: 0.70 }, darkMat);
    addBox(group, 'west small window glass', { x: 0.025, y: 0.68, z: 0.27 }, { x: -halfL - 0.086, y: 1.55, z: 0.70 }, makeMat(0xeaf4ff, 1));
  }

  addLineBox(group, { x: L, y: H, z: D }, { x: 0, y: H / 2, z: 0 });
  group.userData.shellParts = shellParts;
  return group;
}

export function setModuleShellOpacity(moduleShell, value) {
  const opacity = Math.max(0, Math.min(1, value));
  for (const mesh of moduleShell.userData.shellParts || []) {
    mesh.material.transparent = opacity < 1;
    mesh.material.opacity = opacity;
    mesh.material.depthWrite = opacity >= 0.55;
    mesh.material.needsUpdate = true;
  }
}

export function buildCompass() {
  const group = new THREE.Group();
  group.name = 'compass';
  const y = 0.03;
  const len = 0.9;
  const matN = new THREE.MeshBasicMaterial({ color: 0xc34232 });
  const matS = new THREE.MeshBasicMaterial({ color: 0x2f74d0 });
  const matEW = new THREE.MeshBasicMaterial({ color: 0x56616f });

  function arrow(label, angle, mat, color) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 10), mat);
    shaft.rotation.z = Math.PI / 2;
    shaft.rotation.y = angle;
    shaft.position.set(Math.sin(angle) * len / 2, y, Math.cos(angle) * len / 2);
    group.add(shaft);

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 16), mat);
    head.rotation.x = Math.PI / 2;
    head.rotation.z = -angle;
    head.position.set(Math.sin(angle) * len, y, Math.cos(angle) * len);
    group.add(head);

    const sp = makeTextSprite(label, { fontSize: 34, padding: 10, color, scale: 0.0022 });
    sp.position.set(Math.sin(angle) * (len + 0.22), 0.16, Math.cos(angle) * (len + 0.22));
    group.add(sp);
  }

  arrow('N', 0, matN, '#9b241f');
  arrow('S', Math.PI, matS, '#1d4e8c');
  arrow('E', Math.PI / 2, matEW, '#344052');
  arrow('W', -Math.PI / 2, matEW, '#344052');
  group.position.set(-MODULE_L / 2 - 0.85, 0, MODULE_D / 2 + 0.9);
  return group;
}

export function buildModulePanels() {
  const panels = new THREE.Group();
  panels.name = 'modulePanels';
  const frameInset = 0.035;
  const zNorth = MODULE_NORTH_Z + PANEL_DEPTH / 2 + frameInset;
  const zSouth = MODULE_SOUTH_Z - PANEL_DEPTH / 2 - frameInset;
  const representativeSouthX = 0.72;

  const northXs = [0.95, 2.30];
  for (const x of northXs) {
    const { group } = buildPanel();
    group.position.set(x, MODULE_PANEL_Y, zNorth);
    panels.add(group);
  }

  const start = -2.20;
  for (let i = 0; i < 4; i++) {
    const x = start + i * 1.46;
    if (Math.abs(x - representativeSouthX) < 0.08) continue;
    const { group } = buildPanel();
    group.position.set(x, MODULE_PANEL_Y, zSouth);
    group.rotation.y = Math.PI;
    panels.add(group);
  }

  return panels;
}

export function representativeSouthPanelTransform() {
  return {
    x: 0.72,
    y: MODULE_PANEL_Y,
    z: MODULE_SOUTH_Z - PANEL_DEPTH / 2 - 0.035,
    rotationY: Math.PI,
  };
}

export function moduleDimensionsText() {
  return `${MODULE_L.toFixed(2)} m L x ${MODULE_D.toFixed(2)} m D x ${MODULE_H.toFixed(2)} m H`;
}
