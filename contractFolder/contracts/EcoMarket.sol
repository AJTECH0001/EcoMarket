// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@zetachain/toolkit/contracts/OnlySystem.sol";

contract NFT is zContract, ERC721, ERC721URIStorage, OnlySystem {
    SystemContract public systemContract;
    error CallerNotOwnerNotApproved();
    uint256 constant BITCOIN = 18332;

    struct NFTMetadata {
        uint256 wasteUnits;
        string wasteType;
        uint256 chainId;
    }

    mapping(uint256 => NFTMetadata) public nftMetadata;

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
    ) external override onlySystem(systemContract) {
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

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
