'use client'
import React, { createContext, useContext, useMemo } from 'react'
import { navigateTo as fallbackNavigateTo } from './utils'
import type { NavigationOptions } from './types'

type NavigateFunction = (url: string, options?: NavigationOptions) => void

const NavigationContext = createContext<NavigateFunction | null>(null)

interface NavigationProviderProps {
  children: React.ReactNode
  customNavigate?: NavigateFunction
}

export const NavigationProvider = ({ children, customNavigate }: NavigationProviderProps) => {
  const navigate = useMemo<NavigateFunction>(() => customNavigate ?? fallbackNavigateTo, [customNavigate])

  return <NavigationContext.Provider value={navigate}>{children}</NavigationContext.Provider>
}

export const useNavigation = (): NavigateFunction => {
  const navigate = useContext(NavigationContext)

  return navigate ?? fallbackNavigateTo
}
