// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@zetachain/toolkit/contracts/OnlySystem.sol";

contract NFT is ERC721, ERC721URIStorage, OnlySystem, zContract {
    SystemContract public systemContract;
    error CallerNotOwnerNotApproved();
    uint256 constant BITCOIN = 18332;

    struct NFTMetadata {
        uint256 wasteUnits;
        string wasteType;
        uint256 chainId;
    }

    mapping(uint256 => NFTMetadata) public nftMetadata;
    mapping(uint256 => uint256) public tokenAmounts; // Mapping from tokenId to the amount of resource
    mapping(uint256 => uint256) public tokenChains; // Mapping from tokenId to the chain ID

    uint256 private _nextTokenId;

    constructor(address systemContractAddress) ERC721("MyNFT", "MNFT") {
        systemContract = SystemContract(systemContractAddress);
        _nextTokenId = 0;
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 wasteUnits,
        bytes calldata message,
        string calldata wasteType
    ) external onlySystem(systemContract) {
        address recipient;

        if (context.chainID == BITCOIN) {
            recipient = BytesHelperLib.bytesToAddress(message, 0);
        } else {
            recipient = abi.decode(message, (address));
        }

        _mintNFT(recipient, context.chainID, wasteUnits, wasteType);
    }

    function _mintNFT(
        address recipient,
        uint256 chainId,
        uint256 wasteUnits,
        string memory wasteType
    ) private {
        uint256 tokenId = _nextTokenId;
        _safeMint(recipient, tokenId);
        nftMetadata[tokenId] = NFTMetadata(wasteUnits, wasteType, chainId);
        tokenAmounts[tokenId] = wasteUnits; // Initialize the amount
        tokenChains[tokenId] = chainId; // Initialize the chain ID
        _setTokenURI(tokenId, string(abi.encodePacked("metadata/", tokenId))); // Replace with your metadata logic
        _nextTokenId++;
    }

    function burnNFT(uint256 tokenId, bytes memory recipient) public {
        if (!_isApprovedOrOwner(_msgSender(), tokenId)) {
            revert CallerNotOwnerNotApproved();
        }
        address zrc20 = systemContract.gasCoinZRC20ByChainId(
            nftMetadata[tokenId].chainId
        );

        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFee();

        IZRC20(zrc20).approve(zrc20, gasFee);
        IZRC20(zrc20).withdraw(recipient, tokenAmounts[tokenId] - gasFee);

        _burn(tokenId);
        delete tokenAmounts[tokenId];
        delete tokenChains[tokenId];
        delete nftMetadata[tokenId];
    }

    // Override the _burn function from both ERC721 and ERC721URIStorage
    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    // Override the supportsInterface function from both ERC721 and ERC721URIStorage
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {}
}
