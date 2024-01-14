import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export enum ConnectionStatus { "IDDLE", 'SUCCESS', "FAIL", "TESTING" }

type StoreProps = {
    ips: {
        monitor: ''
        radioOne: ''
        radioTwo: ''
        radioThree: ''
    },
    setIps: (data: Partial<StoreProps['ips']>) => void
    connectionsStatus: {
        monitor: ConnectionStatus
        radioOne: ConnectionStatus
        radioTwo: ConnectionStatus
        radioThree: ConnectionStatus
    }
    setConnectionsStatus: (data: Partial<StoreProps['connectionsStatus']>) => void
}

export const useStore = create(
    persist<StoreProps>(
        (set) => ({
            ips: {
                monitor: '',
                radioOne: '',
                radioTwo: '',
                radioThree: ''
            },
            setIps: (data: Partial<StoreProps['ips']>) => set(state => ({ ips: { ...state.ips, ...data } })),
            connectionsStatus: {
                monitor: ConnectionStatus.IDDLE,
                radioOne: ConnectionStatus.IDDLE,
                radioTwo: ConnectionStatus.IDDLE,
                radioThree: ConnectionStatus.IDDLE
            },
            setConnectionsStatus: (data: Partial<StoreProps['connectionsStatus']>) => set(state => ({ connectionsStatus: { ...state.connectionsStatus, ...data } }))
        }),
        {
            name: 'scm-ping-storage', // name of the item in the storage (must be unique)
        },
    ),
)
