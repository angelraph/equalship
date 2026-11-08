// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice Robinhood Chain mainnet (chain id 4663) addresses.
/// Sources: docs.robinhood.com/chain/contracts, api.robinhood.com/rhj/assets,
/// developers.uniswap.org v3 Robinhood Chain deployments.
library Addresses {
    address internal constant USDG = 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168; // 6 decimals
    address internal constant WETH = 0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73;
    address internal constant WIF = 0x5173b8eA6923c2d40267890D45C46a3480954773;

    address internal constant SWAP_ROUTER_02 = 0xCaf681a66D020601342297493863E78C959E5cb2;
    address internal constant QUOTER_V2 = 0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7;

    address internal constant NVDA = 0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC;
    address internal constant AAPL = 0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9;
    address internal constant TSLA = 0x322F0929c4625eD5bAd873c95208D54E1c003b2d;
    address internal constant SPY = 0x117cc2133c37B721F49dE2A7a74833232B3B4C0C;
    address internal constant QQQ = 0xD5f3879160bc7c32ebb4dC785F8a4F505888de68;
    address internal constant MSFT = 0xe93237C50D904957Cf27E7B1133b510C669c2e74;

    /// @notice USDG to WETH (0.05%) to WIF (1%), the Uniswap v3 route for buyback and burn.
    function BURN_PATH() internal pure returns (bytes memory) {
        return abi.encodePacked(USDG, uint24(500), WETH, uint24(10_000), WIF);
    }
}
