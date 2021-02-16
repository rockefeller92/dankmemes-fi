export type Addresses = {USDC:string,sTSLA:string,BUYsTSLA:string};
export type NetAddressTable = { homestead?:Addresses, kovan?:Addresses, localhost:Addresses};

export const ContractAddresses:NetAddressTable = {
/*
	homestead: {
		USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		sTSLA: "0x918dA91Ccbc32B7a6A0cc4eCd5987bbab6E31e6D",
		BUYsTSLA: "" //only deployed on local fork of mainnet so far
	},
	kovan: {
		USDC: "0xADFfC3AB23150CD7852DeD422BE95b1C9f7204d4",
		sTSLA: "0x53A14CdBCE36F870461Ffc2cB0C9D63b0f4a297a",
		BUYsTSLA: "0xf5701F216433cba51420B570C950Db08c26c7EA3" //only deployed on local fork of mainnet so far
	},
	*/
	localhost: {
		//localhost uses a fork of mainnet
		USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		sTSLA: "0x918dA91Ccbc32B7a6A0cc4eCd5987bbab6E31e6D",
		BUYsTSLA: "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c"
	}
}