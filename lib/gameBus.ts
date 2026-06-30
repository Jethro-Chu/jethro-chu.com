/* ============================================================
   gameBus  ·  the React <-> Phaser bridge (§4)
   A tiny typed singleton event bus. No state library, no deps.
   Phaser emits world events; React listens and drives the DOM
   (minimap, discovered HUD, interior rooms). React emits control
   events back (pause / resume / travel / zoom).
   ============================================================ */

export interface ValleyEventMap {
  /** the Phaser scene has booted and is ready */
  "game:ready": void;
  /** the player walked into a landmark trigger zone (opens the interior room) */
  "landmark:enter": { id: string };
  /** a landmark was discovered for the first time (HUD/minimap) */
  "landmark:discovered": { id: string };
  /** player world position, for the minimap (throttled by the scene) */
  "player:move": { x: number; y: number };
  /** React -> Phaser: pause (an interior room opened) */
  "game:pause": void;
  /** React -> Phaser: resume (the room closed) */
  "game:resume": void;
  /** entrance affordance -> ValleyDoor: open the full-screen overlay */
  "valley:open": void;
  /** nav / minimap -> scene: travel the player + camera to a landmark */
  "valley:goto": { id: string };
  /** intro "PLAY" -> scene: leave the title screen, hand the player control */
  "valley:play": void;
  /** zoom buttons -> scene: step the camera zoom level (+1 in / -1 out) */
  "valley:zoom": { dir: number };
  /** scene -> HUD: player is standing on a door (id) or has left it (null) —
   *  drives the "Enter?" confirmation prompt. Entry is a CHOICE, never automatic. */
  "valley:near": { id: string | null };
  /** scene -> HUD: viewport (CSS px) anchor for the "Enter?" prompt — the point
   *  just above the hiker's head at the doorway. Emitted each frame while near a
   *  door so the prompt floats over the entrance as the camera moves. */
  "valley:nearpos": { x: number; y: number };
  /** "Enter?" prompt / Enter key -> scene: enter the door the player is on */
  "valley:enter": void;
}

type EventKey = keyof ValleyEventMap;
type Handler<K extends EventKey> = (payload: ValleyEventMap[K]) => void;
type AnyHandler = (payload: unknown) => void;

class GameBus {
  // uniform internal store; the public methods keep the per-event typing
  private handlers: Partial<Record<EventKey, Set<AnyHandler>>> = {};

  on<K extends EventKey>(event: K, handler: Handler<K>): () => void {
    const set = (this.handlers[event] ??= new Set<AnyHandler>());
    set.add(handler as AnyHandler);
    return () => this.off(event, handler);
  }

  off<K extends EventKey>(event: K, handler: Handler<K>): void {
    this.handlers[event]?.delete(handler as AnyHandler);
  }

  emit<K extends EventKey>(
    event: K,
    ...args: ValleyEventMap[K] extends void ? [] : [ValleyEventMap[K]]
  ): void {
    const payload = args[0] as unknown;
    this.handlers[event]?.forEach((h) => {
      try {
        h(payload);
      } catch (err) {
        // a listener throwing must not take down the emitter or the game loop
        console.error(`[gameBus] handler for "${event}" threw`, err);
      }
    });
  }

  clear(): void {
    this.handlers = {};
  }
}

/** module-singleton: same instance for React and the Phaser scene */
export const gameBus = new GameBus();

// dev-only debug handle (stripped from production) for driving the bridge in tests
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __valleyBus?: GameBus }).__valleyBus = gameBus;
}
