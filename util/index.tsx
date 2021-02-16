import { ethers, BigNumber } from "ethers";

export const truncateWalletAddress = (address: string, first = 8, last = 8) =>
	address?`${address.slice(0, first)}...${address.slice(-last, address.length)}`:'';

export function formatCurrency(amount:BigNumber,bignum_decimals:number,print_decimals:number):string
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
