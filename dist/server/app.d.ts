import OBSWebSocket from 'obs-websocket-js';
export declare const BROADCAST: OBSWebSocket;
export declare const SceneGenerator: (OBS: OBSWebSocket) => Promise<string[]>;
