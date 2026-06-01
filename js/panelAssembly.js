// js/panelAssembly.js - shared corrugated panel + 12-sensor assembly.

import { buildPanel } from './geometry.js';
import { loadSensors } from './sensors.js';

export async function createPanelWithSensors() {
  const { group, panelMesh } = buildPanel();
  const sensorRecords = await loadSensors(group);

  function setSensorsVisible(visible) {
    for (const sensor of sensorRecords) {
      sensor.group.visible = visible;
      sensor.labelSprite.visible = visible && sensor.labelSprite.visible;
    }
  }

  return { group, panelMesh, sensorRecords, setSensorsVisible };
}
