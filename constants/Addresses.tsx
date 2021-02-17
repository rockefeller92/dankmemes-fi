export type Addresses = {
	USDC:string,
	sTSLA:string,
	BUYsTSLA:string,
	SynthetixDelegateApprovals:string
};

export type NetAddressTable = { homestead?:Addresses, homestead_fork:Addresses};

export const ContractAddresses:NetAddressTable = {
	/*
	homestead: {
		//for development purposes we use a mainnet fork
		USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		sTSLA: "0x918dA91Ccbc32B7a6A0cc4eCd5987bbab6E31e6D",
		BUYsTSLA: "", //not deployed on mainnet yet
		SynthetixDelegateApprovals: "0x15fd6e554874B9e70F832Ed37f231Ac5E142362f"
	},
	*/
	homestead_fork: {
		//for development purposes we use a mainnet fork
		USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		sTSLA: "0x918dA91Ccbc32B7a6A0cc4eCd5987bbab6E31e6D",
		BUYsTSLA: "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c",
		SynthetixDelegateApprovals: "0x15fd6e554874B9e70F832Ed37f231Ac5E142362f"
	}
}