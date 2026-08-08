import { useEffect } from "react"
import { socket } from "./socket"
import {Route, Routes} from "react-router-dom"
import Home from "./Pages/Home"
import Room from "./Pages/Room"

function App() {
  useEffect(()=>{
    socket.on('connect',()=>{
      console.log('connected with id: ',socket.id)
    })

    return ()=>{
      socket.off('connect')
    }
  },[])

  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="/room/:roomId" element={<Room />}></Route>
    </Routes>
  )
}

export default App
