# Rain Screen Panel 3D Visualization

Static Three.js visualization of a single rain screen mock-up panel mounted on a transparent house context.

## What It Shows

- One **4 ft x 8 ft** rain screen panel, modeled as **48 in wide x 96 in high**.
- Real trapezoidal vertical corrugation geometry: **6 in pitch**, **8 ribs across the panel**, approximately **1.5 in peak-to-valley depth**.
- Matte, low-reflectivity OSB-style material with a subtle procedural wood-strand texture.
- A semi-transparent gable-roof house shell so exterior and interior sides are both readable.
- **12 clickable sensors**:
  - 9 exterior sensors in a 3 x 3 grid on the weather-facing surface.
  - 3 interior sensors in a centered vertical column on the building-side surface.
  - Every sensor measures wind speed, humidity, and temperature.

## Run Locally

```bash
python3 -m http.server 8081
```

Then open `http://localhost:8081/`.

No build step is required. The site uses vendored Three.js modules under `vendor/three/` and relative paths only.

## Controls

- **Reset view** returns the camera to the default exterior perspective.
- **Ghost the panel** makes the OSB panel semi-transparent so the interior sensors are easier to see.
- **Sensor labels** toggles 3D sensor ID labels.
- **Design drawing** toggles the CAD reference image overlay.

Click any sensor marker to open the sensor information panel.

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
