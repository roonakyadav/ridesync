import { createContext } from 'react'

// Placeholder — full NotificationProvider added in a later phase.
export const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {},
})

export default function NotificationProvider({ children }) {
  return <NotificationContext.Provider value={{ notifications: [], addNotification: () => {} }}>{children}</NotificationContext.Provider>
}
