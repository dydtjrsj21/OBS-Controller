import axios from 'axios';
import * as express from 'express';
import * as nunjucks from 'nunjucks'
import * as path from 'path'
import * as fs from 'fs'
import OBSWebSocket from 'obs-websocket-js';
import {NOTEBOOK_ADDRESS} from './util/constant'

export const BROADCAST = new OBSWebSocket();
export const NOTEBOOK = new OBSWebSocket();

(async function init(){
    try{
        await BROADCAST.connect('ws://localhost:4444', "snulive")
        await NOTEBOOK.connect(NOTEBOOK_ADDRESS, "snulive")
        NOTEBOOK.on('CurrentProgramSceneChanged', async ({sceneName})=>{
            if (sceneName.includes('VIDEO') || sceneName.includes('BRIDGE')) {
                BROADCAST.call('SetCurrentProgramScene', {sceneName : "컴퓨터화면"})
            }
            else{
                await BROADCAST.call('SetCurrentProgramScene', {sceneName : "카메라 화면 - 풀샷"})
            }
        })
    }catch(err){console.error(err)}
    
})()

export const PATH = {
    BRIDGE : '//Msi_new/공유폴더/231102 - AsIA지역인문학센터/간지',
    VIDEO : '//Msi_new/공유폴더/231102 - AsIA지역인문학센터/영상'
}
export const SceneGenerator = async (OBS : OBSWebSocket)=>{
    const data = await OBS.call('GetSceneList')
    let scenes = data.scenes.map(val=>val.sceneName) as string[]
    let deleteSceneList = scenes.filter(val=>val.includes('BRIDGE') || val.includes('VIDEO'))
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
                inputKind: key=='BRIDGE' ? "image_source" : "ffmpeg_source",
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
import broadcast from './router/broadcast'
app.use('/broadcast', broadcast)
import notebook from './router/notebook'
app.use('/notebook', notebook)
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
})