import { useFeesContext } from "@/context/FeesContext"
import { abi } from "../abi/EcoMarket.sol/NFT.json"
import { ethers } from "ethers"
import { useAccount } from "wagmi"

import { useEthersSigner } from "@/hooks/useEthersSigner"

import { useFetchNFTs } from "./fetchNFTs"
import { useNFT } from "./useNFT"

export const useBurn = () => {
  const {
    assetsUpdating,
    setAssetsUpdating,
    setAssetsBurned,
    ecoMarketContract,
  } = useNFT()
  const { setInbounds, inbounds } = useFeesContext()
  const { address } = useAccount()
  const signer = useEthersSigner()
  const { fetchNFTs } = useFetchNFTs()

  const burn = async (id: any) => {
    try {
      const checkApproval = async (
        id: any,
        contract: any
      ): Promise<boolean | void> => {
        try {
          const approved = await contract.getApproved(id)
          if (approved.toLowerCase() === ecoMarketContract.toLowerCase()) {
            return true
          } else {
            await contract.approve(ecoMarketContract, id)
            for (let i = 0; i < 5; i++) {
              await new Promise((resolve) => setTimeout(resolve, 5000))
              const approved = await contract.getApproved(id)
              if (approved.toLowerCase() === ecoMarketContract.toLowerCase()) {
                return true
              }
            }
          }
          checkApproval(id, contract)
        } catch (e) {
          console.error("Approval process cancelled.", e)
          return false
        }
      }

      const checkNFTOwnership = async (nftId: any, contract: any) => {
        try {
          await contract.ownerOf(nftId)
          await new Promise((resolve) => setTimeout(resolve, 5000))
          checkNFTOwnership(nftId, contract)
        } catch (e) {
          setAssetsBurned((b: any) => (b.includes(id) ? b : [...b, id]))
          setAssetsUpdating(assetsUpdating.filter((a: any) => a !== nftId))
          return await fetchNFTs()
        }
      }

      setAssetsUpdating((b: any) => (b.includes(id) ? b : [...b, id]))
      const contract = new ethers.Contract(ecoMarketContract, abi, signer)
      if (await checkApproval(id, contract)) {
        const cctxHash = await contract.burnNFT(parseInt(id), address)
        await checkNFTOwnership(id, contract)
        const inbound = {
          inboundHash: cctxHash.hash,
          desc: `Burning an NFT`,
        }
        setInbounds([...inbounds, inbound])
      } else {
        setAssetsUpdating(assetsUpdating.filter((a: any) => a !== id))
        console.error("Burn cancelled.")
      }
    } catch (e) {
      console.error(e)
      setAssetsUpdating(assetsUpdating.filter((a: any) => a !== id))
    }
  }
  return { burn }
}
