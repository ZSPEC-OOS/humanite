import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ControlPanel } from '../ControlPanel'
import { useEditorStore }   from '@/stores/editorStore'
import { useHumanizeStore } from '@/stores/humanizeStore'
import { useScanStore }     from '@/stores/scanStore'

// Reset stores between tests
beforeEach(() => {
  useEditorStore.setState({ text: '' })
  useHumanizeStore.setState({ status: 'idle', error: null, response: null })
  useScanStore.setState({ status: 'idle', error: null, response: null })
})

describe('ControlPanel', () => {
  it('disables Humanize and Scan buttons when text is empty', () => {
    render(<ControlPanel />)
    expect(screen.getByText('Humanize')).toBeDisabled()
    expect(screen.getByText('Scan')).toBeDisabled()
  })

  it('disables buttons when text is under 20 characters', () => {
    useEditorStore.setState({ text: 'Too short.' })
    render(<ControlPanel />)
    expect(screen.getByText('Humanize')).toBeDisabled()
    expect(screen.getByText('Scan')).toBeDisabled()
  })

  it('enables buttons when text is 20+ characters', () => {
    useEditorStore.setState({ text: 'This is long enough to qualify.' })
    render(<ControlPanel />)
    expect(screen.getByText('Humanize')).not.toBeDisabled()
    expect(screen.getByText('Scan')).not.toBeDisabled()
  })

  it('shows spinner when humanizing', () => {
    useEditorStore.setState({ text: 'This is long enough to qualify.' })
    useHumanizeStore.setState({ status: 'loading' })
    render(<ControlPanel />)
    expect(screen.getByText('Humanizing…')).toBeTruthy()
  })

  it('shows spinner when scanning', () => {
    useEditorStore.setState({ text: 'This is long enough to qualify.' })
    useScanStore.setState({ status: 'loading' })
    render(<ControlPanel />)
    expect(screen.getByText('Scanning…')).toBeTruthy()
  })

  it('calls humanize store on button click', async () => {
    const mockHumanize = vi.fn()
    useEditorStore.setState({ text: 'This is definitely long enough text to submit.' })
    useHumanizeStore.setState({ humanize: mockHumanize } as any)
    render(<ControlPanel />)
    fireEvent.click(screen.getByText('Humanize'))
    expect(mockHumanize).toHaveBeenCalledOnce()
  })

  it('intensity slider updates store', () => {
    render(<ControlPanel />)
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '8' } })
    expect(useHumanizeStore.getState().settings.intensity).toBe(8)
  })
})
