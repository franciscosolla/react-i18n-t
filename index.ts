// import i18n-t from 'i18n-t'

/* 
const i18n = i18n-t.createManager(
    {
        en, fr, pt
    },
    {

    }
)
*/

// export default i18n

// const t = i18n.useTraslator()

// i18n.setLocale('pt')

import { useState, useEffect, useCallback, useMemo } from 'react'
import { BehaviorSubject } from 'rxjs'

type NonStringPropertyKeys<T> = {
    [P in keyof T]: string extends T[P] ? never : P
}[keyof T];

type StringPropertyKeys<T> = {
    [P in keyof T]: string extends T[P] ? P : never
}[keyof T]

type SelectedPropertyKeys<T, K extends keyof T = never> = StringPropertyKeys<T> | (K extends never ? never : StringPropertyKeys<T[K]>)

export interface Translation {
    [key: string]: string | { [key: string]: string }
}

export interface TranslationCollection<T extends Translation> {
    [key: string]: T
}

export interface Config<T extends Translation, C extends TranslationCollection<T>> {
    default?: keyof C
}


export function createManager<T extends Translation, C extends TranslationCollection<T>>(translations: C, config?: Config<T, C>) {

    let defaultTranslationKey: keyof C

    if (config && config.default) defaultTranslationKey = config.default
    else {
        const translationKeys = Object.keys(translations)
        if (translationKeys.length) defaultTranslationKey = translationKeys[0]
        else throw new Error('react-i18n-t: you have to define at least one translation set')
    }

    const TRANSLATION_KEY = new BehaviorSubject(defaultTranslationKey)

    function tBuilder<K extends NonStringPropertyKeys<T>>(translationKey: keyof C, key?: K) {

        const translation = translations[translationKey]

        const t = {
            _: (key: SelectedPropertyKeys<T, K>) => {}
        } as {_: (key: SelectedPropertyKeys<T, K>) => void} & { [key in SelectedPropertyKeys<T, K>]: string }

        Object.keys(translation).forEach(k => {
            if (translation[k] instanceof String) t[k] = translation[k]
        })

        if (key) Object.keys(translation[key]).forEach(k => t[k] = translation[key][k])

        return t
    }

    function useTranslator<K extends NonStringPropertyKeys<T>>(key?: K) {

        const [translationKey, setTranslationKey] = useState(TRANSLATION_KEY.value)

        const t = useMemo(() => tBuilder(translationKey, key), [translationKey])

        useEffect(() => {
            const subscription = TRANSLATION_KEY.subscribe(setTranslationKey)
            return () => subscription.unsubscribe()
        }, [])

        return t
    }

    return {
        useTranslator,
        useT: useTranslator,
        tBuilder
    }
}