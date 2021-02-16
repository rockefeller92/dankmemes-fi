﻿import { FC, useState, ChangeEvent, MouseEvent } from "react";
import { ethers, BigNumber } from "ethers";
import { ERC20, ERC20__factory, BUYsTSLA, BUYsTSLA__factory } from "../contracts/types";

import Button from "../components/Button";

import styled, { css } from 'styled-components';
import {ContractAddresses,NetAddressTable} from '../constants/Addresses';
import {formatCurrency, truncateWalletAddress} from '../util'

const sTSLAIcon = 'svg/synths/sTSLA.svg';
const USDCIcon = 'svg/stablecoin/usdc.svg';
const RightArrowIcon = 'svg/right-arrow.svg';


enum WalletState {
	DISCONNECTED,
	CONNECTING,
	CONNECTED
}

type ERC20Contract = 
{
	api:ERC20
	decimals:number
}

type AppContracts =
{
	USDC:ERC20Contract,
	sTSLA:ERC20Contract,
	BUYsTSLA:BUYsTSLA
}

const Index: FC = () => {

	//wallet state
	const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
	const [account, setAccount] = useState<string>();

	//wallet state
	const [walletState, setWalletState] = useState<WalletState>(WalletState.DISCONNECTED);

	//the app's contract used to buy sTSLA with USDC
	const [BUYsTSLAContract, setBUYsTSLAContract] = useState<BUYsTSLA>();

	//USDC and sTSLA contracts
	const [appContracts, setAppContracts] = useState<AppContracts>();

	//USDC and sTSLA account balances
	const [sTSLABalance, setsTSLABalance] = useState<BigNumber>(BigNumber.from(0));
	const [usdcBalance, setUsdcBalance] = useState<BigNumber>(BigNumber.from(0));

	//the amount of USDC the user wants to use to buy
	const [usdcSpendAmount, setUsdcSpendAmount] = useState<BigNumber>(BigNumber.from(0));

	//the expected amount of sTSLA they should get
	const [expectedSTSLA, setExpectedSTSLA] = useState<BigNumber>(BigNumber.from(0));

	const connectWalletClicked = async(e:MouseEvent<HTMLButtonElement>) =>
	{
		if (walletState!==WalletState.DISCONNECTED)
			return;

		if (!window.ethereum?.request) {
			alert("MetaMask is not installed!");
			return;
		}
		let connectButton = e.currentTarget;
		connectButton.disabled = true;

		setWalletState(WalletState.CONNECTING);

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
			connectButton.disabled = false;
			setWalletState(WalletState.DISCONNECTED);
			alert("No MetaMask wallet connected!");
			return;
		}

		let network = (await p.getNetwork());
		let netName = network.name;
		if (netName==="unknown") //assume this means they selected localhost
			netName = 'localhost';

		let addressBook = ContractAddresses[netName as keyof NetAddressTable];
		if (!addressBook)
		{
			connectButton.disabled = false;
			setWalletState(WalletState.DISCONNECTED);
			const netNameLookup:any = {
				homestead:"mainnet"
			}
			let n = netNameLookup[netName]??netName;
			alert(`"${n}" network not supported, please try another network`);
			return;
		}


		//get contracts
		let usdcContract = ERC20__factory.connect(addressBook.USDC, p.getSigner());
		let sTslaContract = ERC20__factory.connect(addressBook.sTSLA, p.getSigner());
		let buysTsla = BUYsTSLA__factory.connect(addressBook.BUYsTSLA, p.getSigner());

		//set contract state
		setAppContracts({
			USDC: {
				api: usdcContract,
				decimals: await usdcContract.decimals()
			},
			sTSLA: {
				api: sTslaContract,
				decimals: await sTslaContract.decimals()
			},
			BUYsTSLA: buysTsla
		});

		//store provider
		setProvider(p);

		//set account state whenever attached wallets change
		const accountsChanged = async (accounts:Array<string>) =>
		{
			console.log('setting active ETH account: ' + accounts[0]);
			setAccount(accounts[0]);

			//get usdc balance
			const usdc_balance = await usdcContract.balanceOf(accounts[0]);
			setUsdcBalance(usdc_balance);

			const tsla_balance = await sTslaContract.balanceOf(accounts[0]);
			setsTSLABalance(tsla_balance);
		}

		//trigger accountsChanged
		await accountsChanged(accounts);

		//setup listener for accounts changing
		(window.ethereum as any).on('accountsChanged', accountsChanged);

		setWalletState(WalletState.CONNECTED);
	};



	const buySTSLAClicked = async () =>
	{
		if (!provider || !account || !appContracts)
			return;

		if (usdcSpendAmount.gt(usdcBalance))
		{
			alert("Can't spend more than your USDC balance");
			return;
		}

		if (appContracts.BUYsTSLA.stsla_suspended())
		{
			alert("sTSLA market is closed right now, please try again during normal TSLA trading hours");
			return;
		}

		//ERC20 approval process
		//1. must approve the BUYsTSLA contract as a spender on the users USDC 
		//2. then the purchase can be made

		//2nd step of ERC20 approval process
		const _postApprovePurchase = async () =>
		{
			try {
				const result = await appContracts.BUYsTSLA.swap_usdc_to_stsla(usdcSpendAmount);
				console.log(result);
				alert('Your transaction is pending, watch your wallet balance. Transaction id: ' + result);
			}
			catch (err)
			{
				alert('Sorry, your transaction could not be completed.');
				console.log(err);
			}
		}

		//ERC20 approval check.. must approve the BUYsTSLA contract as a spender on the users USDC 
		//before they can purchase
		try
		{           
			//how much is our contract allowed to spend on behalf of the current account?
			let curAllowance = await appContracts.USDC.api.allowance(account, appContracts.BUYsTSLA.address);
			console.log('curAllowance: ' + formatCurrency(curAllowance,appContracts.USDC.decimals,2));

			//if we're trying to spend more than we're allowed, we need approval
			if (usdcSpendAmount.gte(curAllowance))
			{
				try {
					//seek approval for max tokens
					let tx = await appContracts.USDC.api.approve(appContracts.BUYsTSLA.address, ethers.constants.MaxUint256);
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
		if (!appContracts)
			return;

		//force a $ 
		if (e.target.value.length<=0 || e.target.value[0]!=='$')
			e.target.value = '$' + e.target.value;

		//convert the input to a BigNumber formatted w/the correct # of decimals
		//for USDC token
		let num = parseInt(e.target.value.substr(1));
		if (!isNaN(num))
		{
			let amt = BigNumber.from(num).mul(10 ** appContracts.USDC.decimals);
			setUsdcSpendAmount(amt);

			//get approx tsla returned from a trade
			try {
				let res = await appContracts.BUYsTSLA.est_swap_usdc_to_stsla(amt);
				setExpectedSTSLA(res);
			}
			catch (err)
			{
				setExpectedSTSLA(BigNumber.from(0));
				console.error(err);
			}
		}
	}

	return (
		<>
			<CenteredContainer>
				<CenteredUI>
					{walletState!==WalletState.CONNECTED ?
						<>
							<div style={{display:"flex"}}>
								<div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
									<img src={USDCIcon} style={{width:"128px"}} />
									<Title>USDC</Title>
								</div>
								<svg style={{width:"48px",fill:"#fff",margin:"16px 16px"}}
									 viewBox="0 0 216.524 216.524">
									<polygon points="216.524,108.262 146.5,43.267 146.5,68.301 0,68.301 0,148.224 146.5,148.224 146.5,173.258 "/>
								</svg>
								<div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
									<img src={sTSLAIcon} style={{width:"128px"}} />
									<Title>sTSLA</Title>
								</div>
							</div>
							<Title>LETS GO!</Title>
							<Title>🚀🚀🚀🚀</Title><br/>
							<StyledGlowingButton onClick={connectWalletClicked}>
								Connect Wallet
							</StyledGlowingButton>
						</>
						:
						<>
							<div style={{position:"absolute", top:"0px", right:"0px"}}>
								<WalletButton
									variant="solid"
									isActive={true}>
								{truncateWalletAddress(account??"")}
								</WalletButton>
							</div>
							<div style={{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"center"}}>
								<img src={USDCIcon} style={{width:"72px",marginRight:"4px"}} />
								<div>
									<Title>USDC Balance</Title><br/>
									<SmallValue>{'$'+formatCurrency(usdcBalance, appContracts?.USDC?.decimals??0,2)}</SmallValue>
								</div>
								<img src={sTSLAIcon} style={{marginLeft:"32px",width:"72px",marginRight:"6px"}} />
								<div>
									<Title>sTSLA Balance</Title><br/>
									<SmallValue>{formatCurrency(sTSLABalance,appContracts?.sTSLA?.decimals??0,2)}</SmallValue>
								</div>
							</div>
							<br/>
							<Title>USDC to Spend</Title>
							<USDCInput onChange={spendAmountChanged} defaultValue="$0" />
							<br/>
							<StyledGlowingButton onClick={buySTSLAClicked}>
								BUY {formatCurrency(expectedSTSLA, appContracts?.sTSLA?.decimals??0, 2)} sTSLA
							</StyledGlowingButton>
						</>
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
	border-radius: 32px;
`;

const Title = styled.span`
	font-family: ${(props) => props.theme.fonts.interBold};
	font-size: 20px;
	text-transform: none;
	color: ${(props)=>props.theme.colors.white};
`;

const SmallValue = styled.span`
	font-family: ${(props) => props.theme.fonts.extended};
	font-size: 24px;
	text-shadow: ${(props) => props.theme.colors.blueTextShadow};
	color: ${(props) => props.theme.colors.black};
`;

const Value = styled.span`
	font-family: ${(props) => props.theme.fonts.extended};
	font-size: 32px;
	text-shadow: ${(props) => props.theme.colors.blueTextShadow};
	color: ${(props) => props.theme.colors.black};
`;

export const USDCInput = styled.input.attrs({ type: 'text' })`
	
	background-color: rgba(64,64,128,0.5);
	height: unset;
	width: 300px;
	border: 0;
	border-radius: 12px;
	padding: 2px;
	outline: none;
	text-align:center;
	font-family: ${(props) => props.theme.fonts.extended};
	font-size: 32px;
	text-shadow: ${(props) => props.theme.colors.blueTextShadow};
	color: ${(props) => props.theme.colors.black};
	caret-color: white;
`;

const WalletButton = styled(Button)`
	display: inline-flex;
	align-items: center;
	justify-content: space-between;
	border: 1px solid ${(props) => props.theme.colors.mediumBlue};

	svg {
		margin-left: 5px;
		width: 10px;
		height: 10px;
		color: ${(props) => props.theme.colors.gray};
		${(props) =>
			props.isActive &&
			css`
				color: ${(props) => props.theme.colors.white};
			`}
	}
	&:hover {
			background: ${(props) => props.theme.colors.navy};
	}
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
