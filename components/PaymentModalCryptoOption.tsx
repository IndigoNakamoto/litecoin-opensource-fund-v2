// components/PaymentModalCryptoOption.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { SiBitcoin, SiLitecoin, SiDogecoin } from 'react-icons/si'
import { useDonation } from '../contexts/DonationContext'
import Image from 'next/image'
import { customImageLoader } from '../utils/customImageLoader'
import ConversionRateCalculator from './ConversionRateCalculator'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'
import Button from './Button'

type Currency = {
  id: string
  name: string
  code: string
  imageUrl: string
  isErc20: boolean
  network: string
  minDonation: number
}

const excludedCoins = ['XRP']

const PaymentModalCryptoOption: React.FC = () => {
  const { state, dispatch } = useDonation()
  const { currencyList, selectedCurrencyName, selectedCurrencyCode } = state

  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCurrencySelect = (currency: Currency) => {
    dispatch({
      type: 'UPDATE_FORM_DATA',
      payload: {
        selectedCurrencyCode: currency.code,
        selectedCurrencyName: currency.name,
        formData: {
          assetName: currency.name,
          assetSymbol: currency.code,
          pledgeCurrency: currency.code,
        },
      },
    })
    setSearchTerm('')
    setShowDropdown(false)
    dispatch({ type: 'SET_DONATE_BUTTON_DISABLED', payload: false })
  }

  const filteredOptions = useMemo(
    () =>
      currencyList
        .filter(
          (c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !excludedCoins.includes(c.name)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [currencyList, searchTerm]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter' && highlightedIndex !== -1) {
      handleCurrencySelect(filteredOptions[highlightedIndex])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const defaultCurrencies = useMemo(
    () =>
      ['Bitcoin', 'Litecoin', 'Dogecoin']
        .map((name) => currencyList.find((c) => c.name === name))
        .filter((c): c is Currency => c !== undefined),
    [currencyList]
  )

  return (
    <div className="flex w-full flex-col gap-4 pt-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {defaultCurrencies.map((currency) => (
          <Button
            key={currency.code}
            onClick={() => handleCurrencySelect(currency)}
            icon={
              currency.name === 'Bitcoin' ? (
                <SiBitcoin className="h-6 w-6" />
              ) : currency.name === 'Litecoin' ? (
                <SiLitecoin className="h-6 w-6" />
              ) : (
                <SiDogecoin className="h-6 w-6" />
              )
            }
            variant={
              selectedCurrencyName === currency.name ? 'primary' : 'secondary'
            }
            className={`order-1 h-12 w-full`}
          >
            {currency.name.toUpperCase()}
          </Button>
        ))}
      </div>

      <div ref={dropdownRef} className="relative flex w-full flex-col">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a coin"
            className="flex w-full rounded-xl border-[#222222] bg-[#f0f0f0] p-2 text-left font-space-grotesk text-[16px] text-[#222222]"
          />
          <div
            className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {showDropdown ? <FaChevronUp /> : <FaChevronDown />}
          </div>
        </div>
        {showDropdown && (
          <ul className="absolute top-full z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
            {filteredOptions.map((currency, index) => (
              <li
                key={currency.code}
                className={`flex cursor-pointer items-center p-2 hover:bg-gray-100 ${
                  index === highlightedIndex ? 'bg-gray-200' : ''
                }`}
                onClick={() => handleCurrencySelect(currency)}
              >
                <Image
                  loader={customImageLoader}
                  src={currency.imageUrl}
                  alt={currency.name}
                  width={24}
                  height={24}
                />
                <span className="ml-2">{currency.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConversionRateCalculator
        selectedCurrencyCode={selectedCurrencyCode || undefined}
        selectedCurrencyName={selectedCurrencyName || undefined}
      />
    </div>
  )
}

export default PaymentModalCryptoOption
