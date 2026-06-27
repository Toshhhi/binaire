import React from 'react';
import './Skeleton.css';

export const CardSkeleton = () => {
  return <div className="shimmerBlock cardSkeleton shimmer" />;
};

export const RowSkeleton = ({ count = 6 }) => {
  return (
    <div className="rowSkeletonContainer">
      <div className="shimmerBlock rowSkeletonTitle shimmer" />
      <div className="rowSkeletonGrid">
        {Array.from({ length: count }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export const HeroSkeleton = () => {
  return (
    <div className="heroSkeletonContainer shimmer">
      <div className="heroSkeletonContent">
        <div className="shimmerBlock heroSkeletonTitle shimmer" />
        <div className="shimmerBlock heroSkeletonText shimmer" />
        <div className="shimmerBlock heroSkeletonText short shimmer" />
        <div className="heroSkeletonButtons">
          <div className="shimmerBlock heroSkeletonBtn shimmer" />
          <div className="shimmerBlock heroSkeletonBtn shimmer" />
        </div>
      </div>
    </div>
  );
};

export default CardSkeleton;
