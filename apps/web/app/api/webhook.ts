import { buffer } from "micro"
import { Webhook } from "svix"

export const config = {
  api: {
    bodyParser: false, // Отключаем парсер тела запроса
  },
}

const webhookSecret = process.env.SVIX_WH_SECRET // Убедитесь, что этот секрет установлен в ваших переменных окружения

export default async function handler(req, res) {
  const payload = (await buffer(req)).toString()
  const headers = req.headers

  const wh = new Webhook(webhookSecret)
  let msg

  try {
    msg = wh.verify(payload, headers)
  } catch (err) {
    console.error("Ошибка верификации вебхука:", err.message)
    res.status(400).send("Неверная подпись")
    return
  }

  // Обработка полученного события
  console.log("Получено событие вебхука:", msg)

  res.status(200).json({ status: "success" })
}
