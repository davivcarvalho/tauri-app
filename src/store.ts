import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export enum ConnectionStatus { "IDDLE", 'SUCCESS', "FAIL", "TESTING" }

type PersistedStoreProps = {
    ips: {
        monitor: string
        radioOne: string
        radioTwo: string
        radioThree: string
    },
    setIps: (data: Partial<PersistedStoreProps['ips']>) => void
    connectionsStatus: {
        monitor: ConnectionStatus
        radioOne: ConnectionStatus
        radioTwo: ConnectionStatus
        radioThree: ConnectionStatus
    }
    setConnectionsStatus: (data: Partial<PersistedStoreProps['connectionsStatus']>) => void
    directConnection: boolean
    setDirectConnection: (data: PersistedStoreProps['directConnection']) => void
}

export const usePersistedStore = create(
    persist<PersistedStoreProps>(
        (set) => ({
            ips: {
                monitor: '',
                radioOne: '',
                radioTwo: '',
                radioThree: ''
            },
            setIps: (data: Partial<PersistedStoreProps['ips']>) => set(state => ({ ips: { ...state.ips, ...data } })),
            connectionsStatus: {
                monitor: ConnectionStatus.IDDLE,
                radioOne: ConnectionStatus.IDDLE,
                radioTwo: ConnectionStatus.IDDLE,
                radioThree: ConnectionStatus.IDDLE
            },
            setConnectionsStatus: (data: Partial<PersistedStoreProps['connectionsStatus']>) => set(state => ({ connectionsStatus: { ...state.connectionsStatus, ...data } })),
            directConnection: false,
            setDirectConnection: (data) => set({ directConnection: data })
        }),
        {
            name: 'scm-ping-storage', // name of the item in the storage (must be unique)
        },
    ),
)


type StoreProps = {
    connectionsStatus: {
        monitor: ConnectionStatus
        radioOne: ConnectionStatus
        radioTwo: ConnectionStatus
        radioThree: ConnectionStatus
    }
    setConnectionsStatus: (data: Partial<PersistedStoreProps['connectionsStatus']>) => void
}

export const useStore = create<StoreProps>(
    (set) => ({
        connectionsStatus: {
            monitor: ConnectionStatus.IDDLE,
            radioOne: ConnectionStatus.IDDLE,
            radioTwo: ConnectionStatus.IDDLE,
            radioThree: ConnectionStatus.IDDLE
        },
        setConnectionsStatus: (data: Partial<StoreProps['connectionsStatus']>) => set(state => ({ connectionsStatus: { ...state.connectionsStatus, ...data } })),
    })

)