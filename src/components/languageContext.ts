import { createContext, useContext } from 'react'
import { languageFor } from '../data/language.ts'

/** The language being learnt; App remounts everything below when it changes. */
export const LanguageContext = createContext(languageFor(undefined))

export const useLanguage = () => useContext(LanguageContext)
export const useCopy = () => useLanguage().copy
