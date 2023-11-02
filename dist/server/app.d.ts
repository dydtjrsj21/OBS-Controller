import OBSWebSocket from 'obs-websocket-js';
export declare const BROADCAST: OBSWebSocket;
export declare const NOTEBOOK: OBSWebSocket;
export declare const PATH: {
    BRIDGE: string;
    VIDEO: string;
};
export declare const SceneGenerator: (OBS: OBSWebSocket) => Promise<string[]>;
