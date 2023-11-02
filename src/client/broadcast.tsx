import ReactDOM from 'react-dom';
import styled from 'styled-components';
import React, { useLayoutEffect, useRef, useState } from 'react';
import axios from 'axios';
import {color} from './Util/Define'
import StyledButton, { ContentButton } from './Util/Input/Button';
import { Modal, useModal } from './Util/Modal';
import { BottomLine } from './Util/BottomLine';
import { Title } from './Util/TextStyle';

const StyledBg = styled.div`
    background-color: ${color.box};
    min-height: 100vh;
`
const StyledDiv = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 100px 100px;
`
const ws = new WebSocket(`ws://${window.location.host}:8001/broadcast`)
function Controller(){
    const [scenes, setScenes] = useState<string[]>([]);
    const [notebookScenes, setNotebookScenes] = useState<string[]>([]);
    const [curScene, setCurScene] = useState<string>('')
    useLayoutEffect(()=>{
        axios.get(`/broadcast/get`).then(({data})=>{
            setScenes(data)
            ws.onmessage = (event)=>{
                setCurScene(event.data)
            }
            axios.get('/notebook/get').then(({data})=>{
                setNotebookScenes(data)
            })
        })
    },[])
    

    const onClickHandler = (scene)=>{
        // if(!confirm('장면을 변경하시겠습니까?')) return;
        axios.post('/broadcast/set', {scene})
        .then(({data})=>{
            if(data){
            }
        })
    }
    const {content, modalHandler} = useModal();
    return(
        <StyledBg>
            <Modal content={content} color={color.box} onClick={modalHandler}/>
            <StyledDiv>
                <Title style={{marginBottom : "30px"}}>현재화면 : {curScene}</Title>
                {scenes.filter(scene=>!scene.includes('BRIDGE') && !scene.includes('LOOPING')).map(scene=><StyledButton onClick={(e)=>{onClickHandler(scene)}} style={{margin : "30px 0"}}>{scene}</StyledButton>)}
                <BottomLine width='300px' style={{borderWidth : "1px", borderColor : "white", margin : "30px 30px"}}/>
                <StyledButton onClick={(e)=>{modalHandler(<NotebookModal scenes={notebookScenes.filter(scene=>scene.includes('BRIDGE'))}/>)}} style={{margin : "30px 0"}}>브릿지</StyledButton>
                <StyledButton onClick={(e)=>{modalHandler(<NotebookModal scenes={notebookScenes.filter(scene=>scene.includes('VIDEO'))}/>)}} style={{margin : "30px 0"}}>영상</StyledButton>
                <StyledButton onClick={(e)=>{modalHandler(<NotebookModal scenes={notebookScenes.filter(scene=>scene.includes('PPT'))}/>)}} style={{margin : "30px 0"}}>PPT</StyledButton>
            </StyledDiv>
            {/* <StyledDiv>
                <Music/>
            </StyledDiv> */}
        </StyledBg>
    )
}

function NotebookModal({scenes} : {scenes : string[]}){
    const onClickHandler = (scene)=>{
        // if(!confirm('장면을 변경하시겠습니까?')) return;
        axios.post('/notebook/set', {scene})
        .then(({data})=>{
            // alert('장면 변경에 성공하였습니다.')
        })
    }
    return (
        <StyledDiv style={{width : "calc(50vw + 100px)"}}>
            {scenes.map(scene=><StyledButton onClick={(e)=>{onClickHandler(scene)}} style={{margin : "30px 0"}}>{scene.includes(']') ? scene.split(']')[1].substring(1) : scene}</StyledButton>)}
        </StyledDiv>
    )
}

ReactDOM.render(<Controller />, document.getElementById('root'));