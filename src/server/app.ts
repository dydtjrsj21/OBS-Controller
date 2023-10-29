import axios from 'axios';
import * as express from 'express';
import * as nunjucks from 'nunjucks'
import * as path from 'path'
import * as fs from 'fs'
import OBSWebSocket from 'obs-websocket-js';

export const LED = new OBSWebSocket();
(async function init(){
    try{
        await LED.connect('ws://localhost:5555', "snulive")
        await BROADCAST.connect('ws://localhost:4444', "snulive")
        LED.on('CurrentProgramSceneChanged', async ({sceneName})=>{
            if (sceneName.includes('BRIDGE')) {
                await BROADCAST.call('SetCurrentProgramScene', {sceneName})
            }
            else{
                await BROADCAST.call('SetCurrentProgramScene', {sceneName : "카메라 화면 - 풀샷"})
            }
        })
    }catch(err){console.error(err)}
    
})()
export const BROADCAST = new OBSWebSocket();
export const PATH = {
    BRIDGE : 'C:/Users/snuli/Desktop/SNULIVE/업무/2023/231030 - 서울대 제도혁신위원회/디자인/출력/간지',
}
export const SceneGenerator = async (OBS : OBSWebSocket)=>{
    const data = await OBS.call('GetSceneList')
    let scenes = data.scenes.map(val=>val.sceneName) as string[]
    let deleteSceneList = scenes.filter(val=>val.includes('BRIDGE'))
    for(let key of Object.keys(PATH)){
        for(let fileName of fs.readdirSync(PATH[key])){
            const sceneName = `[${key}] ${fileName.split('.')[0]}`
            deleteSceneList = deleteSceneList.filter(val=>val != sceneName)
            if(scenes.includes(sceneName)) continue;
            await OBS.call('CreateScene', {
                sceneName: sceneName
            })  
            scenes = [sceneName, ...scenes]
            await OBS.call('CreateInput', {
                sceneName: sceneName,
                inputName: fileName,
                inputKind: "image_source",
                inputSettings: {
                    "file": `${PATH[key]}/${fileName}`,
                }
            })
        }
    }

    for(let deleteScene of deleteSceneList){
        try{await OBS.call('RemoveScene', {sceneName : deleteScene}); scenes = scenes.filter(val=>val != deleteScene);}
        catch(err){}
    }
    return scenes
}
const TARGET = process.env.npm_lifecycle_event;
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.set('view engine', 'html');
nunjucks.configure('./dist/client/html', {
    express : app,
    watch : true
})

app.get('/js/:fileName', (req, res, next)=>{
    if(TARGET == "server" || TARGET == "BackEnd"){
        axios.get(`http://localhost:8080/${req.params.fileName}`)
        .then(({data})=>{
            res.send(data)
        })  
    }else{
        res.sendFile(path.join(__dirname, `../client/js/${req.params.fileName}`))
    }
})

app.use('/css',(req,res,next)=>{
    express.static('./dist/client/css')(req,res,next)
});

app.use('/image',(req,res,next)=>{
    express.static('./dist/client/image')(req,res,next)
});

//LED control
import led from './router/led'
app.use('/led', led)
import broadcast from './router/broadcast'
app.use('/broadcast', broadcast)
import music from './router/music'
app.use('/music', music)

app.listen(80, () => {})



import {WebSocketServer} from 'ws'
const wsBroadcast = new WebSocketServer({port : 8001})
wsBroadcast.on("connection", (ws, req)=>{
    if(req.url.includes('broadcast')){
        BROADCAST.call('GetCurrentProgramScene').then(result=>{
            setTimeout(()=>{
                ws.send(result.currentProgramSceneName)
            },500)
        })
        BROADCAST.on('CurrentProgramSceneChanged',({sceneName})=>{
            ws.send(sceneName)
        })
    }
    else{
        LED.call('GetCurrentProgramScene').then(result=>{
            setTimeout(()=>{
                ws.send(result.currentProgramSceneName)
            },500)
        })
        LED.on('CurrentProgramSceneChanged',({sceneName})=>{
            ws.send(sceneName)
        })
    }
})