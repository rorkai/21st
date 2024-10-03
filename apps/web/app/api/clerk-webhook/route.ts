import { NextResponse } from 'next/server';
import { Webhook, WebhookRequiredHeaders } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const payload = await req.text();
  const headersList = req.headers;

  const heads = {
    'svix-id': headersList.get('svix-id'),
    'svix-timestamp': headersList.get('svix-timestamp'),
    'svix-signature': headersList.get('svix-signature'),
  };

  // Проверка наличия всех необходимых заголовков
  if (!heads['svix-id'] || !heads['svix-timestamp'] || !heads['svix-signature']) {
    console.error('Отсутствуют необходимые заголовки');
    return NextResponse.json({ error: 'Отсутствуют необходимые заголовки' }, { status: 400 });
  }

  if (!webhookSecret) {
    console.error('Отсутствует секрет вебхука');
    return NextResponse.json({ error: 'Ошибка конфигурации сервера' }, { status: 500 });
  }

  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(payload, heads as WebhookRequiredHeaders) as WebhookEvent;
  } catch (err) {
    console.error('Ошибка верификации вебхука:', err);
    return NextResponse.json({ error: 'Неверная подпись вебхука' }, { status: 400 });
  }

  const { type, data: user } = evt;

  switch (type) {
    case 'user.created':
    case 'user.updated':
      // eslint-disable-next-line no-case-declarations
      const { error } = await supabaseAdmin.from('users').upsert({
        id: user.id,
        username: user.username ?? null,
        image_url: user.image_url ?? null,
        email: user.email_addresses[0]?.email_address ?? null,
        name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || null,
      });

      if (error) {
        console.error('Ошибка синхронизации пользователя с Supabase:', error);
        return NextResponse.json({ error: 'Не удалось синхронизировать пользователя' }, { status: 500 });
      }
      break;

    case 'user.deleted':
      // eslint-disable-next-line no-case-declarations
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .match({ id: user.id });

      if (deleteError) {
        console.error('Ошибка удаления пользователя из Supabase:', deleteError);
        return NextResponse.json({ error: 'Не удалось удалить пользователя' }, { status: 500 });
      }
      break;

    default:
      console.warn('Неизвестный тип события:', type);
  }

  return NextResponse.json({ message: 'Вебхук успешно обработан' });
}

export async function GET() {
  return NextResponse.json({ message: 'Конечная точка вебхука Clerk' });
}