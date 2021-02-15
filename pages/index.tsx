import { FC, useState, ChangeEvent, MouseEvent } from "react";
import { ethers, BigNumber } from "ethers";
import { Erc20, Erc20__factory, BUYsTSLA, BUYsTSLA__factory } from "../contracts/types";

import Button from "../components/Button";

import styled from 'styled-components';

const USDCAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const sUSDAddress = "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51";
const sTSLAAddress = "0x918dA91Ccbc32B7a6A0cc4eCd5987bbab6E31e6D";

const BUYsTSLAAddress = "0x01c1DeF3b91672704716159C9041Aeca392DdFfb";

import sTSLAIcon from '@synthetixio/assets/synths/sTSLA.svg';

function formatCurrency(amount:BigNumber,bignum_decimals:number,print_decimals:number):string
{
    let str = ethers.utils.formatUnits(amount, bignum_decimals);
    let split = str.split('.');
    let zeroTail = '0'.repeat(print_decimals);

    if (split.length==0)
        str = '0.' + zeroTail;
    else
    if (split.length==1)
    {
        str = str+'.'+zeroTail;
    }
    else
    {
        //make sure there's at least N trailing 0's and chop off at N
        split[1] = (split[1] + zeroTail).substr(0,print_decimals);
        str = split.join('.');
    }

    return str;
}

enum FlowState {
    WALLET_DISCONNECTED,
    CONNECTING_WALLET,
    SELECT_USDC_AMOUNT
}

type USDCContractState = 
{
    erc20:Erc20
    decimals:number
}

type ERC20ContractState = 
{
    erc20:Erc20
    decimals:number
}



const Index: FC = () => {
    const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
    const [account, setAccount] = useState<string>();
    const [flowState, setFlowState] = useState<FlowState>(FlowState.WALLET_DISCONNECTED);

    const [sUSDContract, setsUSDContract] = useState<ERC20ContractState>();
    const [sTSLAContract, setsTSLAContract] = useState<ERC20ContractState>();

    const [USDCContract, setUSDCContract] = useState<ERC20ContractState>();
    const [usdcBalance, setUsdcBalance] = useState<BigNumber>(BigNumber.from(0));
    const [usdcSpendAmount, setUsdcSpendAmount] = useState<BigNumber>(BigNumber.from(0));

    const [BUYsTSLAContract, setBUYsTSLAContract] = useState<BUYsTSLA>();
    const [expectedSTSLA, setExpectedSTSLA] = useState<BigNumber>(BigNumber.from(0));


    const connectWalletClicked = async(e:MouseEvent<HTMLButtonElement>) =>
    {
        if (!window.ethereum?.request) {
            alert("MetaMask is not installed!");
            return;
        }
        e.currentTarget.disabled = true;

        setFlowState(FlowState.CONNECTING_WALLET);

        const p = new ethers.providers.Web3Provider(window.ethereum);
        let accounts:Array<string> = [];
        try {
            accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
        }
        catch (err)
        {}

        if (!accounts || !accounts[0])
        {
            e.currentTarget.disabled = false;
            alert("No MetaMask wallet connected!");
            setFlowState(FlowState.WALLET_DISCONNECTED);
        }
        else
        {
            //connect to USDC contract
            let c = Erc20__factory.connect(USDCAddress, p.getSigner());
            const c_decimals = await c.decimals();
            setUSDCContract({erc20:c, decimals:c_decimals});

            //connect to sUSD contract
            let s = Erc20__factory.connect(sUSDAddress, p.getSigner());
            const s_decimals = await s.decimals();
            setsUSDContract({erc20:s, decimals:s_decimals});

            //connect to sTSLA contract
            {
                let s = Erc20__factory.connect(sTSLAAddress, p.getSigner());
                const s_decimals = await s.decimals();
                setsTSLAContract({erc20:s, decimals:s_decimals});
            }

            //connect to BUYsTSLA contract
            let b = BUYsTSLA__factory.connect(BUYsTSLAAddress, p.getSigner());
            setBUYsTSLAContract(b);

            //store provider
            setProvider(p);

            //set account state whenever attached wallets change
            const accountsChanged = async (accounts:Array<string>) =>
            {
                console.log('setting active ETH account: ' + accounts[0]);
                setAccount(accounts[0]);

                //get usdc balance
                const rawBalance = await c.balanceOf(accounts[0]);
                setUsdcBalance(rawBalance);

                //get usdc balance of buy contract just to see whats up there...
                const rawBalance2 = await c.balanceOf(BUYsTSLAAddress);
                console.log('BUYsTSLA contract has USDC balance of: ' + formatCurrency(rawBalance2,c_decimals,2));
            }

            //trigger accountsChanged
            await accountsChanged(accounts);

            //setup listener for accounts changing
            (window.ethereum as any).on('accountsChanged', accountsChanged);

            setFlowState(FlowState.SELECT_USDC_AMOUNT);
        }
    };



    const buySTSLAClicked = async () =>
    {
        if (!provider || !account || !USDCContract || !BUYsTSLAContract)
            return;

        if (usdcSpendAmount.gt(usdcBalance))
        {
            alert("Can't spend more than your USDC balance");
            return;
        }

        const _postApprovePurchase = async () =>
        {
            try {
                const result = await BUYsTSLAContract.swap_usdc_to_stsla(usdcSpendAmount);
            }
            catch (err)
            {
                console.log(err);
            }
        }

        try
        {           
            //how much is our contract allowed to spend on behalf of the current account?
            let curAllowance = await USDCContract.erc20.allowance(account, BUYsTSLAAddress);
            console.log('curAllowance: ' + formatCurrency(curAllowance,USDCContract.decimals,2));

            //if we're trying to spend more than we're allowed, we need approval
            if (usdcSpendAmount.gte(curAllowance))
            {
                try {
                    let tx = await USDCContract.erc20.approve(BUYsTSLAAddress, ethers.constants.MaxUint256);
                    console.log(tx);
                    _postApprovePurchase();
                }
                catch (err)
                {
                    console.log(err);
                }
            }
            else
            {
                //no approval needed go straight to purchase
                _postApprovePurchase();
            }
        }
        catch (err)
        {
            console.log(err);
        }
    }

    const spendAmountChanged = async (e:ChangeEvent<HTMLInputElement>) =>
    {
        if (USDCContract && BUYsTSLAContract)
        {
            //force a $ 
            if (e.target.value.length<=0 || e.target.value[0]!=='$')
                e.target.value = '$' + e.target.value;

            let num = parseInt(e.target.value.substr(1));
            if (!isNaN(num))
            {
                let amt = BigNumber.from(num).mul(10 ** USDCContract.decimals);
                setUsdcSpendAmount(amt);

                //get approx tsla returned from a trade
                let res = await BUYsTSLAContract.est_swap_usdc_to_stsla(amt);
                setExpectedSTSLA(res);

            }
        }
    }

    return (
        <>
            <CenteredContainer>
                <CenteredUI>
                    {flowState===FlowState.WALLET_DISCONNECTED || flowState===FlowState.CONNECTING_WALLET ?
                        <>
                            <Title>
                            WANT sTSLA ?
                            </Title>
                            <img src={sTSLAIcon} style={{width:"128px"}} />
                            <br/>
                            <StyledGlowingButton onClick={connectWalletClicked}>
				                Connect Wallet
			                </StyledGlowingButton>
                        </>
                        :null
                    }

                    {flowState===FlowState.SELECT_USDC_AMOUNT ?
                        <>
                            <Title>USDC Balance</Title>
                            <Value>{'$'+formatCurrency(usdcBalance,USDCContract?USDCContract.decimals:0,2)}</Value>
                            <br/>
                            <Title>USDC to Spend</Title>
                            <USDCInput onChange={spendAmountChanged} defaultValue="$0" />
                            <br/>
                            <StyledGlowingButton onClick={buySTSLAClicked}>
				                BUY {formatCurrency(expectedSTSLA, sUSDContract?sUSDContract.decimals:0, 2)} sTSLA
			                </StyledGlowingButton>
                        </>
                        :null
                    }
                </CenteredUI>
            </CenteredContainer>
            
        </>
    );
};
//{t('common.wallet.connect-wallet')}

const CenteredContainer = styled.div`
    display:flex;
    justify-content:center;
    align-items:center;
    height: 100vh;
`;

const CenteredUI = styled.div`
    display:inline-flex;
    flex-direction: column;
    justify-content:center;
    align-items:center;
    background-color: rgba(0,0,64,0.7);
    padding: 32px;
    border-radius: 24px;
`;

const Title = styled.span`
	font-family: ${(props) => props.theme.fonts.interBold};
	font-size: 20px;
	text-transform: none;
    color: ${(props)=>props.theme.colors.white};
`;

const Value = styled.span`
	font-family: ${(props) => props.theme.fonts.extended};
    font-size: 32px;
	text-shadow: ${(props) => props.theme.colors.blueTextShadow};
	color: ${(props) => props.theme.colors.black};
`;

export const USDCInput = styled.input.attrs({ type: 'text' })`
	
    background-color: unset;
    height: unset;
    width: 200px;
    border: 0;
    padding: 0px;
	outline: none;
    text-align:center;
	font-family: ${(props) => props.theme.fonts.extended};
    font-size: 32px;
	text-shadow: ${(props) => props.theme.colors.blueTextShadow};
	color: ${(props) => props.theme.colors.black};
    caret-color: white;
`;

const StyledGlowingButton = styled(Button).attrs({
	variant: 'primary',
	size: 'xl',
})`
	height: 64px;
	line-height: 64px;
	padding: 0 20px;
	font-family: ${(props) => props.theme.fonts.condensedMedium};
    font-size: 32px;
	margin: 4px 0px;
	text-transform: none;
`;

export default Index;
