import { useEffect, useRef, useCallback } from 'react';

export const useInfiniteScroll = ({
  hasMore,
  onLoadMore,
  rootMargin = '240px',
  disabled = false,
}) => {
  const sentinelRef = useRef(null);
  const onLoadMoreRef = useRef(onLoadMore);

  onLoadMoreRef.current = onLoadMore;

  const stableLoadMore = useCallback(() => {
    onLoadMoreRef.current?.();
  }, []);

  useEffect(() => {
    if (disabled || !hasMore) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          stableLoadMore();
        }
      },
      { root: null, rootMargin, threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, disabled, rootMargin, stableLoadMore]);

  return sentinelRef;
};

export default useInfiniteScroll;
