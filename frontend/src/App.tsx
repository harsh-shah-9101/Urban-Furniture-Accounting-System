import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/providers/AppProviders'
import { router } from '@/router/router'

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </AppProviders>
  )
}

export default App
