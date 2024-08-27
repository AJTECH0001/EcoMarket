"use client"

import { useEffect } from "react"
import { useCCTXsContext } from "@/context/CCTXsContext"
import { AnimatePresence, motion } from "framer-motion"
import { debounce } from "lodash"
import { Flame, Loader, RefreshCw, Send, Sparkles } from "lucide-react"
import { Tilt } from "react-next-tilt"
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useBurn } from "./burn"
import { useFetchNFTs } from "./fetchNFTs"
import { useMint } from "./mint"
import { useTransfer } from "./transfer"
import { useNFT } from "./useNFT"

const NFTPage = () => {
  const {
    assets,
    selectedChain,
    setSelectedChain,
    amount,
    setAmount,
    assetsReloading,
    assetsUpdating,
    assetsBurned,
    mintingInProgress,
    recipient,
    setRecipient,
    foreignCoins,
  } = useNFT()
  const { cctxs } = useCCTXsContext()
  const { switchNetwork } = useSwitchNetwork()
  const { chain } = useNetwork()
  const { transfer } = useTransfer()
  const { mint } = useMint()
  const { burn } = useBurn()
  const { fetchNFTs } = useFetchNFTs()

  const { address } = useAccount()

  const handleSwitchNetwork = async () => {
    if (chain?.id) {
      switchNetwork?.(selectedChain)
    }
  }

  const debouncedFetchNFTs = debounce(fetchNFTs, 1000)

  useEffect(() => {
    debouncedFetchNFTs()
  }, [address, JSON.stringify(cctxs)])

  const colors: any = {
    5: "bg-gradient-to-bl from-[#141414] via-[#343434] to-[#3a3a3a]",
    97: "bg-gradient-to-br from-[#d6a000] via-[#f1bb1e] to-[#ffbe00]",
    18332: "bg-gradient-to-br from-[#f7931a] via-[#f7931a] to-[#ffb04f]",
    80001: "bg-gradient-to-bl from-[#7a40e5] via-[#8640e5] to-[#992fce]",
  }

  const coins = foreignCoins
    .filter((a: any) => a.coin_type === "Gas")
    .map((a: any) => ({ chain_id: a.foreign_chain_id, symbol: a.symbol }))

  const wrongNetwork =
    !selectedChain ||
    parseInt(selectedChain) === 18332 ||
    parseInt(selectedChain) === chain?.id

  const formatAmount = (amount: any) => {
    const a = Number(amount)
    let formatted = a.toPrecision(2)
    return a % 1 === 0 ? parseInt(formatted) : parseFloat(formatted)
  }

  return (
    <div className="px-4 mt-12">  
    <div className="flex items-center justify-between mb-6">  
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">  
        NFT Library  
      </h1>  
      <Button size="icon" variant="primary" onClick={fetchNFTs}>  
        <RefreshCw className={`h-5 w-5 ${assetsReloading ? "animate-spin" : ""}`} />  
      </Button>  
    </div>  
  
    <div className="flex flex-wrap justify-center gap-6 mt-10">  
      <div className="bg-white rounded-xl shadow-lg p-6 w-96">  
        <Input  
          placeholder="0"  
          type="number"  
          value={amount}  
          onChange={(e) => setAmount(e.target.value)}  
          className="text-5xl font-semibold bg-gray-100 border border-gray-300 focus:outline-none focus:ring focus:ring-blue-500"  
        />  
        <Select onValueChange={(e) => setSelectedChain(e)} className="mt-4">  
          <SelectTrigger className="w-full bg-gray-100 border border-gray-300 text-2xl font-semibold">  
            <SelectValue placeholder="Select Token" />  
          </SelectTrigger>  
          <SelectContent className="shadow-lg rounded-lg">  
            {coins.map((c) => (  
              <SelectItem key={c.chain_id} value={c.chain_id}>  
                {c.symbol}  
              </SelectItem>  
            ))}  
          </SelectContent>  
        </Select>  
        <div className="flex justify-center mt-4">  
          {wrongNetwork ? (  
            <Button  
              variant="primary"  
              disabled={!(amount > 0) || !selectedChain || mintingInProgress}  
              onClick={() => mint(selectedChain)}  
            >  
              {mintingInProgress ? (  
                <Loader className="h-5 w-5 mr-2 animate-spin" />  
              ) : (  
                <Sparkles className="h-5 w-5 mr-2" />  
              )}  
              Mint  
            </Button>  
          ) : (  
            <Button  
              variant="secondary"  
              onClick={handleSwitchNetwork}  
            >  
              Switch Network  
            </Button>  
          )}  
        </div>  
      </div>  
  
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">  
        <AnimatePresence>  
          {assets.length > 0 &&  
            assets.map((asset) => {  
              if (assetsBurned.includes(asset.id)) return null;  
              return (  
                <motion.div  
                  layout  
                  initial={{ opacity: 0 }}  
                  animate={{ opacity: 1 }}  
                  exit={{ opacity: 0 }}  
                  transition={{ duration: 0.5 }}  
                  className="bg-white rounded-xl shadow-lg p-4 overflow-hidden"  
                  key={asset.id}  
                >  
                  <Popover>  
                    <PopoverTrigger>  
                      <Tilt lineGlareBlurAmount="40px" scale={1.05}>  
                        <div className={`relative h-60 rounded-xl overflow-hidden ${colors[asset?.chain]} p-4`}>  
                          <div className={`absolute top-0 left-0 w-full h-full flex items-center justify-center transition-opacity ${assetsUpdating.includes(asset.id) ? "opacity-100" : "opacity-0"}`}>  
                            <Loader className="text-white animate-spin" size={48} />  
                          </div>  
                          <p className="text-5xl font-semibold text-transparent bg-clip-text tracking-tight bg-gradient-to-br from-gray-900 to-transparent text-shadow">  
                            {formatAmount(asset?.amount)}  
                          </p>  
                          <p className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-transparent">  
                            {coins.find(c => c.chain_id === asset?.chain)?.symbol}  
                          </p>  
                          <p className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-transparent mt-4">  
                            # {asset.id}  
                          </p>  
                        </div>  
                      </Tilt>  
                    </PopoverTrigger>  
                    <PopoverContent  
                      sideOffset={-20}  
                      className="w-full p-0 bg-white shadow-lg rounded-lg border-none"  
                    >  
                      {chain?.id === 7001 ? (  
                        <div className="flex gap-2">  
                          <Button  
                            disabled={assetsUpdating.includes(asset.id)}  
                            onClick={() => burn(asset.id)}  
                            className="hover:bg-red-500"  
                          >  
                            <Flame className="h-4 w-4" />  
                          </Button>  
                          <Popover>  
                            <PopoverTrigger asChild>  
                              <Button className="hover:bg-blue-500">  
                                <Send className="h-4 w-4" />  
                              </Button>  
                            </PopoverTrigger>  
                            <PopoverContent className="bg-white w-64 rounded-xl p-4 shadow-lg border-none">  
                              <Input  
                                disabled={assetsUpdating.includes(asset.id)}  
                                placeholder="Recipient address"  
                                value={recipient}  
                                onChange={(e) => setRecipient(e.target.value)}  
                                className="mb-2"  
                              />  
                              <Button  
                                disabled={assetsUpdating.includes(asset.id)}  
                                variant="outline"  
                                onClick={() => transfer(asset.id)}  
                              >  
                                Transfer asset  
                              </Button>  
                            </PopoverContent>  
                          </Popover>  
                        </div>  
                      ) : (  
                        <Button  
                          variant="secondary"  
                          onClick={() => switchNetwork && switchNetwork(7001)}  
                        >  
                          Switch Network  
                        </Button>  
                      )}  
                    </PopoverContent>  
                  </Popover>  
                </motion.div>  
              );  
            })}  
        </AnimatePresence>  
      </div>  
    </div>  
  </div>
  )
}

export default NFTPage
