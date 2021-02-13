import { FC, useState } from "react";
import { ethers } from "ethers";
import { Erc20__factory, Greeter__factory } from "../contracts/types";
import Button from "../components/Button";

const USDCAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

const Index: FC = () => {
  //const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>();
  const [account, setAccount] = useState<string>();
  const [tokenBalance, setTokenBalance] = useState<string>();

  const connect = async () => {
    if (!window.ethereum?.request) {
      alert("MetaMask is not installed!");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setProvider(provider);
    setAccount(accounts[0]);
  };

  const getTokenBalance = async () => {
    if (provider && account) {
      const TOKEN_ADDR = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
      const token = Erc20__factory.connect(TOKEN_ADDR, provider.getSigner());
      
      const rawBalance = await token.balanceOf(account);
      const decimals = await token.decimals();

      const balance = ethers.utils.formatUnits(rawBalance, decimals);
      setTokenBalance(balance);
    }
  };

    const signAndRun = async () =>
    {
        if (!provider || !account)
            return;

        const GreeterAddress = "0x67d269191c92Caf3cD7723F116c85e6E9bf55933";
        try
        {           
        /*
            const greeter = Greeter__factory.connect(GreeterAddress, provider.getSigner());
            const result = await greeter.greet();
            return;
            */
            const token = Erc20__factory.connect(USDCAddress, provider.getSigner());
            const rawBalance = await token.balanceOf(account);
            let res = await token.approve(GreeterAddress,rawBalance);
            if (res)
            {
                const greeter = Greeter__factory.connect(GreeterAddress, provider.getSigner());
                const result = await greeter.swap_usdc_to_susd(0);
            }
        }
        catch (err)
        {
            console.log(err);
        }
    }

    return (
        <>
            <Button onClick={connect}>Connect</Button>
            <p>Account: {account}</p>
            <button onClick={getTokenBalance}>Get Token Balance</button>
            <p>Token Balance: {tokenBalance}</p>
            <button onClick={signAndRun}>YOLO INTO sTSLA</button>
            
        </>
    );
};

export default Index;
