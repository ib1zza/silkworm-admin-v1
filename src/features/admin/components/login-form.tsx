import type { FormEvent } from 'react'

import type { UseMutationResult } from '@tanstack/react-query'

import { Button } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import type { AuthResponseDto, LoginDto, ProblemDetails } from '../../../api/model'
import { parseApiError } from '../lib/ui'

interface LoginFormProps {
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  mutation: UseMutationResult<
    AuthResponseDto,
    ProblemDetails,
    { data: LoginDto },
    unknown
  >
}

export function LoginForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  mutation,
}: LoginFormProps) {
  return (
    <main className="container flex min-h-screen items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Silkworm Admin</CardTitle>
          <CardDescription>Войдите для управления каталогом и заказами</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Входим...' : 'Войти'}
            </Button>
            {mutation.isError && (
              <p className="text-sm text-destructive">{parseApiError(mutation.error)}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
