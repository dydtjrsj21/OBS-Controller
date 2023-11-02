import * as express from 'express'
const router = express.Router()
import { BROADCAST} from '../app'

router.get('/', (req, res, next)=>{
    res.render('index', {reactFile : 'broadcast'})
})
router.get('/get', async (req,res,next)=>{
    const data = await BROADCAST.call('GetSceneList')
    let scenes = data.scenes.map(val=>val.sceneName) as string[]
    res.send(scenes)
})
router.post('/set', (req,res,next)=>{
    const {scene} = req.body
    BROADCAST.call('SetCurrentProgramScene',{
        "sceneName" : scene
    }).then(()=>{
        res.send(true)
    }).catch(()=>{
        res.status(404).send(false)
    })
})

export default router;