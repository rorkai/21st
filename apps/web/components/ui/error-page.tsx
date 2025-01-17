import React from "react"

export const ErrorPage = ({ error }: { error: Error }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Oops! Something went wrong</h1>
      <p className="text-xl mb-8 text-muted-foreground">
        We encountered an error while loading this page.
      </p>
      <p className="text-sm text-muted-foreground">{error.message}</p>
    </div>
  )
}

export default ErrorPage
