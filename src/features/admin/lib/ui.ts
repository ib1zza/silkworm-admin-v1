import { AxiosError } from 'axios'

import type { ProblemDetails } from '../../../api/model'

export const formatMoney = (value: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(
    value,
  )

export const orderStatusMap: Record<number, string> = {
  0: 'Новый',
  1: 'В обработке',
  2: 'Выполнен',
  3: 'Отменен',
}

export const paymentStatusMap: Record<number, string> = {
  0: 'Ожидает',
  1: 'В процессе',
  2: 'Оплачен',
  3: 'Возврат',
  4: 'Ошибка',
}

export const parseApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ProblemDetails | undefined
    return responseData?.detail ?? error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Не удалось выполнить запрос'
}

export const toAbsoluteImageUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  const base = import.meta.env.VITE_APP_URL ?? 'https://digital-twilight.ru'
  if (url.startsWith('/')) {
    return `${base}${url}`
  }

  return `${base}/${url}`
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
