// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

/// @notice $WIF is ERC20Burnable: burn() lowers totalSupply.
interface IBurnable {
    function burn(uint256 amount) external;
}

/// @notice Uniswap SwapRouter02 (v3 multi hop). Robinhood Chain: 0xcaf681a66d020601342297493863e78c959e5cb2
/// When the path starts with WETH and msg.value covers amountIn, the router wraps the ETH itself.
interface ISwapRouter02 {
    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);
}
