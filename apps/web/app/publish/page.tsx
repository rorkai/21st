"use client";

import React from 'react';
import ComponentForm from '@/components/ComponentForm';

export default function PublishPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Publish a New Component</h1>
      <ComponentForm />
    </div>
  );
}