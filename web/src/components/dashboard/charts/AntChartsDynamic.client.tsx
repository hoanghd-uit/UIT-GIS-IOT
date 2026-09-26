'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { LoadingState } from '../states/LoadingState';

const ChartLoading = () => <LoadingState message="Đang khởi tạo biểu đồ..." />;

export const DynamicLine = dynamic(
  () => import('@ant-design/charts').then((mod) => mod.Line),
  { ssr: false, loading: ChartLoading }
);

export const DynamicColumn = dynamic(
  () => import('@ant-design/charts').then((mod) => mod.Column),
  { ssr: false, loading: ChartLoading }
);

export const DynamicPie = dynamic(
  () => import('@ant-design/charts').then((mod) => mod.Pie),
  { ssr: false, loading: ChartLoading }
);
