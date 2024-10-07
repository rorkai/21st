import { buffer } from "micro"
import { Webhook } from "svix"

export const config = {
  api: {
    bodyParser: false,
  },
}

const webhookSecret = process.env.SVIX_WH_SECRET

export default async function handler(req, res) {
  const payload = (await buffer(req)).toString()
  const headers = req.headers

  const wh = new Webhook(webhookSecret)
  let msg

  try {
    msg = wh.verify(payload, headers)
  } catch (err) {
    console.error("Webhook verification error:", err.message)
    res.status(400).send("Invalid signature")
    return
  }


  console.log("Webhook event received:", msg)

  res.status(200).json({ status: "success" })
}
