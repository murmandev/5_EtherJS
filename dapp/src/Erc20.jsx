import { useState } from "react";
import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";

const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint)",
    "function transfer(address to, uint amount) returns (bool)",
];

const CONTRACT_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";

export default function TokenInteraction({ provider }) {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [tokenInfo, setTokenInfo] = useState({});
    const [balance, setBalance] = useState("0");
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [txStatus, setTxStatus] = useState("");

    const connectWallet = async () => {
        try {
            const ethereumProvider = await detectEthereumProvider();

            if (!ethereumProvider) {
                throw new Error("Please install MetaMask!");
            }

            const chainId = await ethereumProvider.request({ method: "eth_chainId" });
            if (chainId !== "0xaa36a7") {
                setTxStatus("Please switch to Sepolia network in MetaMask");
                return;
            }

            const accounts = await ethereumProvider.request({
                method: "eth_requestAccounts",
            });
            const web3Provider = new ethers.BrowserProvider(ethereumProvider);
            const signer = await web3Provider.getSigner();
            const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, signer);

            setAccount(accounts[0]);
            setContract(tokenContract);

            const [name, symbol, decimals, totalSupply, balance] = await Promise.all([
                tokenContract.name(),
                tokenContract.symbol(),
                tokenContract.decimals(),
                tokenContract.totalSupply(),
                tokenContract.balanceOf(accounts[0]),
            ]);

            setTokenInfo({
                name,
                symbol,
                decimals,
                totalSupply: ethers.formatUnits(totalSupply, decimals),
            });
            setBalance(ethers.formatUnits(balance, decimals));
            setTxStatus("Wallet connected successfully!");
        } catch (error) {
            console.error("Connection error:", error);
            setTxStatus(`Error: ${error.message}`);
        }
    };

    const sendTokens = async () => {
        if (!contract || !recipient || !amount) return;

        try {
            setTxStatus("Sending tokens...");
            const tx = await contract.transfer(
                recipient,
                ethers.parseUnits(amount, tokenInfo.decimals)
            );

            setTxStatus(`Transaction sent: ${tx.hash}`);
            await tx.wait();
            setTxStatus("Transaction confirmed!");

            const newBalance = await contract.balanceOf(account);
            setBalance(ethers.formatUnits(newBalance, tokenInfo.decimals));
        } catch (error) {
            console.error("Transfer error:", error);
            setTxStatus(`Error: ${error.message}`);
        }
    };

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
            {!account ? (
                <div style={{ textAlign: "center" }}>
                    <button
                        onClick={connectWallet}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#007BFF",
                            color: "#FFF",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                        }}
                    >
                        Connect MetaMask
                    </button>
                    <p style={{ marginTop: "10px", color: "#666" }}>
                        Make sure you're on Sepolia network
                    </p>
                </div>
            ) : (
                <div>
                    <div style={{ marginBottom: "20px" }}>
                        <h2>
                            {tokenInfo.name} ({tokenInfo.symbol})
                        </h2>
                        <p>Decimals: {tokenInfo.decimals}</p>
                        <p>Total Supply: {tokenInfo.totalSupply}</p>
                        <p>Your Balance: {balance} {tokenInfo.symbol}</p>
                    </div>
                    <div>
                        <h3>Transfer Tokens</h3>
                        <input
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder="Recipient address (0x...)"
                            style={{
                                display: "block",
                                width: "100%",
                                padding: "10px",
                                marginBottom: "10px",
                                border: "1px solid #CCC",
                                borderRadius: "5px",
                            }}
                        />
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Amount (${tokenInfo.symbol})`}
                            style={{
                                display: "block",
                                width: "100%",
                                padding: "10px",
                                marginBottom: "10px",
                                border: "1px solid #CCC",
                                borderRadius: "5px",
                            }}
                        />
                        <button
                            onClick={sendTokens}
                            disabled={!recipient || !amount}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#28A745",
                                color: "#FFF",
                                border: "none",
                                borderRadius: "5px",
                                cursor: recipient && amount ? "pointer" : "not-allowed",
                            }}
                        >
                            Transfer
                        </button>
                    </div>
                </div>
            )}
            {txStatus && <div style={{ marginTop: "20px", color: "#333" }}>{txStatus}</div>}
        </div>
    );
}
