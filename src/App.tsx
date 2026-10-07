import { EditorProvider } from './context/EditorContext'
import { Editor } from './components/editor/Editor'
import { EditorErrorBoundary } from './components/ui/ErrorBoundary'

export default function App() {
  return (
    <EditorErrorBoundary>
      <EditorProvider>
        <Editor />
      </EditorProvider>
    </EditorErrorBoundary>
  )
}
