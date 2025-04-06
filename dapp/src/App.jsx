import { ethers } from "ethers";
import './App.css'
import BalanceReader from './BalanceReader';
import BlockExplorer from './BlockExplorer';
import VendingMachine from './VendingMachine';
import Erc20 from './Erc20';

const providerUrl = "https://ethereum-sepolia-rpc.publicnode.com";
const provider = new ethers.JsonRpcProvider(providerUrl);
const network = await provider.getNetwork();

function App() {
  console.log(network);
  return (
    <>

      <Erc20
        provider={provider}
      />

    </>
  )
}

export default App