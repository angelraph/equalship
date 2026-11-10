// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ISwapRouter02} from "../../src/interfaces/IExternal.sol";

contract MockToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory n, string memory s, uint8 d) {
        name = n;
        symbol = s;
        decimals = d;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    /// @notice ERC20Burnable style burn, like $WIF.
    function burn(uint256 amount) external {
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a != type(uint256).max) allowance[from][msg.sender] = a - amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/// @notice Pays `rate` output units per input unit (scaled by 1e18) of the last token in the path.
/// Paths that start with `weth` are paid with ETH sent as msg.value, like SwapRouter02.
contract MockRouter {
    uint256 public rate = 1e18;
    address public weth;

    constructor(address weth_) {
        weth = weth_;
    }

    function setRate(uint256 r) external {
        rate = r;
    }

    function exactInput(ISwapRouter02.ExactInputParams calldata p) external payable returns (uint256 out) {
        address tokenIn = address(bytes20(p.path[0:20]));
        address tokenOut = address(bytes20(p.path[p.path.length - 20:]));
        if (msg.value > 0) {
            require(tokenIn == weth && msg.value == p.amountIn, "eth path");
        } else {
            MockToken(tokenIn).transferFrom(msg.sender, address(this), p.amountIn);
        }
        out = (p.amountIn * rate) / 1e18;
        require(out >= p.amountOutMinimum, "slippage");
        MockToken(tokenOut).mint(p.recipient, out);
    }
}
