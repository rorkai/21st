"use client";

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from '../utils/supabase'

type FormData = {
  code: string
  demoCode: string
  description: string
  dependencies: string
}

export default function ComponentForm() {
  const { register, handleSubmit, reset } = useForm<FormData>()
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from('components').insert({
        code: data.code,
        demo_code: data.demoCode,
        description: data.description,
        dependencies: data.dependencies,
        user_id: "304651f2-9afd-4181-9a20-3263aa601384"
      })
    
      if (error) throw error
      
      reset()
      alert('Component added successfully!')
    } catch (error) {
      console.error('Error adding component:', error)
      alert('An error occurred while adding the component')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-[300px]">
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">Code</label>
        <Textarea id="code" {...register('code', { required: true })} className="mt-1 w-full" />
      </div>
      
      <div>
        <label htmlFor="demoCode" className="block text-sm font-medium text-gray-700">Demo Code</label>
        <Textarea id="demoCode" {...register('demoCode', { required: true })} className="mt-1 w-full" />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <Input id="description" {...register('description', { required: true })} className="mt-1 w-full" />
      </div>
      
      <div>
        <label htmlFor="dependencies" className="block text-sm font-medium text-gray-700">Dependencies</label>
        <Textarea id="dependencies" {...register('dependencies', { required: true })} className="mt-1 w-full" />
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Adding...' : 'Add Component'}
      </Button>
    </form>
  )
}