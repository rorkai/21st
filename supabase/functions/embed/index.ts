import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts"

const model = new Supabase.ai.Session("gte-small")

const databaseUrl = Deno.env.get("SUPABASE_DB_URL")

const pool = new Pool(databaseUrl, 1, true)

async function embedDemo(demoId: string) {
  const connection = await pool.connect()
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

  const data = result.rows[0]

  const [codeText, demoCodeText] = await Promise.all([
    (await fetch(data.code)).text(),
    (await fetch(data.demo_code)).text(),
  ])
  const text = `${data.name} ${data.demo_name} ${data.description} ${data.tags} ${codeText} ${demoCodeText}`

  const output = await model.run(text, { mean_pool: true, normalize: true })

  await connection.queryObject`
    UPDATE public.demos
    SET embedding = ${JSON.stringify(output)}
    WHERE id = ${demoId}
  `
}

Deno.serve(async (req: Request) => {
  const { demoId } = await req.json()
  EdgeRuntime.waitUntil(embedDemo(demoId))

  return new Response("ok", {
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
    },
  })
})
