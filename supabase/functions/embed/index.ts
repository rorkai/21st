import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts"
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const model = new Supabase.ai.Session("gte-small")

const databaseUrl = Deno.env.get("SUPABASE_DB_URL")

const pool = new Pool(databaseUrl, 1, true)

async function embedDemo(demoId: string) {
  console.log(`Starting to embed demo ${demoId}`)

  console.log("Connecting to database...")
  const connection = await pool.connect()

  console.log("Fetching demo data from database...")
  const result = await connection.queryObject`
   SELECT 
    c.name,
    c.description,
    c.code,
    d.name AS demo_name,
    d.demo_code,
    string_agg(t.name, ', ') AS tags
    FROM public.demos AS d
    INNER JOIN public.components AS c 
        ON d.component_id = c.id 
    LEFT JOIN public.demo_tags AS dt 
        ON d.id = dt.demo_id
    LEFT JOIN public.tags AS t 
        ON dt.tag_id = t.id
    WHERE d.id = ${demoId}
    GROUP BY c.id, d.id;
  `

  const data = result.rows[0] as {
    name: string
    description: string
    code: string
    demo_name: string
    demo_code: string
    tags: string
  }
  console.log("Demo data fetched successfully")

  console.log("Fetching code content...")
  const [codeText, demoCodeText] = await Promise.all([
    (await fetch(data.code)).text(),
    (await fetch(data.demo_code)).text(),
  ])
  console.log("Code content fetched successfully")

  const text = `${data.name} ${data.demo_name} ${data.description} ${data.tags} ${codeText} ${demoCodeText}`

  console.log("Generating embedding...")
  const output = await model.run(text, { mean_pool: true, normalize: true })
  console.log("Embedding generated successfully")

  console.log("Updating demo with embedding...")
  await connection.queryObject`
    UPDATE public.demos
    SET embedding = ${JSON.stringify(output)}
    WHERE id = ${demoId}
  `

  connection.release()
  console.log(`Successfully embedded demo ${demoId}`)
}

Deno.serve(async (req: Request) => {
  console.log("Received embedding request")
  // record is for the case when we send data from database webhooks
  const { demoId, record } = await req.json()
  console.log(`Processing demo ID or recrod: ${demoId} ${record}`)

  const idFromRecord = record?.id

  if (demoId && idFromRecord) {
    throw Error("Both demoId and record are provided")
  }

  const finalId = demoId ?? idFromRecord

  EdgeRuntime.waitUntil(embedDemo(finalId))

  return new Response("ok", {
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
    },
  })
})
