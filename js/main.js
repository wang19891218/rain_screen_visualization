// js/main.js — scene assembly, controls, UI and render loop.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  BG_COLOR, MODULE_PANEL_Y, MODULE_SOUTH_Z, PANEL_DEPTH,
} from './config.js';
import { buildGround, makeTextSprite } from './geometry.js';
import { buildModuleShell } from './moduleGeometry.js';
import { createPanelWithSensors } from './panelAssembly.js';
import { getSensorRecords, pickSensor, setSensorLabels } from './sensors.js';
import { tween } from './animations.js';

const canvas = document.getElementById('scene');

let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  if (!renderer || !renderer.getContext()) throw new Error('no webgl');
} catch (e) {
  renderer = null;
}
window._webglOK = !!renderer;

if (!renderer) {
  document.body.innerHTML =
    '<p style="font-family:system-ui,sans-serif;color:#1d2733;padding:28px;font-size:15px">' +
    'This visualization requires a WebGL-capable browser.</p>';
} else {
  start(renderer);
}

// size a billboard text sprite to a target world width
function sizeLabel(sp, worldWidth) {
  const img = sp.material.map.image;
  sp.scale.set(worldWidth, worldWidth * img.height / img.width, 1);
  return sp;
}

async function start(renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG_COLOR);

  const camera = new THREE.PerspectiveCamera(
    46, window.innerWidth / window.innerHeight, 0.1, 200);
  const camStart = { x: 2.55, y: 1.95, z: -4.05 };
  const camTarget = { x: 0.0, y: MODULE_PANEL_Y, z: MODULE_SOUTH_Z - 0.12 };
  camera.position.set(camStart.x, camStart.y, camStart.z);

  // ---- lights : strong raking key light makes the rib relief read ----
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd2d6da, 0.50));
  scene.add(new THREE.AmbientLight(0xffffff, 0.14));
  const sun = new THREE.DirectionalLight(0xfff2dc, 2.0);
  sun.position.set(8.5, 6.5, 5.5);          // high X => rakes across vertical ribs
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 46;
  sun.shadow.camera.left = -9;
  sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 9;
  sun.shadow.camera.bottom = -9;
  sun.shadow.bias = -0.0009;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdfe8f2, 0.35);
  fill.position.set(-7, 3, -4);
  scene.add(fill);

  // ---- geometry ----
  scene.add(buildGround());
  scene.add(buildModuleShell({ opacity: 0.25, includeOpenings: true }));
  const { group: panelGroup, panelMesh } = await createPanelWithSensors();
  panelGroup.name = 'singleSouthPanel';
  panelGroup.position.set(0, MODULE_PANEL_Y, MODULE_SOUTH_Z - PANEL_DEPTH / 2 - 0.035);
  panelGroup.rotation.y = Math.PI;
  scene.add(panelGroup);

  // ---- EXTERIOR / INTERIOR side labels (spatially separated) ----
  const extLabel = makeTextSprite('EXTERIOR (weather side)',
    { fontSize: 46, color: '#9a4a10', border: '#e07a1c' });
  sizeLabel(extLabel, 0.92);
  extLabel.position.set(-1.05, 1.45, PANEL_DEPTH / 2 + 0.36);
  panelGroup.add(extLabel);

  const intLabel = makeTextSprite('INTERIOR (building side)',
    { fontSize: 46, color: '#1d4e8c', border: '#2f74d0' });
  sizeLabel(intLabel, 0.92);
  intLabel.position.set(1.05, -1.02, -PANEL_DEPTH / 2 - 0.36);
  panelGroup.add(intLabel);

  // ---- controls ----
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;
  controls.minDistance = 2.6;
  controls.maxDistance = 22;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(camTarget.x, camTarget.y, camTarget.z);
  controls.update();

  // ---- UI ----
  const $ = (id) => document.getElementById(id);
  const info = $('info');
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function sideLabel(side) {
    return side === 'exterior' ? 'Exterior / weather-facing face' : 'Interior / building-side face';
  }

  function showSensorInfo(sensor) {
    $('info-dot').style.background = '#' + sensor.color.toString(16).padStart(6, '0');
    $('info-id').textContent = sensor.id;
    $('info-label').textContent = sensor.label;
    $('info-side').textContent = sideLabel(sensor.side);
    $('info-pos').textContent =
      `x ${sensor.position.x.toFixed(3)} m, y ${sensor.position.y.toFixed(3)} m`;
    $('info-measures').textContent = 'Measures: wind speed, humidity, temperature.';
    info.classList.add('show');
  }

  function handlePointerDown(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const sensor = pickSensor(raycaster);
    if (sensor) {
      controls.autoRotate = false;
      showSensorInfo(sensor);
    }
  }

  renderer.domElement.addEventListener('pointerdown', handlePointerDown);
  $('info-close')?.addEventListener('click', () => info.classList.remove('show'));

  $('btn-reset')?.addEventListener('click', () => {
    const fp = camera.position.clone(), ft = controls.target.clone();
    controls.autoRotate = false;
    tween({
      from: { px: fp.x, py: fp.y, pz: fp.z, tx: ft.x, ty: ft.y, tz: ft.z },
      to:   { px: camStart.x, py: camStart.y, pz: camStart.z,
              tx: camTarget.x, ty: camTarget.y, tz: camTarget.z },
      onUpdate: (c) => {
        camera.position.set(c.px, c.py, c.pz);
        controls.target.set(c.tx, c.ty, c.tz);
        controls.update();
      },
      onComplete: () => { controls.autoRotate = true; },
    });
  });

  let ghosted = false;
  $('btn-ghost')?.addEventListener('click', () => {
    ghosted = !ghosted;
    panelMesh.material.transparent = ghosted;
    panelMesh.material.opacity = ghosted ? 0.32 : 1.0;
    panelMesh.material.depthWrite = !ghosted;
    panelMesh.material.needsUpdate = true;
    $('btn-ghost').classList.toggle('on', ghosted);
  });

  let labelsOn = false;
  $('btn-labels')?.addEventListener('click', () => {
    labelsOn = !labelsOn;
    setSensorLabels(labelsOn);
    $('btn-labels').classList.toggle('on', labelsOn);
  });

  const refImg = $('ref-image');
  $('btn-ref')?.addEventListener('click', () => {
    const on = refImg.classList.toggle('show');
    $('btn-ref').classList.toggle('on', on);
  });

  // ---- resize ----
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---- verification helper ----
  window._setView = (px, py, pz, tx, ty, tz) => {
    controls.autoRotate = false;
    camera.position.set(px, py, pz);
    controls.target.set(tx, ty, tz);
    controls.update();
  };
  window._showSensor = (id = 'EXT-05') => {
    const records = getSensorRecords();
    const target = records.find(s => s.id === id) || records[0];
    if (target) showSensorInfo(target);
  };

  // ---- render loop ----
  let frames = 0;
  function loop() {
    requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
    frames++;
    window._frames = frames;
  }
  window._getFrameCount = () => frames;
  window._sceneReady = true;
  loop();
}
