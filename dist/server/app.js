"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneGenerator = exports.BROADCAST = void 0;
const axios_1 = require("axios");
const express = require("express");
const nunjucks = require("nunjucks");
const path = require("path");
const obs_websocket_js_1 = require("obs-websocket-js");
exports.BROADCAST = new obs_websocket_js_1.default();
(async function init() {
    try {
        await exports.BROADCAST.connect('ws://localhost:4444', "snulive");
    }
    catch (err) {
        console.error(err);
    }
})();
const SceneGenerator = async (OBS) => {
    const data = await OBS.call('GetSceneList');
    let scenes = data.scenes.map(val => val.sceneName);
    return scenes;
};
exports.SceneGenerator = SceneGenerator;
const TARGET = process.env.npm_lifecycle_event;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'html');
nunjucks.configure('./dist/client/html', {
    express: app,
    watch: true
});
app.get('/js/:fileName', (req, res, next) => {
    if (TARGET == "server" || TARGET == "BackEnd") {
        axios_1.default.get(`http://localhost:8080/${req.params.fileName}`)
            .then(({ data }) => {
            res.send(data);
        });
    }
    else {
        res.sendFile(path.join(__dirname, `../client/js/${req.params.fileName}`));
    }
});
app.use('/css', (req, res, next) => {
    express.static('./dist/client/css')(req, res, next);
});
app.use('/image', (req, res, next) => {
    express.static('./dist/client/image')(req, res, next);
});
const broadcast_1 = require("./router/broadcast");
app.use('/broadcast', broadcast_1.default);
const music_1 = require("./router/music");
app.use('/music', music_1.default);
app.listen(80, () => { });
const ws_1 = require("ws");
const wsBroadcast = new ws_1.WebSocketServer({ port: 8001 });
wsBroadcast.on("connection", (ws, req) => {
    exports.BROADCAST.call('GetCurrentProgramScene').then(result => {
        setTimeout(() => {
            ws.send(result.currentProgramSceneName);
        }, 500);
    });
    exports.BROADCAST.on('CurrentProgramSceneChanged', ({ sceneName }) => {
        ws.send(sceneName);
    });
});
