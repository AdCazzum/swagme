// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface ISwagFormWorldChain {
    function setProofVerified(
        uint256 formId,
        address user,
        uint256 questionIndex,
        bool verified
    ) external;
    
    function isProofVerified(
        uint256 formId,
        address user,
        uint256 questionIndex
    ) external view returns (bool);
    
    function areAllProofsVerified(
        uint256 formId,
        address user
    ) external view returns (bool);
    
    function getProofRequirements(
        uint256 formId
    ) external view returns (bool[] memory);
} 