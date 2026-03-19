import { LogOut } from 'lucide-react'

import { Button } from '../../../components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import type { AuthSession } from '../../../shared/auth/store'

interface AdminHeaderProps {
  session: AuthSession
  onLogout: () => void
}

export function AdminHeader({ session, onLogout }: AdminHeaderProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-3xl">Silkworm Admin</CardTitle>
            <CardDescription>
              {session.user?.Name ?? session.user?.Email ?? 'Администратор'} |{' '}
              {session.user?.Email}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      </CardHeader>
    </Card>
  )
}
