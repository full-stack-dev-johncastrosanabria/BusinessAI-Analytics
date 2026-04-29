import React, { useState, useRef, useId } from 'react'
import './Tooltip.css'

export interface TooltipProps {
  content: string
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [visible, setVisible] = useState(false)
  const tooltipId = useId()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 200)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  return (
    <span
      className="tooltip-wrapper"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {React.cloneElement(children, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'aria-describedby': visible ? tooltipId : undefined,
      } as any)}
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`tooltip tooltip--${position}`}
        >
          {content}
        </span>
      )}
    </span>
  )
}
