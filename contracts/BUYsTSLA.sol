//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "./ERC20.sol";
import "./ISynthetix.sol";
import "./IExchanger.sol";
import "./ICurveSUSD.sol";

contract BUYsTSLA
{
	//consts for USDC to sUSD on curve.fi
	address constant sUSDAddress = 0x57Ab1ec28D129707052df4dF418D58a2D46d5f51;
	address constant USDCAddress = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
	
	address constant CurveSUSDSwapAddress = 0xA5407eAE9Ba41422680e2e00537571bcC53efBfD;
	ICurveSUSD crvSUSDSwap = ICurveSUSD(CurveSUSDSwapAddress);

	int128 constant USDCIndex = 1;
	int128 constant sUSDIndex = 3;


	//consts for sUSD to sTSLA on Synthetix
	address constant SynthetixAddress    = 0x97767D7D04Fd0dB0A1a2478DCd4BA85290556B48;
	address constant SNXExchangerAddress = 0x0bfDc04B38251394542586969E2356d0D731f7DE;

	ISynthetix Synthetix          = ISynthetix(SynthetixAddress);
	IExchanger SynthetixExchanger = IExchanger(SNXExchangerAddress);

	bytes32 sUSDKey  = 0x7355534400000000000000000000000000000000000000000000000000000000;
	bytes32 sTSLAKey = 0x7354534c41000000000000000000000000000000000000000000000000000000;

	constructor() {}

	//estimate how much sUSD you can get for USDC
	function est_swap_usdc_to_susd(uint256 usdc_amount) public view returns (uint256 )
	{
		uint256 susd_amount = crvSUSDSwap.get_dy(USDCIndex, sUSDIndex, usdc_amount);
		return susd_amount;
	}

	//estimate how much sTSLA you can get for USDC
	function est_swap_usdc_to_stsla(uint256 usdc_amount) public view returns (uint256 )
	{
		uint256 susd_amount = est_swap_usdc_to_susd(usdc_amount);

		(uint amountReceived,
         /*uint fee*/,
         /*uint exchangeFeeRate*/) = SynthetixExchanger.getAmountsForExchange(susd_amount, sUSDKey, sTSLAKey);
		 
		return amountReceived;
	}

	function swap_usdc_to_stsla(uint256 usdc_amount) payable external returns (uint256 )
	{
		//transfer incoming USDC funds from caller to this contract
		if (!IERC20(USDCAddress).transferFrom(msg.sender, address(this), usdc_amount))
		{
			revert('USDC transfer failed');
		}

		//approve sending of USDC from this contract to Curve
		if (!IERC20(USDCAddress).approve(CurveSUSDSwapAddress, usdc_amount))
		{
			revert('USDC transfer approval failed');
		}

		//estimate how much susd we should expect back
		uint256 susd_expected = est_swap_usdc_to_susd(usdc_amount);

		//establish minimum expected at 1% less than expected amount
		uint256 min_susd_expected = susd_expected - susd_expected/100;

		//TODO: this expected amount should actually come from a value displayed to the user
		//prior to approving the transaction
		//there can't be any "slippage" between the above estimate and the swap below
		//since this is all in the same atomic transaction

		//note the current balance of sUSD before and after exchange on curve, this
		//is the only definitive way to know how much we received
		uint256 before_susd_balance = IERC20(sUSDAddress).balanceOf(address(this));

		//do the swap
		crvSUSDSwap.exchange(USDCIndex,sUSDIndex,usdc_amount,min_susd_expected);

		//determine how much we received in the swap
		uint256 after_susd_balance = IERC20(sUSDAddress).balanceOf(address(this));
		uint256 susd_received = after_susd_balance - before_susd_balance;

		//now turn sUSD it into sTSLA and send back to the caller

		//give Synthetix contract permission to take susd_received from us
		if (!IERC20(sUSDAddress).approve(SynthetixAddress, susd_received))
		{
			revert('sUSD transfer approval failed');
		}

		//exchange via synthetix, benefitting the caller
		uint stsla_received = Synthetix.exchangeOnBehalf(msg.sender, sUSDKey, susd_received, sTSLAKey);

		return stsla_received;
	}
}
