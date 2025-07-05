// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IWeb2Json {
    struct ResponseBody {
        string responseBody;
        uint256 timestamp;
    }
    
    struct Proof {
        ResponseBody data;
        bytes32 merkleRoot;
        bytes32[] merkleProof;
    }
} 