import './App.css'
import { useWeb3React } from '@web3-react/core'
import Card from './components/Card'

function App() {
  const { connector, hooks } = useWeb3React();

  return (
    <>
      <Card connector={connector} hooks={hooks} name='phantom' />
    </>
  )
}

export default App
