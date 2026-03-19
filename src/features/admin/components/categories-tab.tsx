import type { UseQueryResult } from '@tanstack/react-query'

import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Separator } from '../../../components/ui/separator'
import type { CategoryResponseDto } from '../../../api/model'
import { parseApiError } from '../lib/ui'

interface CategoriesTabProps {
  query: UseQueryResult<CategoryResponseDto[], unknown>
}

export function CategoriesTab({ query }: CategoriesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Категории</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {query.isLoading && (
          <p className="text-sm text-muted-foreground">Загружаю категории...</p>
        )}
        {query.isError && (
          <p className="text-sm text-destructive">{parseApiError(query.error)}</p>
        )}
        {query.data?.map((category, index) => (
          <div key={category.Id} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{category.Title}</span>
              <Badge variant="outline">{category.Slug}</Badge>
            </div>
            {index < (query.data?.length ?? 0) - 1 && <Separator />}
          </div>
        ))}
        {query.isSuccess && !query.data?.length && (
          <p className="text-sm text-muted-foreground">Категории ещё не созданы.</p>
        )}
      </CardContent>
    </Card>
  )
}
