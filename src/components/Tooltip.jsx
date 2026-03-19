import React, { useState } from 'react'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
} from '@floating-ui/react'

export default function Tooltip({ children, content, placement = 'top', delay = 300 }) {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ fallbackAxisSideDirection: 'start' }),
      shift({ padding: 8 }),
    ],
  })

  const hover = useHover(context, { move: false, delay: { open: delay, close: 0 } })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role])

  if (!content) return children

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()} className="inline-flex">
        {children}
      </div>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-[9999] pointer-events-none"
          >
            <div className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg text-xs leading-relaxed max-w-[320px] shadow-xl border border-white/10 whitespace-pre-line">
              {content}
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
