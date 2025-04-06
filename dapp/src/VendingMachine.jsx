import { useState, useEffect } from "react";
import { ethers } from "ethers";

const vmContractAddress = "0x5e16FB1784abd2a33ca84D259AcE9e1cAE55416c";
const abi = [
    "function symbol() view returns (string)",
    "function getVendingMachineBalance() view returns (uint)",
    "function balanceOf(address addr) view returns (uint)",
    "function purchase(uint amount) payable returns ()"
];

function VendingMachine({ provider }) {
    const [writableContract, setWritableContract] = useState();
    const [address, setAddress] = useState("");
    const [symbol, setSymbol] = useState("");
    const [cupsInMachine, setCupsInMachine] = useState(0);
    const [purchaseCups, setPurchaseCups] = useState("");
    const [accountCups, setAccountCups] = useState(0);

    useEffect(() => {
        if (!symbol) { updateVendingMachineState() }
        if (writableContract) { updateAccountCups() }
    }, [symbol, writableContract]);

    async function updateVendingMachineState() {
        const readOnlyContract = new ethers.Contract(vmContractAddress, abi, provider);
        console.log(readOnlyContract);

        const symbol = await readOnlyContract.symbol();
        setSymbol(symbol);
        console.log(symbol);

        const cupsInMachine = await readOnlyContract.getVendingMachineBalance();
        setCupsInMachine(cupsInMachine.toString());
        console.log(cupsInMachine);
    }

    const setValue = (setter) => (evt) => setter(evt.target.value);

    async function connectWallet(evt) {
        evt.preventDefault();
        try {
            const walletProvider = new ethers.BrowserProvider(window.ethereum);
            console.log(walletProvider);

            const signer = await walletProvider.getSigner();
            console.log("Wallet signer: ", signer);

            const address = signer.address;
            setAddress(address)
            console.log("Wallet address: ", address);

            const writableContract = new ethers.Contract(vmContractAddress, abi, signer);
            setWritableContract(writableContract)
            console.log("Writable contracts: ", writableContract);
        } catch (exception) {
            alert(exception);
        }
    }

    async function updateAccountCups() {
        try {
            const accountCups = await writableContract.balanceOf(address);
            setAccountCups(accountCups.toString());
            console.log(accountCups);

        } catch (exception) {
            alert(exception);
        }
    }

    async function purchaseCupcakes(evt) {
        evt.preventDefault();
        try {
            console.log(writableContract);
            const tx = await writableContract.purchase(
                purchaseCups,
                { value: ethers.parseUnits(purchaseCups, 'gwei') }
            );
            await tx.wait();
            updateAccountCups();
            updateVendingMachineState();

        } catch (exception) {
            alert(exception);
        }

    }

    return (
        <>
            <div className="container">
                <h1>Vending Machine</h1>
                <div className="balance">TOTAL: {cupsInMachine} {symbol} </div>

                <form>
                    <input
                        type="submit"
                        className="button"
                        value="Connect Wallet"
                        onClick={connectWallet}
                    />
                    <label> Purchase Cupcakes
                        <input
                            placeholder="1, 2, 3 ..."
                            value={purchaseCups}
                            onChange={setValue(setPurchaseCups)}
                        />
                    </label>
                    <input
                        type="submit"
                        className="button"
                        value="Purchase"
                        onClick={purchaseCupcakes}
                        disabled={!writableContract}
                    />
                </form>
                <div className="balance"> YOU HAVE: {accountCups} {symbol} </div>
            </div>
        </>
    );
}

export default VendingMachine;