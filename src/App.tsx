import { useEffect, useState } from 'react'
import { useStudio } from './store/studio'
import { useLibrary } from './store/library'
import { getApiStatus } from './interpret/client'
import PromptBar from './components/PromptBar'
import Controls from './components/Controls'
import DisplayStage from './components/DisplayStage'
import TypefaceStage from './components/TypefaceStage'
import Library from './components/Library'
import type { Creation } from './engine/types'

type Tab = 'display' | 'typeface' | 'library'

export default function App() {
  const [tab, setTab] = useState<Tab>('display')
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null)
  const setMode = useStudio((s) => s.setMode)
  const loadCreation = useStudio((s) => s.loadCreation)
  const loadLibrary = useLibrary((s) => s.load)
  const count = useLibrary((s) => s.creations.length)

  useEffect(() => {
    loadLibrary()
    getApiStatus()
      .then((s) => setApiAvailable(s.available))
      .catch(() => setApiAvailable(false))
  }, [loadLibrary])

  function selectTab(t: Tab) {
    setTab(t)
    if (t === 'display' || t === 'typeface') setMode(t)
  }

  function openCreation(c: Creation) {
    loadCreation(c)
    setTab(c.mode)
  }

  const showSidebar = tab !== 'library'

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="spark">✦</span> Typeforge <small>original type studio</small>
        </div>
        <nav className="tabs">
          <button className={tab === 'display' ? 'active' : ''} onClick={() => selectTab('display')}>
            Display
          </button>
          <button className={tab === 'typeface' ? 'active' : ''} onClick={() => selectTab('typeface')}>
            Typeface
          </button>
          <button className={tab === 'library' ? 'active' : ''} onClick={() => selectTab('library')}>
            Library{count ? ` (${count})` : ''}
          </button>
        </nav>
        <span className="spacer" />
        <span className={`status-badge ${apiAvailable ? 'live' : ''}`}>
          <span className="dot" />
          {apiAvailable == null ? 'checking…' : apiAvailable ? 'Claude connected' : 'Offline mode'}
        </span>
      </header>

      {showSidebar ? (
        <div className="workspace">
          <aside className="sidebar">
            <PromptBar apiAvailable={apiAvailable} />
            <Controls />
          </aside>
          <main className="stage">{tab === 'display' ? <DisplayStage /> : <TypefaceStage />}</main>
        </div>
      ) : (
        <main className="stage">
          <Library onOpen={openCreation} />
        </main>
      )}
    </div>
  )
}
