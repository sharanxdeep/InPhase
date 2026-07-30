import { useEffect } from "react"
import { socket } from "./socket"

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
    <>
    <h1>InPhase</h1>
    </>
  )
}

export default App
