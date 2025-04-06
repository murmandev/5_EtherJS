import { useState } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

// ABI для основных функций ERC-20 токена
const ERC20_ABI = [
    "function name() view returns (string)",       // Получение имени токена
    "function symbol() view returns (string)",     // Получение символа токена
    "function decimals() view returns (uint8)",    // Получение количества десятичных знаков
    "function totalSupply() view returns (uint256)", // Общее предложение токенов
    "function balanceOf(address) view returns (uint)", // Получение баланса адреса
    "function transfer(address to, uint amount) returns (bool)" // Перевод токенов
];

// Адрес контракта LINK токена в сети Sepolia
const CONTRACT_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";

export default function TokenInteraction({ provider }) {
    // Состояния компонента
    const [account, setAccount] = useState(null);         // Текущий подключенный аккаунт
    const [contract, setContract] = useState(null);       // Экземпляр контракта
    const [tokenInfo, setTokenInfo] = useState({});       // Информация о токене
    const [balance, setBalance] = useState("0");          // Баланс пользователя
    const [recipient, setRecipient] = useState("");       // Адрес получателя
    const [amount, setAmount] = useState("");             // Количество для отправки
    const [txStatus, setTxStatus] = useState("");         // Статус транзакции

    // Функция подключения кошелька MetaMask
    const connectWallet = async () => {
        try {
            // Обнаружение провайдера MetaMask
            const ethereumProvider = await detectEthereumProvider();

            if (!ethereumProvider) {
                throw new Error("Пожалуйста, установите MetaMask!");
            }

            // Проверка, что пользователь находится в сети Sepolia (chainId 0xaa36a7)
            const chainId = await ethereumProvider.request({ method: 'eth_chainId' });
            if (chainId !== "0xaa36a7") {
                setTxStatus("Пожалуйста, переключитесь на сеть Sepolia в MetaMask");
                return;
            }

            // Запрос доступа к аккаунтам
            const accounts = await ethereumProvider.request({ method: 'eth_requestAccounts' });

            // Инициализация провайдера и подписанта
            const web3Provider = new ethers.BrowserProvider(ethereumProvider);
            const signer = await web3Provider.getSigner();

            // Создание экземпляра контракта
            const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, signer);

            // Обновление состояний
            setAccount(accounts[0]);
            setContract(tokenContract);

            // Параллельная загрузка данных о токене
            const [name, symbol, decimals, totalSupply, balance] = await Promise.all([
                tokenContract.name(),
                tokenContract.symbol(),
                tokenContract.decimals(),
                tokenContract.totalSupply(),
                tokenContract.balanceOf(accounts[0])
            ]);

            // Сохранение информации о токене
            setTokenInfo({
                name,
                symbol,
                decimals,
                totalSupply: ethers.formatUnits(totalSupply, decimals) // Конвертация из wei
            });

            // Сохранение баланса пользователя
            setBalance(ethers.formatUnits(balance, decimals));
        } catch (error) {
            console.error("Ошибка подключения:", error);
            setTxStatus(`Ошибка: ${error.message}`);
        }
    };

    // Функция отправки токенов
    const sendTokens = async () => {
        if (!contract || !recipient || !amount) return;

        try {
            setTxStatus("Отправка...");

            // Конвертация количества в wei с учетом decimals
            const amountInWei = ethers.parseUnits(amount, tokenInfo.decimals);

            // Вызов метода transfer контракта
            const tx = await contract.transfer(recipient, amountInWei);

            setTxStatus(`Транзакция отправлена: ${tx.hash}`);

            // Ожидание подтверждения транзакции
            await tx.wait();
            setTxStatus("Транзакция подтверждена!");

            // Обновление баланса после отправки
            const newBalance = await contract.balanceOf(account);
            setBalance(ethers.formatUnits(newBalance, tokenInfo.decimals));
        } catch (error) {
            console.error("Ошибка перевода:", error);
            setTxStatus(`Ошибка: ${error.message}`);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h1>Взаимодействие с ERC-20 токеном (Sepolia)</h1>

            {!account ? (
                // Блок подключения кошелька
                <div>
                    <button
                        onClick={connectWallet}
                        style={{
                            padding: '10px 15px',
                            fontSize: '16px',
                            backgroundColor: '#f6851b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Подключить MetaMask
                    </button>
                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                        Убедитесь, что вы находитесь в сети Sepolia
                    </p>
                </div>
            ) : (
                // Основной интерфейс после подключения
                <div>
                    {/* Блок информации о токене */}
                    <div style={{
                        margin: '20px 0',
                        padding: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}>
                        <h2>{tokenInfo.name} ({tokenInfo.symbol})</h2>
                        <p>Десятичных знаков: {tokenInfo.decimals}</p>
                        <p>Общее предложение: {tokenInfo.totalSupply} {tokenInfo.symbol}</p>
                        <p style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                            Ваш баланс: {balance} {tokenInfo.symbol}
                        </p>
                    </div>

                    {/* Форма перевода токенов */}
                    <div style={{
                        margin: '20px 0',
                        padding: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}>
                        <h2>Отправить токены</h2>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Получатель: </label>
                            <input
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    marginTop: '5px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                }}
                                placeholder="0x..."
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Количество: </label>
                            <input
                                type="text"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    marginTop: '5px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                }}
                                placeholder={`Введите количество ${tokenInfo.symbol}`}
                            />
                        </div>
                        <button
                            onClick={sendTokens}
                            disabled={!recipient || !amount}
                            style={{
                                padding: '10px 15px',
                                fontSize: '16px',
                                backgroundColor: !recipient || !amount ? '#cccccc' : '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: !recipient || !amount ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Отправить
                        </button>
                        {txStatus && (
                            <p style={{
                                marginTop: '10px',
                                padding: '8px',
                                backgroundColor: '#e7f3fe',
                                borderLeft: '4px solid #2196F3'
                            }}>
                                {txStatus}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}