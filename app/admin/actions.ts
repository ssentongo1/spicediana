'use server'

import { cookies } from 'next/headers'

export async function adminLogin(email: string, password: string) {
  // Hardcoded single admin
  if (email === 'spice@diana.com' && password === 'Spice2024') {
    const cookieStore = await cookies()
    cookieStore.set('admin_session', 'true', { 
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24
    })
    return { success: true }
  }
  
  return { success: false, error: 'Wrong email or password' }
}
