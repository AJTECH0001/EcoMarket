import { useContext } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Bitcoin } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MainNav } from "@/components/Navigation"

export function SiteHeader() {
  // const { bitcoinAddress, connectBitcoin } = useContext(AppContext)

  return (
    <header className="bg-background sticky top-0 z-40 w-full">
      <div className="container px-4 pr-8 flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            
            <ConnectButton
              chainStatus="icon"
              accountStatus={{
                smallScreen: "avatar",
                largeScreen: "full",
              }}
              showBalance={false}
            />
          </nav>
        </div>
      </div>
    </header>
  )
}
