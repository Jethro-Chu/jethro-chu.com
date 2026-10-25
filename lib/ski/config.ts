/**
 * Central gameplay tuning configuration for "Wok This Slope"
 */

export const SKI_CONFIG = {
  // Course parameters
  COURSE: {
    SEED: 42077,            // Reproducible deterministic course generation
    LENGTH_METERS: 950,     // Total downhill distance to finish line
    FINISH_RUNOUT: 80,      // Deceleration zone after finish line before table
    WIDTH_METERS: 28,       // Navigable slope corridor width
    BASE_SLOPE_DEG: 11.5,   // Average downhill pitch (degrees)
    TARGET_TIME_SEC: 75.0,  // Target time for S-Rank (60-90s window)
  },

  // Skier movement physics
  SKIER: {
    MAX_SPEED_MPS: 16.5,    // Max downhill speed (~60 km/h)
    MIN_SPEED_MPS: 3.5,     // Minimum cruising speed
    ACCEL_MPS2: 4.8,        // Downhill acceleration
    DRAG_COEFF: 0.28,       // Air drag
    TURN_SPEED: 26.0,       // Lateral steering responsiveness
    TURN_INERTIA: 0.12,     // Steering smoothing factor
    BANKING_FACTOR: 0.18,   // Camera & skier roll when turning
    BUMP_FREQUENCY: 35.0,   // Frequency of terrain rolls
    BUMP_AMPLITUDE: 0.45,   // Height of moguls / rolls (meters)
    HEAD_ON_CRASH_SPEED: 11.5, // Speed threshold for fatal tree crash
  },

  // Frying pan & rig dimensions
  PAN: {
    RADIUS: 0.26,           // Pan radius in meters (diameter 52 cm wok)
    DEPTH: 0.075,           // Rim height in meters (7.5 cm)
    CURVATURE_A: 1.1,       // Parabolic curvature coefficient: y = a * r^2
    MAX_PITCH_RAD: 0.48,    // Max mouse forward/back tilt (~27 degrees)
    MAX_ROLL_RAD: 0.52,     // Max mouse lateral tilt (~30 degrees)
    TILT_LERP: 0.18,        // Mouse follow smoothing
    TOSS_DURATION_SEC: 0.42,// Duration of a full spacebar toss animation
    TOSS_IMPULSE_VY: 2.2,   // Upward velocity given to rice during toss
    TOSS_COOLDOWN_SEC: 0.65,// Minimum cooldown between tosses
  },

  // Rice simulation physics (300 grains)
  RICE: {
    GRAIN_COUNT: 300,       // Strict initial count
    GRAIN_LENGTH: 0.016,    // Elongated grain dimensions (16mm x 6mm)
    GRAIN_RADIUS: 0.0035,
    MASS: 0.0004,           // 0.4 grams per grain
    RESTITUTION: 0.15,      // Low bounciness against pan surface
    FRICTION_COEFF: 0.32,   // Surface sliding friction
    SEPARATION_RADIUS: 0.015,// Grain-to-grain repulsion radius
    SEPARATION_STRENGTH: 0.45, // Repulsion force strength
    GRAVITY: 9.81,          // World gravity m/s^2
    SUBSTEPS: 2,            // Simulation substeps per frame for stability
    FIXED_DT: 1 / 60,       // Fixed simulation timestep
  },

  // Cooking model
  COOKING: {
    BURNER_RADIUS: 0.11,    // Radius of hot center on pan bottom (11 cm)
    COOK_RATE: 0.026,       // Doneness per second on full heat (~40-45s to cook)
    RIM_COOK_FACTOR: 0.18,  // Residual heat conducted towards rim
    BURN_RATE: 0.045,       // Burn rate per second once doneness exceeds threshold
    BURN_START_DONENESS: 0.90, // When doneness >= 90%, burning starts if left on heat
    TOSS_COOLING_FACTOR: 0.4,  // Heat dissipation when tossed into the air
    MAX_ALLOWABLE_BURN: 0.38,  // >= 38% avg burn ruins the entire batch (D-rank failure)
    WARNING_BURN_THRESHOLD: 0.12, // HUD alert when burn risk climbs above 12%
  },

  // Plating phase & Plate dimensions
  PLATING: {
    PLATE_RADIUS: 0.34,     // Serving plate radius (68 cm grand banquet platter)
    PLATE_HEIGHT: 0.04,     // Rim lip of the plate
    AUTO_FINISH_DELAY_SEC: 8.0, // Finish plating automatically if idle
    TILT_SENSITIVITY: 1.4,  // Pan tilt sensitivity during plating
  },

  // Scoring criteria
  SCORING: {
    S_RANK: {
      MIN_PLATED_PERCENT: 85,  // At least 85% (>= 255 grains)
      MIN_DONENESS_PERCENT: 95, // At least 95% avg doneness
      MAX_BURN_PERCENT: 5,     // No more than 5% avg burn
      MAX_TIME_SEC: 80.0,      // Within target time window
    },
    A_RANK: {
      MIN_PLATED_PERCENT: 70,  // >= 210 grains
      MIN_DONENESS_PERCENT: 85,
      MAX_BURN_PERCENT: 10,
    },
    B_RANK: {
      MIN_PLATED_PERCENT: 50,  // >= 150 grains
      MIN_DONENESS_PERCENT: 70,
      MAX_BURN_PERCENT: 20,
    },
    C_RANK: {
      MIN_PLATED_PERCENT: 25,  // >= 75 grains
      MIN_DONENESS_PERCENT: 50,
      MAX_BURN_PERCENT: 30,
    },
  },

  // Visual Colors for Rice cooking progression
  COLORS: {
    RAW_RICE: 0xf5f0e1,        // Creamy pearly white
    HALF_COOKED: 0xf6d88c,     // Golden buttery tone
    COOKED_RICE: 0xe5a332,     // Deep golden fried rice
    OVERCOOKED: 0x874718,      // Roasted brown
    BURNT_RICE: 0x221812,      // Scorched charcoal
    PAN_METAL: 0x2a2d32,       // Seasoned carbon steel / cast iron
    PAN_RIM: 0x5a6068,         // Brushed steel lip
    BURNER_FLAME: 0x3b82f6,    // Comical blue camping flame core
    BURNER_TIP: 0xf97316,      // Orange flame tip
  },
} as const;
