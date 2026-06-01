// js/config.js — all tunable constants for the rain screen visualization.
// Units: metres (Three.js world unit). One inch = 0.0254 m.

export const INCH = 0.0254;

// ----------------------------------------------------------------------
// Panel — ONE single 4 ft x 8 ft rain screen test panel
// ----------------------------------------------------------------------
export const PANEL_W_IN   = 48;                       // panel width  (in)
export const PANEL_H_IN   = 96;                       // panel height (in)
export const PANEL_W      = PANEL_W_IN * INCH;        // 1.2192 m
export const PANEL_H      = PANEL_H_IN * INCH;        // 2.4384 m

// Trapezoidal vertical corrugation
export const PITCH_IN     = 6;                        // rib pitch (in)
export const PITCH        = PITCH_IN * INCH;          // 0.1524 m
export const N_RIBS       = 8;                        // 8 ribs across 48 in
export const RIB_DEPTH_IN = 1.5;                      // peak-to-valley (in)
export const RIB_DEPTH    = RIB_DEPTH_IN * INCH;      // 0.0381 m
export const SHEET_T      = 0.55 * INCH;              // panel sheet thickness

// Each 6 in pitch = flat valley / sloped web / flat crown / sloped web,
// four equal 1.5 in segments. PANEL_DEPTH is the valley-back to crown-front
// envelope of the corrugated sheet.
export const PANEL_DEPTH  = RIB_DEPTH + SHEET_T;      // 0.0521 m

// ----------------------------------------------------------------------
// PACCAR/WSU NET module shell, extracted from STEP dominant shell solids.
// Axes: X = module length, Y = height, Z = north/south depth.
// ----------------------------------------------------------------------
export const MODULE_L = 5.986;                        // m, long east-west axis
export const MODULE_D = 3.363;                        // m, north-south depth
export const MODULE_H = 2.896;                        // m, floor to roof top
export const MODULE_WALL_T = 0.10;                    // visual shell thickness
export const MODULE_ROOF_RISE = 0.035;                // very low roof crown
export const MODULE_NORTH_Z = MODULE_D / 2;
export const MODULE_SOUTH_Z = -MODULE_D / 2;
export const MODULE_PANEL_Y = 1.34;                   // panel center height

// Legacy panel-view mounting plane.
export const WALL_HALF_W  = 2.6;
export const WALL_H       = 3.0;
export const DEPTH_HALF   = 2.0;
export const GABLE_RISE   = 1.5;
export const RIDGE_Y      = WALL_H + GABLE_RISE;
export const FRONT_WALL_Z = 2.0;
export const PANEL_CENTER_Y = 1.5;

// ----------------------------------------------------------------------
// Sensors — 12 total, all wind-speed + humidity + temperature
// ----------------------------------------------------------------------
export const SENSOR_RADIUS   = 0.058;                 // marker head radius
export const SENSOR_STANDOFF = 0.052;                 // head centre proud of panel
export const EXT_COLOR = 0xe07a1c;                    // orange — exterior
export const INT_COLOR = 0x2f74d0;                    // blue   — interior

// World z of the panel surfaces and the sensor marker centres
export const PANEL_FRONT_Z = FRONT_WALL_Z + PANEL_DEPTH / 2;   // weather face
export const PANEL_BACK_Z  = FRONT_WALL_Z - PANEL_DEPTH / 2;   // building face
export const EXT_SENSOR_Z  = PANEL_FRONT_Z + SENSOR_STANDOFF;
export const INT_SENSOR_Z  = PANEL_BACK_Z  - SENSOR_STANDOFF;

// ----------------------------------------------------------------------
// Theme & camera (LIGHT theme)
// ----------------------------------------------------------------------
export const BG_COLOR     = 0xeef1f4;
export const GROUND_COLOR = 0xe4e7ea;

export const CAM_START  = { x: 3.9, y: 2.45, z: 5.85 };
export const CAM_TARGET = { x: 0.0, y: 1.45, z: 1.35 };
