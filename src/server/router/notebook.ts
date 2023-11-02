
import * as express from 'express'
const router = express.Router()
import { BROADCAST, NOTEBOOK, SceneGenerator } from '../app'

router.get('/get', async (req,res,next)=>{
    res.send(await SceneGenerator(NOTEBOOK))
})
router.post('/set', async (req,res,next)=>{
    const {scene} : {scene : string} = req.body
    try{
        await NOTEBOOK.call('SetCurrentProgramScene',{
            "sceneName" : scene
        })
        res.send(true)
    }catch(err){
        res.status(404).send(false)
    }
})

export default router;