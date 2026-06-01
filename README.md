# Rain Screen Visualization

Static Three.js visualization of the WSU NET/PACCAR module and rain screen test panel.

## What It Shows

- **Module view** (`index.html`): STEP-derived PACCAR module shell, approximately **5.986 m L x 3.363 m D x 2.896 m H**, with 2 rain-screen panels on the north wall, 4 panels on the south wall, an opacity slider, panel/sensor toggles, and a compass.
- **Panel view** (`panel.html`): one **4 ft x 8 ft** OSB rain screen panel with trapezoidal vertical corrugations and the 12-sensor pattern.
- Every sensor measures wind speed, humidity, and temperature.

## Run Locally

```bash
python3 -m http.server 8081
```

Then open `http://localhost:8081/`.

No build step is required. The site uses vendored Three.js modules under `vendor/three/` and relative paths only.

## Controls

- Top navigation switches between **Module** and **Panel**.
- Module view: shell opacity slider, reset view, panel toggle, sensor toggle.
- Panel view: reset view, panel transparency, sensor labels, design drawing overlay.

In panel view, click any sensor marker to open the sensor information panel.

## `data/sensors.json` Schema

Sensor positions are editable in `data/sensors.json`. Coordinates are in metres, relative to the centre of the 4 ft x 8 ft panel.

```json
{
  "id": "EXT-05",
  "label": "Exterior centre",
  "side": "exterior",
  "x": 0.0,
  "y": 0.0
}
```

Fields:

- `id`: unique sensor ID shown on labels and in the info panel.
- `label`: human-readable label.
- `side`: either `exterior` or `interior`.
- `x`: horizontal position in metres, positive to the right.
- `y`: vertical position in metres, positive upward.

The visualization computes the correct front/back offset from `side`, so sensor data authors only edit face coordinates.
