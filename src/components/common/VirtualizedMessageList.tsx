import React, { useRef, useEffect, useState, useCallback } from 'react';

interface VirtualizedMessageListProps {
  messages: any[];
  renderMessage: (message: any, index: number) => React.ReactNode;
  messageHeight?: number;
  overscan?: number;
  className?: string;
  scrollToBottom?: boolean;
}

/**
 * VirtualizedMessageList - Optimized component for rendering large message lists
 *
 * Only renders messages that are visible in the viewport, significantly improving
 * performance on low-end hardware when dealing with long chat histories.
 *
 * @param messages - Array of message objects to render
 * @param renderMessage - Function that renders a single message
 * @param messageHeight - Average height of a message in pixels (default: 100)
 * @param overscan - Number of messages to render outside viewport (default: 3)
 * @param className - CSS class for the container
 * @param scrollToBottom - Whether to scroll to bottom on new messages (default: true)
 */
const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  renderMessage,
  messageHeight = 100,
  overscan = 3,
  className = '',
  scrollToBottom = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const lastMessageCountRef = useRef(0);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / messageHeight) - overscan);
  const endIndex = Math.min(
    messages.length,
    Math.ceil((scrollTop + containerHeight) / messageHeight) + overscan
  );

  const visibleMessages = messages.slice(startIndex, endIndex);
  const totalHeight = messages.length * messageHeight;
  const offsetY = startIndex * messageHeight;

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // Debounced scroll handler for better performance
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;
    const debouncedScroll = () => {
      rafId = requestAnimationFrame(() => {
        handleScroll();
      });
    };

    container.addEventListener('scroll', debouncedScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', debouncedScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [handleScroll]);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollToBottom && containerRef.current && messages.length > lastMessageCountRef.current) {
      const isNearBottom =
        containerRef.current.scrollHeight -
          containerRef.current.scrollTop -
          containerRef.current.clientHeight <
        200;

      if (isNearBottom || lastMessageCountRef.current === 0) {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        });
      }
    }

    lastMessageCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: '100%', position: 'relative' }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform',
          }}
        >
          {visibleMessages.map((message, index) => (
            <div key={startIndex + index} data-index={startIndex + index}>
              {renderMessage(message, startIndex + index)}
            </div>
          ))}
        </div>
      </div>

      {/* Performance indicator - only in development */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-50">
          Rendering {visibleMessages.length} / {messages.length} messages
        </div>
      )}
    </div>
  );
};

export default VirtualizedMessageList;
