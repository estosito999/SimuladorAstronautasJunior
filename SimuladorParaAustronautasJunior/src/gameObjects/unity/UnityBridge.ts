import type {
  UnityCameraCommand,
  UnityFlightControlState,
  UnityISSState,
  UnityMessage,
  UnityRoverTelemetry,
  UnityBaseStationState,
} from './unityContracts';

type MessageHandler = (payload: any) => void;

/**
 * Puente de comunicación bidireccional entre la aplicación web y Unity WebGL.
 * Permite enviar mensajes a GameObjects en Unity mediante `unityInstance.SendMessage`
 * y recibir eventos desde scripts C# mediante `window.dispatchUnityMessage`.
 */
export class UnityBridgeService {
  private static instance: UnityBridgeService | null = null;
  private unityInstance: any = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();

  private constructor() {
    this.setupGlobalHandlers();
  }

  public static getInstance(): UnityBridgeService {
    if (!UnityBridgeService.instance) {
      UnityBridgeService.instance = new UnityBridgeService();
    }
    return UnityBridgeService.instance;
  }

  /**
   * Vincula los handlers globales en `window` para que Unity WebGL (.jslib)
   * pueda invocar métodos de forma nativa sin generar excepciones.
   */
  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    const win = window as any;

    // Registra la instancia del puente en window
    win.UnityBridge = this;

    // Handler global estándar para llamadas desde Unity
    win.dispatchUnityMessage = (jsonStringOrObj: string | UnityMessage) => {
      try {
        const message: UnityMessage =
          typeof jsonStringOrObj === 'string'
            ? JSON.parse(jsonStringOrObj)
            : jsonStringOrObj;
        this.receiveFromUnity(message);
      } catch (err) {
        console.warn('[UnityBridge] Error procesando mensaje de Unity:', err);
      }
    };
  }

  /**
   * Registra la instancia activa de Unity WebGL devuelta por `createUnityInstance`.
   */
  public registerUnityInstance(instance: any): void {
    this.unityInstance = instance;
    this.emit('unity:ready', { ready: true });
  }

  /**
   * Envía un mensaje estructurado a un GameObject en la jerarquía de Unity.
   * Invoca internamente `unityInstance.SendMessage(target, action, serializedPayload)`.
   */
  public sendToUnity<T = any>(target: string, action: string, payload?: T): boolean {
    if (!this.unityInstance || typeof this.unityInstance.SendMessage !== 'function') {
      return false;
    }

    try {
      const serialized = payload !== undefined
        ? (typeof payload === 'string' ? payload : JSON.stringify(payload))
        : '';
      this.unityInstance.SendMessage(target, action, serialized);
      return true;
    } catch (err) {
      console.warn(`[UnityBridge] Error enviando a ${target}.${action}:`, err);
      return false;
    }
  }

  /**
   * Procesa un mensaje entrante emitido por Unity y lo distribuye a los suscriptores.
   */
  public receiveFromUnity(message: UnityMessage): void {
    const eventName = `${message.target}:${message.action}`;
    this.emit(eventName, message.payload);
    this.emit('*', message);
  }

  /**
   * Suscribe un callback a un evento específico de Unity (ej. 'Rover:OnSampleCollected').
   */
  public on(event: string, handler: MessageHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => this.off(event, handler);
  }

  /**
   * Remueve una suscripción de evento.
   */
  public off(event: string, handler: MessageHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emite un evento a los suscriptores locales.
   */
  public emit(event: string, payload: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(payload);
        } catch (e) {
          console.error(`[UnityBridge] Error en handler para ${event}:`, e);
        }
      });
    }
  }

  // ── MÉTODOS DE CONVENIENCIA PARA CADA OBJETO DEL JUEGO ───────────────

  public syncRoverTelemetry(telemetry: UnityRoverTelemetry): void {
    this.sendToUnity('RoverManager', 'UpdateRoverState', telemetry);
  }

  public syncBaseStation(state: UnityBaseStationState): void {
    this.sendToUnity('BaseStationManager', 'UpdateBaseState', state);
  }

  public syncFlightControl(flightState: UnityFlightControlState): void {
    this.sendToUnity('FlightControlManager', 'UpdateFlightState', flightState);
  }

  public syncISS(issState: UnityISSState): void {
    this.sendToUnity('ISSManager', 'UpdateISSState', issState);
  }

  public setCameraMode(command: UnityCameraCommand): void {
    this.sendToUnity('CameraRig', 'SetCameraView', command);
  }
}

export const UnityBridge = UnityBridgeService.getInstance();
