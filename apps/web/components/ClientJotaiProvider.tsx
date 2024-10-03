'use client';

import { useHydrateAtoms } from 'jotai/utils';
import { componentStateAtom } from '@/lib/atoms';
import { ReactNode } from 'react';
import React from 'react';

type Props = {
  initialValues: any;
  children: ReactNode;
};

export default function ClientJotaiProvider({ initialValues, children }: Props) {
  useHydrateAtoms([[componentStateAtom, initialValues]]);

  return <>{children}</>;
}