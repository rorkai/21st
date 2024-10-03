/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { ComponentBento } from '@/components/ComponentBento';
import { supabase } from '@/utils/supabase';
import { Header } from '@/components/Header';

async function getUserData(username: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error) throw error;
  return data;
}

async function getUserComponents(userId: string) {
  const { data, error } = await supabase
    .from('components')
      .select(`
        *,
        users:users!user_id (
          id,
          username,
          image_url,
          name,
          email
        )
      `)
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export default async function UserProfile({ params }: { params: { username: string } }) {
  const user = await getUserData(params.username);
  const components = await getUserComponents(user.id);

  return (
    <>
      <Header />
      <div className="flex mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-[30%] flex flex-col items-center md:items-start">
            <img
              src={`${user.image_url}&size=552`}
              alt={`${user.name}'s avatar`}
              width={184}
              height={184}
              className="rounded-full"
            />
            <h1 className="mt-4 text-[44px] font-bold">{user.name}</h1>
            <p className="text-[20px] text-gray-600">@{user.username}</p>
          </div>
          <div className="w-full md:w-[70%]">
            <ComponentBento components={components} />
          </div>
        </div>
      </div>
    </>
  );
}