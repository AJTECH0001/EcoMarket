import { abi } from "../abi/EcoMarket.sol/NFT.json"
import { ethers } from "ethers"
import { useAccount } from "wagmi"

import { useEthersSigner } from "@/hooks/useEthersSigner"

import { useFetchNFTs } from "./fetchNFTs"
import { useNFT } from "./useNFT"

export const useTransfer = () => {
  const { setAssetsUpdating, assetsUpdating, recipient, omnichainContract } =
    useNFT()
  const { address } = useAccount()
  const { fetchNFTs } = useFetchNFTs()
  const signer = useEthersSigner()

  const transfer = async (id: any) => {
    const checkNFTOwnership = async (nftId: any, contract: any) => {
      const owner = await contract.ownerOf(nftId)
      await new Promise((resolve) => setTimeout(resolve, 5000))
      if (owner === address) {
        checkNFTOwnership(nftId, contract)
      } else {
        await fetchNFTs()
        setAssetsUpdating(assetsUpdating.filter((a: any) => a !== id))
      }
    }

    try {
      setAssetsUpdating((b: any) => (b.includes(id) ? b : [...b, id]))
      const contract = new ethers.Contract(omnichainContract, abi, signer)
      await contract.transferFrom(address, recipient, id)
      await checkNFTOwnership(id, contract)
    } catch (e) {
      setAssetsUpdating(assetsUpdating.filter((a: any) => a !== id))
    }
  }

  return { transfer }
}
