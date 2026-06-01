// js/module-view.js - PACCAR/WSU NET module view.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import {
  BG_COLOR, GROUND_COLOR, MODULE_D, MODULE_H, MODULE_L, MODULE_PANEL_Y,
  MODULE_SOUTH_Z, PANEL_H, PANEL_W,
} from './config.js';
import { buildGround } from './geometry.js';
import {
  buildCompass, buildModulePanels, buildModuleShell, moduleDimensionsText,
  representativeSouthPanelTransform, setModuleShellOpacity,
} from './moduleGeometry.js';
import { createPanelWithSensors } from './panelAssembly.js';
import { tween } from './animations.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
window._webglOK = !!renderer.getContext();

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.className = 'label-layer';
document.body.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG_COLOR);

const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 100);
const camStart = { x: 5.7, y: 3.45, z: -5.25 };
const camTarget = { x: 0.15, y: MODULE_H * 0.52, z: 0.0 };
camera.position.set(camStart.x, camStart.y, camStart.z);

scene.add(new THREE.HemisphereLight(0xffffff, 0xd6d2c8, 0.58));
scene.add(new THREE.AmbientLight(0xffffff, 0.22));
const sun = new THREE.DirectionalLight(0xfff0d8, 2.1);
sun.position.set(-4.5, 7.2, 5.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -8;
sun.shadow.camera.right = 8;
sun.shadow.camera.top = 8;
sun.shadow.camera.bottom = -8;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xdde8f6, 0.55);
fill.position.set(4, 3, -5);
scene.add(fill);

const ground = buildGround();
ground.children[0].material.color.setHex(GROUND_COLOR);
scene.add(ground);

const moduleShell = buildModuleShell({ opacity: 0.78, includeOpenings: true });
scene.add(moduleShell);
const modulePanels = buildModulePanels();
scene.add(modulePanels);
const representativePanel = await createPanelWithSensors();
representativePanel.group.name = 'representativeSouthPanelWithSensors';
const repTransform = representativeSouthPanelTransform();
representativePanel.group.position.set(repTransform.x, repTransform.y, repTransform.z);
representativePanel.group.rotation.y = repTransform.rotationY;
scene.add(representativePanel.group);
scene.add(buildCompass());
const dimensionsGroup = buildDimensionsGroup();
dimensionsGroup.visible = false;
scene.add(dimensionsGroup);

document.getElementById('module-dims').textContent =
  `STEP shell: ${moduleDimensionsText()} · north: 2 panels · south: 4 panels`;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.32;
controls.minDistance = 3.0;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(camTarget.x, camTarget.y, camTarget.z);
controls.update();

const $ = (id) => document.getElementById(id);
$('btn-reset')?.addEventListener('click', () => {
  const fp = camera.position.clone();
  const ft = controls.target.clone();
  controls.autoRotate = false;
  tween({
    from: { px: fp.x, py: fp.y, pz: fp.z, tx: ft.x, ty: ft.y, tz: ft.z },
    to: { px: camStart.x, py: camStart.y, pz: camStart.z, tx: camTarget.x, ty: camTarget.y, tz: camTarget.z },
    onUpdate: (v) => {
      camera.position.set(v.px, v.py, v.pz);
      controls.target.set(v.tx, v.ty, v.tz);
      controls.update();
    },
    onComplete: () => { controls.autoRotate = true; },
  });
});

$('alpha-slider')?.addEventListener('input', (event) => {
  const pct = Number(event.target.value);
  $('alpha-value').textContent = `${pct}%`;
  setModuleShellOpacity(moduleShell, pct / 100);
});

$('btn-panels')?.addEventListener('click', (event) => {
  modulePanels.visible = !modulePanels.visible;
  representativePanel.group.visible = modulePanels.visible;
  event.currentTarget.classList.toggle('on', modulePanels.visible);
});
$('btn-sensors')?.addEventListener('click', (event) => {
  const visible = !representativePanel.sensorRecords[0].group.visible;
  representativePanel.setSensorsVisible(visible);
  event.currentTarget.classList.toggle('on', visible);
});
$('chk-dimensions')?.addEventListener('change', (event) => {
  dimensionsGroup.visible = event.currentTarget.checked;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

window._setView = (px, py, pz, tx, ty, tz) => {
  controls.autoRotate = false;
  camera.position.set(px, py, pz);
  controls.target.set(tx, ty, tz);
  controls.update();
};

let frames = 0;
function loop() {
  requestAnimationFrame(loop);
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  frames++;
  window._frames = frames;
}

window._moduleDims = { length: MODULE_L, depth: MODULE_D, height: MODULE_H };
window._sensorCount = representativePanel.sensorRecords.length;
window._modulePanelCount = 6;
window._moduleShellReady = true;
window._sceneReady = true;
window._getFrameCount = () => frames;
loop();

function feetInches(m) {
  const totalIn = Math.round(m / 0.0254);
  const ft = Math.floor(totalIn / 12);
  const inch = totalIn % 12;
  return `${ft}'-${inch}"`;
}

function makeDimLabel(text, position) {
  const el = document.createElement('div');
  el.className = 'dimension-label';
  el.textContent = text;
  const obj = new CSS2DObject(el);
  obj.position.copy(position);
  return obj;
}

function addLine(group, points, color = 0x263241) {
  const flat = [];
  for (const p of points) flat.push(p.x, p.y, p.z);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(flat, 3));
  const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.92 }));
  group.add(line);
  return line;
}

function addArrow(group, position, direction) {
  const mat = new THREE.MeshBasicMaterial({ color: 0x263241 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 16), mat);
  const dir = direction.clone().normalize();
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  cone.position.copy(position);
  group.add(cone);
}

function addDimension(group, start, end, extA, extB, label, labelOffset = new THREE.Vector3(0, 0.08, 0)) {
  addLine(group, [start, end, extA, start, extB, end]);
  const dir = end.clone().sub(start).normalize();
  addArrow(group, start.clone().add(dir.clone().multiplyScalar(0.08)), dir.clone().multiplyScalar(-1));
  addArrow(group, end.clone().add(dir.clone().multiplyScalar(-0.08)), dir);
  group.add(makeDimLabel(label, start.clone().add(end).multiplyScalar(0.5).add(labelOffset)));
}

function addPanelDimension(group) {
  const x = -2.20;
  const y0 = MODULE_PANEL_Y - PANEL_H / 2;
  const y1 = MODULE_PANEL_Y + PANEL_H / 2;
  const x0 = x - PANEL_W / 2;
  const x1 = x + PANEL_W / 2;
  const z = MODULE_SOUTH_Z - 0.34;
  addLine(group, [
    new THREE.Vector3(x0, y0, z), new THREE.Vector3(x1, y0, z),
    new THREE.Vector3(x1, y0, z), new THREE.Vector3(x1, y1, z),
    new THREE.Vector3(x1, y1, z), new THREE.Vector3(x0, y1, z),
    new THREE.Vector3(x0, y1, z), new THREE.Vector3(x0, y0, z),
    new THREE.Vector3(x1, y1, z), new THREE.Vector3(x1 + 0.36, y1 + 0.28, z - 0.05),
  ]);
  group.add(makeDimLabel(
    `Panel 4'-0" x 8'-0" (${PANEL_W.toFixed(2)} m x ${PANEL_H.toFixed(2)} m)`,
    new THREE.Vector3(x1 + 0.75, y1 + 0.38, z - 0.08),
  ));
}

function buildDimensionsGroup() {
  const group = new THREE.Group();
  group.name = 'moduleDimensions';
  const halfL = MODULE_L / 2;
  const halfD = MODULE_D / 2;
  const zDim = MODULE_SOUTH_Z - 0.62;
  const yDim = 0.12;

  addDimension(
    group,
    new THREE.Vector3(-halfL, yDim, zDim),
    new THREE.Vector3(halfL, yDim, zDim),
    new THREE.Vector3(-halfL, 0, -halfD),
    new THREE.Vector3(halfL, 0, -halfD),
    `${feetInches(MODULE_L)} (${MODULE_L.toFixed(2)} m)`,
  );
  addDimension(
    group,
    new THREE.Vector3(-halfL - 0.52, MODULE_H + 0.22, -halfD),
    new THREE.Vector3(-halfL - 0.52, MODULE_H + 0.22, halfD),
    new THREE.Vector3(-halfL, MODULE_H, -halfD),
    new THREE.Vector3(-halfL, MODULE_H, halfD),
    `${feetInches(MODULE_D)} (${MODULE_D.toFixed(2)} m)`,
    new THREE.Vector3(-0.12, 0.12, 0),
  );
  addDimension(
    group,
    new THREE.Vector3(halfL + 0.42, 0, MODULE_SOUTH_Z - 0.35),
    new THREE.Vector3(halfL + 0.42, MODULE_H, MODULE_SOUTH_Z - 0.35),
    new THREE.Vector3(halfL, 0, MODULE_SOUTH_Z),
    new THREE.Vector3(halfL, MODULE_H, MODULE_SOUTH_Z),
    `${feetInches(MODULE_H)} (${MODULE_H.toFixed(2)} m)`,
  );
  addPanelDimension(group);
  return group;
}
