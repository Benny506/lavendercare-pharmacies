import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { UiContext } from './uiContextBase.js'

const MotionDiv = motion.div

export function UiProvider({ children }) {
  const [alert, setAlert] = useState(null)
  const [loadingCount, setLoadingCount] = useState(0)

  const showAlert = useCallback((type, message, duration = 5000) => {
    const id = Date.now()
    setAlert({ id, type, message })
    window.setTimeout(() => {
      setAlert(current => (current && current.id === id ? null : current))
    }, duration)
  }, [])

  const clearAlert = useCallback(() => {
    setAlert(null)
  }, [])

  const startLoading = useCallback(() => {
    setLoadingCount(1)
  }, [])

  const stopLoading = useCallback(() => {
    setLoadingCount(0)
  }, [])

  const value = {
    alert,
    showAlert,
    clearAlert,
    loading: loadingCount > 0,
    startLoading,
    stopLoading,
  }

  return (
    <UiContext.Provider value={value}>
      {children}
      <GlobalLoader active={loadingCount > 0} />
      <GlobalAlert alert={alert} clearAlert={clearAlert} />
    </UiContext.Provider>
  )
}

function GlobalLoader({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <div className="pi-loader-overlay">
          <section className="pi-loader">
            <div className="pi-loader__orbit">
              <div className="pi-loader__orbit-ring" />
              <div className="pi-loader__orbit-dot" />
            </div>
            <div className="pi-loader__logo">
              <img src="/logo.svg" alt="LavenderCare" />
            </div>
            <div className="pi-loader__copy">
              <div className="pi-loader__title">LavenderCare Inventory</div>
              <div className="pi-loader__text">Preparing your workspace...</div>
            </div>
          </section>
        </div>
      )}
    </AnimatePresence>
  )
}

function GlobalAlert({ alert, clearAlert }) {
  return (
    <div className="pi-alert-portal">
      <AnimatePresence>
        {alert && (
          <MotionDiv
            key={alert.id}
            className={`pi-alert pi-alert--${alert.type}`}
            initial={{ y: -32, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -24, opacity: 0, scale: 0.9 }}
            transition={{
              type: 'spring',
              stiffness: 520,
              damping: 30,
              mass: 0.9,
            }}
          >
            <div className="pi-alert__icon">
              {alert.type === 'success' && '✔'}
              {alert.type === 'error' && '⛔'}
              {alert.type === 'info' && 'ℹ'}
              {alert.type === 'warning' && '⚠'}
            </div>
            <div className="pi-alert__content">{alert.message}</div>
            <button
              type="button"
              className="pi-alert__close"
              onClick={clearAlert}
              aria-label="Close alert"
            >
              ×
            </button>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  )
}
