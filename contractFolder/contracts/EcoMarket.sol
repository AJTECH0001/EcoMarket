// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@zetachain/toolkit/contracts/OnlySystem.sol";

contract NFTMarketplace is ERC721, ERC721URIStorage, OnlySystem, zContract {
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
    mapping(uint256 => uint256) public listings; // Mapping from tokenId to listing price
    mapping(uint256 => bool) public isListed; // Mapping to check if an NFT is listed for sale
    mapping(uint256 => address) public offers; // Mapping from tokenId to buyer offers

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
        delete listings[tokenId];
        delete isListed[tokenId];
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

    // --- New Functionality for E-Market NFT Marketplace ---

    // 1. List an NFT for sale
    function listItem(uint256 tokenId, uint256 price) external {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Caller is not owner nor approved");
        require(price > 0, "Price must be greater than zero");
        listings[tokenId] = price;
        isListed[tokenId] = true;
    }

    // 2. Buy a listed NFT
    function buyItem(uint256 tokenId) external payable {
        require(isListed[tokenId], "Item not listed for sale");
        require(msg.value >= listings[tokenId], "Insufficient payment");

        address seller = ownerOf(tokenId);
        _transfer(seller, _msgSender(), tokenId);

        // Transfer payment to the seller
        payable(seller).transfer(msg.value);

        isListed[tokenId] = false; // Unlist the NFT after purchase
        delete listings[tokenId]; // Remove the listing
    }

    // 3. Cancel a listing
    function cancelListing(uint256 tokenId) external {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Caller is not owner nor approved");
        isListed[tokenId] = false;
        delete listings[tokenId];
    }

    // 4. Make an offer for an NFT
    function makeOffer(uint256 tokenId) external payable {
        require(msg.value > 0, "Offer price must be greater than zero");
        offers[tokenId] = msg.sender;
    }

    // 5. Accept an offer
    function acceptOffer(uint256 tokenId) external payable {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Caller is not owner nor approved");
        address buyer = offers[tokenId];
        require(buyer != address(0), "No offer available");

        _transfer(ownerOf(tokenId), buyer, tokenId);

        payable(ownerOf(tokenId)).transfer(msg.value); // Transfer payment to the seller
        delete offers[tokenId]; // Clear the offer
    }

    // 6. Withdraw funds (for sellers)
    function withdrawFunds() external {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(_msgSender()).transfer(balance);
    }

    // 7. Update listing price
    function updateListingPrice(uint256 tokenId, uint256 newPrice) external {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Caller is not owner nor approved");
        require(isListed[tokenId], "Item is not listed");
        listings[tokenId] = newPrice;
    }

    // 8. Royalty distribution (placeholder logic)
    function royaltyDistribution(uint256 tokenId, uint256 salePrice) private {
        // Implement logic to distribute a percentage of the sale price to the original creator
    }

    // 9. Fetch all marketplace items
    function fetchMarketplaceItems() external view returns (uint256[] memory) {
        uint256 totalSupply = _nextTokenId;
        uint256[] memory items = new uint256[](totalSupply);
        uint256 itemCount = 0;

        for (uint256 i = 0; i < totalSupply; i++) {
            if (isListed[i]) {
                items[itemCount] = i;
                itemCount++;
            }
        }

        return items;
    }
}
