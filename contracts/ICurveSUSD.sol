//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

interface ICurveSUSD {
  function get_virtual_price (  ) external returns ( uint256 );
  function calc_token_amount ( uint256[4] calldata amounts, bool deposit ) external returns ( uint256 );
  function add_liquidity ( uint256[4] calldata amounts, uint256 min_mint_amount ) external;
  function get_dy ( int128 i, int128 j, uint256 dx ) view external returns ( uint256 );
  function get_dy_underlying ( int128 i, int128 j, uint256 dx ) external returns ( uint256 );
  function exchange ( int128 i, int128 j, uint256 dx, uint256 min_dy ) external;
  function exchange_underlying ( int128 i, int128 j, uint256 dx, uint256 min_dy ) external;
  function remove_liquidity ( uint256 _amount, uint256[4] calldata min_amounts ) external;
  function remove_liquidity_imbalance ( uint256[4] calldata amounts, uint256 max_burn_amount ) external;
  function commit_new_parameters ( uint256 amplification, uint256 new_fee, uint256 new_admin_fee ) external;
  function apply_new_parameters (  ) external;
  function revert_new_parameters (  ) external;
  function commit_transfer_ownership ( address _owner ) external;
  function apply_transfer_ownership (  ) external;
  function revert_transfer_ownership (  ) external;
  function withdraw_admin_fees (  ) external;
  function kill_me (  ) external;
  function unkill_me (  ) external;
  function coins ( int128 arg0 ) external returns ( address );
  function underlying_coins ( int128 arg0 ) external returns ( address );
  function balances ( int128 arg0 ) external returns ( uint256 );
  function A (  ) external returns ( uint256 );
  function fee (  ) external returns ( uint256 );
  function admin_fee (  ) external returns ( uint256 );
  function owner (  ) external returns ( address );
  function admin_actions_deadline (  ) external returns ( uint256 );
  function transfer_ownership_deadline (  ) external returns ( uint256 );
  function future_A (  ) external returns ( uint256 );
  function future_fee (  ) external returns ( uint256 );
  function future_admin_fee (  ) external returns ( uint256 );
  function future_owner (  ) external returns ( address );
}
