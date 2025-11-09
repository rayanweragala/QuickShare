import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * VirtualList component for efficiently rendering large lists
 * Only renders visible items plus a buffer
 */
export const VirtualList = ({
  items = [],
  itemHeight = 100,
  renderItem,
  className = '',
  overscan = 3, // Number of items to render outside viewport
  gap = 12, // Gap between items in pixels
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const totalHeight = items.length * (itemHeight + gap);
  const startIndex = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Handle scroll
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(containerRef.current);
    setContainerHeight(containerRef.current.clientHeight);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          return (
            <div
              key={item.id || actualIndex}
              style={{
                position: 'absolute',
                top: `${actualIndex * (itemHeight + gap)}px`,
                left: 0,
                right: 0,
                height: `${itemHeight}px`,
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Hook for virtual scrolling with dynamic heights
 * Useful when items have variable heights
 */
export const useVirtualScroll = (items, estimatedItemHeight = 100) => {
  const [heights, setHeights] = useState(new Map());
  const [scrollTop, setScrollTop] = useState(0);

  const measureItem = useCallback((index, height) => {
    setHeights(prev => {
      const newHeights = new Map(prev);
      newHeights.set(index, height);
      return newHeights;
    });
  }, []);

  const getItemHeight = useCallback((index) => {
    return heights.get(index) || estimatedItemHeight;
  }, [heights, estimatedItemHeight]);

  return {
    measureItem,
    getItemHeight,
    scrollTop,
    setScrollTop,
  };
};
