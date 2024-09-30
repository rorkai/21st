import dynamic from 'next/dynamic'

const ComponentForm = dynamic(() => import('../components/ComponentForm'), { ssr: false })

export default function Page() {
  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='text-2xl font-bold mb-4'>Add new component</h1>
      <ComponentForm />
    </div>
  )
}
