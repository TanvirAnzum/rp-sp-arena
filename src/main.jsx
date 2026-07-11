import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode intentionally removed: it double-invokes effects in dev,
// which doubles every Firestore getDocs/onSnapshot and drains free-tier quota.
createRoot(document.getElementById('root')).render(<App />)
