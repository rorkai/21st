import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { Component } from "@/types/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Создаем Map для хранения контроллеров отмены для каждого запроса
const abortControllers = new Map<string, AbortController>()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 },
    )
  }

  // Отменяем предыдущий запрос с тем же query, если он существует
  if (abortControllers.has(query)) {
    abortControllers.get(query)?.abort()
    abortControllers.delete(query)
  }

  // Создаем новый AbortController для текущего запроса
  const controller = new AbortController()
  abortControllers.set(query, controller)

  try {
    console.log("Executing Supabase query with:", query)

const { data: components, error } = await supabase.rpc("search_components", {
  search_query: query,
})
    console.log("Components:", components)

    // Удаляем контроллер после завершения запроса
    abortControllers.delete(query)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Получаем уникальные user_id из компонентов
    const userIds = [...new Set(components.map((c: Component) => c.user_id))]

    // Получаем информацию о пользователях
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("*")
      .in("id", userIds)

    if (userError) {
      console.error("Supabase user error:", userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Создаем словарь пользователей для быстрого доступа
    const userMap = Object.fromEntries(users.map((user) => [user.id, user]))

    // Добавляем информацию о пользователе к каждому компоненту
    const componentsWithUsers = components.map((component: Component) => ({
      ...component,
      user: userMap[component.user_id],
    }))

    console.log("Query results:", componentsWithUsers)

    return NextResponse.json(componentsWithUsers || [])
  } catch (e) {
    // Удаляем контроллер в случае ошибки
    abortControllers.delete(query)

    if (e instanceof Error && e.message === "Запрос отменен") {
      console.log("Запрос отменен:", query)
      return NextResponse.json({ message: "Запрос отменен" }, { status: 499 })
    }

    console.error("Unexpected error:", e)
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
