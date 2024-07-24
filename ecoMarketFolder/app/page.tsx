"use client"

import { useEffect, useState } from "react"
import { useBalanceContext } from "@/context/BalanceContext"
import { useCCTXsContext } from "@/context/CCTXsContext"
import { usePricesContext } from "@/context/PricesContext"
import { useStakingContext } from "@/context/StakingContext"
import { RefreshCw } from "lucide-react"
import { useAccount } from "wagmi"

import { useZetaChainClient } from "@/hooks/useZetaChainClient"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Balances from "@/components/Balances"
import Swap from "@/components/Swap"

import NFTPage from "./nft/page"

const LoadingSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array(5)
        .fill(null)
        .map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
    </div>
  )
}

const ConnectWallet = () => {
  return (
    <Alert>
      <AlertTitle>Connect wallet</AlertTitle>
      <AlertDescription>
        Please, connect wallet to see token balances.
      </AlertDescription>
    </Alert>
  )
}

// const universalSwapContract = "0xb459F14260D1dc6484CE56EB0826be317171e91F"

export default function IndexPage() {
  const { client } = useZetaChainClient()
  const { stakingDelegations } = useStakingContext()
  const { prices } = usePricesContext()
  const { trackTransaction } = useCCTXsContext()

  const { balances, balancesLoading, balancesRefreshing, fetchBalances } =
    useBalanceContext()
  const [sortedBalances, setSortedBalances] = useState([])
  const [showAll, setShowAll] = useState(false)

  const { isConnected } = useAccount()

  const refreshBalances = async () => {
    await fetchBalances(true)
  }

  const toggleShowAll = () => {
    setShowAll(!showAll)
  }

  const balancesPrices = sortedBalances.map((balance: any) => {
    const normalizeSymbol = (symbol: string) => symbol.replace(/^[tg]/, "")
    const normalizedSymbol = normalizeSymbol(balance.symbol)
    const priceObj = prices.find(
      (price: any) => normalizeSymbol(price.symbol) === normalizedSymbol
    )
    return {
      ...balance,
      price: priceObj ? priceObj.price : null,
    }
  })

  const stakingAmountTotal = stakingDelegations.reduce((a: any, c: any) => {
    const amount = BigInt(c.balance.amount)
    return a + amount
  }, BigInt(0))

  useEffect(() => {
    let balance = balances
      .sort((a: any, b: any) => {
        // Prioritize ZETA
        if (a.ticker === "ZETA" && a.coin_type === "Gas") return -1
        if (b.ticker === "ZETA" && b.coin_type === "Gas") return 1
        if (a.coin_type === "Gas" && b.coin_type !== "Gas") return -1
        if (a.coin_type !== "Gas" && b.coin_type === "Gas") return 1
        return a.chain_name < b.chain_name ? -1 : 1
      })
      .filter((b: any) => b.balance > 0)
    setSortedBalances(balance)
  }, [balances])

  const balancesTotal = balancesPrices.reduce(
    (a: any, c: any) => a + parseFloat(c.balance),
    0
  )

  const formatBalanceTotal = (b: string) => {
    if (parseFloat(b) > 1000) {
      return parseInt(b).toLocaleString()
    } else {
      return parseFloat(b).toFixed(2)
    }
  }

  return (
    <>
      <main>
        <div className="bg-green-200 relative">
          <div className=" py-12">
            <div className="container mx-auto max-w-7xl px-4 lg:px-6 flex items-center h-full py-4 z-50">
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-x-5 gap-y-12 px--2 ">
                <div className="w-full md:w-5/6 ">
                  <div>
                    <h1 className="text-5xl lg:text-7xl font-extrabold text-[#351F0F]">
                      Get Rewarded for Recycling
                    </h1>
                  </div>
                  <div className="mb-10 mt-5">
                    <p className="text-base text-[#3F3F3F]">
                      Ecomarket enables companies directly reward individuals &
                      recyclers for donating recyclables
                    </p>
                  </div>

                  <div>
                    <div>
                      <button className="text-md text-white hover:text-[#12B76A] hover:bg-white  hover:border-[#12B76A] hover:border  border border-[#12B76A] bg-[#12B76A] rounded-full px-6 py-3 transition duration-300 ease">
                        Earn rewards
                      </button>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="flex justify-center items-center lg:items-start w-full  h-auto relative z-50"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <NFTPage />

        <section className=" py-20">
          <div className="container mx-auto max-w-7xl px-3 lg:px-6">
            <div className="mb-9 text-center max-w-md mx-auto text-[#1A202B]">
              <h2 className=" text-3xl h2 mb-4">
                What you can recycle via EcoMarket
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-[#FDFAF8] flex items-center justify-center gap-1 flex-col max-w-full w-[220px] py-4 px-2 text-center mx-auto what_to_buy_card transition-all duration-200 ease-in-out">
                <div className="w-36 h-36 relative"></div>
                <h6>Glass bottles</h6>
              </div>
              <div className="rounded-lg bg-[#F6FFFB] flex items-center justify-center gap-1 flex-col max-w-full w-[220px] py-4 px-2 text-center mx-auto what_to_buy_card transition-all duration-200 ease-in-out ">
                <div className="w-36 h-36 relative"></div>
                <h6>PET bottles</h6>
              </div>

              <div className="rounded-lg bg-[#FDFAF8] flex items-center justify-center gap-1 flex-col max-w-full w-[220px] py-4 px-2 text-center mx-auto what_to_buy_card transition-all duration-200 ease-in-out">
                <div className="w-36 h-36 relative"></div>
                <h6>Electronics Waste</h6>
              </div>

              <div className="rounded-lg bg-[#F6FFFB] flex items-center justify-center gap-1 flex-col max-w-full w-[220px] py-4 px-2 text-center mx-auto what_to_buy_card transition-all duration-200 ease-in-out">
                <div className="w-36 h-36 relative"></div>
                <h6>New/used cartons</h6>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 features__section">
          <div className=" ">
            <div>
              <div className="relative">
                <div className="container mx-auto px-4 md:px-12 z-20">
                  <div className="grid grid-cols-1 py-14 lg:py-44 gap-10 md:grid-cols-2 lg:px-6">
                    <div className="order-first md:order-first z-20">
                      <div className="pr-0 lg:pr-16">
                        <h2 className="text-left text-sm h2 text-[#12B76A] font-semibold mb-3">
                          Features
                        </h2>
                        <h3 className="mb-4 text-[26px] font-semibold text-[#1A202B]">
                          Gamified EcoMarket
                        </h3>
                        <p className="mb-3">
                          The beating heart of EcoMarket is our gamified app
                          that transforms recycling and sustainability education
                          into an engaging and rewarding experience.
                        </p>
                        <p className="mb-3">
                          Users earn EcoCredits, our utility token, by engaging
                          in eco-friendly activities - attending cleanup events,
                          depositing plastics through deposit centers or our
                          innovative home-built reverse vending machines,
                          strategically placed in public areas.
                        </p>
                        <p className="mb-3">
                          EcoCredits can be redeemed for vouchers, airtime, and
                          sometimes even cash. We also have a leaderboard, which
                          fosters healthy competition amongst recyclers.
                        </p>

                        <div className="mt-5">
                          <button className="text-white px-12 py-3 text-sm bg-[#12B76A] rounded-[48px] ">
                            Get started
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end z-20">
                      <div className="features-img flex items-center justify-center relative h-full w-full"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 pointer-events-none z-10 hidden lg:block"></div>
              </div>

              <div className="relative">
                <div className="container mx-auto px-4 md:px-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 py-14 lg:py-44 gap-10 lg:px-6">
                    <div className="order-first md:order-first">
                      <div className="pr-0 lg:pr-16">
                        <h3 className="mb-4 text-[26px] font-semibold text-[#1A202B]">
                          Reverse Vending Revolution
                        </h3>
                        <p className="mb-3">
                          Introducing Africa&apos;s first home-built reverse
                          vending machine, designed to make recycling more
                          accessible to all.
                        </p>
                        <p className="mb-3">
                          These machines accept plastic deposits, instantly
                          rewarding users with EcoCredits. Our goal is to ensure
                          that the reverse vending machines are low-cost, simple
                          to use, portable and customized to the needs of the
                          local audience, thus encouraging more Africans to make
                          recycling a routine part of their daily lives.
                        </p>
                        <div className="mt-5">
                          <button
                            className="text-[#005AFF] px-12 py-3 text-sm bg-[#E0EBFF] rounded-[48px] opacity-60 cursor-default"
                            aria-disabled
                          >
                            Coming Soon..
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end z-20">
                      <div className="features-img flex items-center justify-center relative h-full w-full "></div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 pointer-events-none -z-10  hidden lg:block"></div>
              </div>
              <div className="relative">
                <div className="container mx-auto px-4 md:px-12 ">
                  <div className="grid grid-cols-1 md:grid-cols-2 py-14 lg:py-44 gap-10 lg:px-6 z-20">
                    <div className="order-first md:order-first z-20">
                      <div className="pr-0 lg:pr-16">
                        <h3 className="mb-4 text-[26px] font-semibold text-[#1A202B]">
                          UBI-inspired Shared Income
                        </h3>
                        <p className="mb-3">
                          Our Universal Basic Income (UBI)-inspired shared
                          income model targets residents in low-income
                          neighborhoods, incentivizing their participation in
                          eco-friendly activities.
                        </p>
                        <p className="mb-3">
                          We&apos;ll actively engage with low-income
                          neighborhoods, registering individuals who wish to
                          participate. Each time they dropoff plastics or
                          participate in eco-friendly activities, their
                          engagement is recorded, and they subsequently get SMS
                          alerts confirming their rewards once validated.
                        </p>
                        <p className="mb-3">
                          In this way, we contribute to a circular economy and
                          empower individuals to contribute to a sustainable
                          future.
                        </p>
                        <div className="mt-5">
                          <button
                            className="text-[#005AFF] px-12 py-3 text-sm bg-[#E0EBFF] rounded-[48px] opacity-60 cursor-default"
                            aria-disabled
                          >
                            Coming Soon..
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end z-20">
                      <div className="features-img flex items-center justify-center relative h-full w-full "></div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 pointer-events-none -z-10  hidden lg:block"></div>
              </div>
            </div>
          </div>
        </section>

        <div className="min-h-[32.32rem] relative h-full bg-[#EAECEB] flex items-center">
          <div className="flex items-center justify-between h-full w-full flex-wrap ">
            <div className="w-full lg:w-5/12 px-6 md:px-12 space-y-3 container mx-auto h-full flex items-start first-letter: justify-center flex-col py-12 gap-2 rounded-lg text-left ">
              <h3 className="text-7xl text-[#1C334D] font-medium z-20">
                Help sustain our world
              </h3>
              <div className="text-left z-20">
                <h5 className="text-[#1C334D] text-[22px] ">
                  Take your first step into a greener future and earn rewards
                  along the way
                </h5>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
