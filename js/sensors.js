// js/sensors.js — editable JSON-driven sensor markers and picking.

import * as THREE from 'three';
import {
  EXT_COLOR, INT_COLOR, PANEL_DEPTH, SENSOR_RADIUS, SENSOR_STANDOFF,
} from './config.js';
import { makeTextSprite } from './geometry.js';

const MEASURES = ['wind speed', 'humidity', 'temperature'];

const markerObjects = [];
const sensorRecords = [];

function makeMarker(side) {
  const isExterior = side === 'exterior';
  const color = isExterior ? EXT_COLOR : INT_COLOR;
  const group = new THREE.Group();
  group.name = `${side}SensorMarker`;

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(SENSOR_RADIUS, 24, 16),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.24,
      roughness: 0.48,
      metalness: 0.0,
    }),
  );
  sphere.name = `${side}SensorPickMesh`;
  sphere.castShadow = true;
  group.add(sphere);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(SENSOR_RADIUS * 1.45, SENSOR_RADIUS * 0.12, 8, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.renderOrder = 20;
  group.add(ring);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(SENSOR_RADIUS * 0.22, SENSOR_RADIUS * 0.22, SENSOR_STANDOFF * 1.25, 10),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7, metalness: 0.0 }),
  );
  stem.rotation.x = Math.PI / 2;
  stem.position.z = isExterior ? -SENSOR_STANDOFF * 0.42 : SENSOR_STANDOFF * 0.42;
  group.add(stem);

  return { group, sphere };
}

function normalizeSensor(raw) {
  const side = raw.side || raw.location;
  if (side !== 'exterior' && side !== 'interior') {
    throw new Error(`Invalid sensor side for ${raw.id}: ${side}`);
  }
  return {
    id: raw.id,
    label: raw.label || raw.id,
    side,
    x: Number(raw.x ?? raw.position?.x),
    y: Number(raw.y ?? raw.position?.y),
    measures: raw.measures || MEASURES,
  };
}

export async function loadSensors(parent) {
  const response = await fetch('./data/sensors.json');
  if (!response.ok) throw new Error(`Could not load data/sensors.json: ${response.status}`);

  const data = await response.json();
  for (const raw of data.map(normalizeSensor)) {
    const z = raw.side === 'exterior'
      ? PANEL_DEPTH / 2 + SENSOR_STANDOFF
      : -PANEL_DEPTH / 2 - SENSOR_STANDOFF;
    const color = raw.side === 'exterior' ? EXT_COLOR : INT_COLOR;
    const { group, sphere } = makeMarker(raw.side);
    group.position.set(raw.x, raw.y, z);
    group.userData.sensor = raw;
    sphere.userData.sensor = raw;

    const labelSprite = makeTextSprite(raw.id, {
      fontSize: 34,
      padding: 14,
      color: '#ffffff',
      bg: raw.side === 'exterior' ? 'rgba(178,86,18,0.96)' : 'rgba(34,96,174,0.96)',
      border: raw.side === 'exterior' ? '#e07a1c' : '#2f74d0',
      scale: 0.0022,
    });
    labelSprite.position.set(raw.x, raw.y + SENSOR_RADIUS * 1.8, z + (raw.side === 'exterior' ? 0.03 : -0.03));
    labelSprite.visible = false;
    labelSprite.renderOrder = 30;

    parent.add(group, labelSprite);
    markerObjects.push(sphere);
    sensorRecords.push({ ...raw, color, group, sphere, labelSprite, position: { x: raw.x, y: raw.y, z } });
  }

  window._sensorCount = sensorRecords.length;
  return sensorRecords;
}

export function getSensorRecords() {
  return sensorRecords;
}

export function setSensorLabels(visible) {
  for (const sensor of sensorRecords) sensor.labelSprite.visible = visible;
}

export function pickSensor(raycaster) {
  const hits = raycaster.intersectObjects(markerObjects, false);
  if (!hits.length) return null;
  const hit = hits[0].object;
  return sensorRecords.find(sensor => sensor.sphere === hit) || null;
}
