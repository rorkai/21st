const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: "../apps/web/.env" })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function getAllDemoIds() {
  const { data, error } = await supabase
    .from("demos")
    .select("id")
    .order("id", { ascending: true })
    .is("embedding", null)

  if (error) {
    console.error("Error fetching demo IDs:", error)
    return []
  }

  return data.map((demo) => demo.id)
}

async function embedDemo(demoId) {
  try {
    console.log(`Starting to process demo ID: ${demoId}`)
    
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, 15000) // 15 second timeout

    try {
      const response = await fetch(
        "https://vucvdpamtrjkzmubwlts.supabase.co/functions/v1/embed",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ demoId }),
          signal: controller.signal
        },
      )

      clearTimeout(timeout)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`)
      }

      console.log(`Successfully processed demo ID: ${demoId}`)
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`Skipping demo ID ${demoId} - Request timeout exceeded 15 seconds`)
        return // Skip this demo
      }
      throw error
    }
  } catch (error) {
    console.error(`Error processing demo ID ${demoId}:`, error)
    throw error // Re-throw to handle in the batch processing
  }
}

async function processAllDemos() {
  const demoIds = await getAllDemoIds()
  console.log(`Found ${demoIds.length} demos to process`)

  // Process demos in parallel with max 20 concurrent requests
  const batchSize = 3
  for (let i = 0; i < demoIds.length; i += batchSize) {
    const batchNumber = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(demoIds.length / batchSize)
    console.log(`Processing batch ${batchNumber} of ${totalBatches}`)
    
    const batch = demoIds.slice(i, i + batchSize)
    try {
      const promises = batch.map((demoId) => embedDemo(demoId))
      await Promise.all(promises)
      console.log(`Completed batch ${batchNumber}`)
    } catch (error) {
      console.error(`Error in batch ${batchNumber}:`, error)
      // Continue with next batch despite errors
    }

    if (i + batchSize < demoIds.length) {
      console.log('Waiting 1 second before next batch...')
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  console.log("Finished processing all demos")
}

processAllDemos().catch(console.error)
