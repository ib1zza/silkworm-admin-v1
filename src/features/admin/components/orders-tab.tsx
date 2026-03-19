import type { UseQueryResult } from '@tanstack/react-query'

import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import type { OrderAdminListItemResponseDtoPaginatedResponse } from '../../../api/model'
import { formatMoney, orderStatusMap, parseApiError, paymentStatusMap } from '../lib/ui'

interface OrdersTabProps {
  query: UseQueryResult<OrderAdminListItemResponseDtoPaginatedResponse, unknown>
}

export function OrdersTab({ query }: OrdersTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние заказы</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isLoading && (
          <p className="text-sm text-muted-foreground">Загружаю заказы...</p>
        )}
        {query.isError && (
          <p className="text-sm text-destructive">{parseApiError(query.error)}</p>
        )}
        {!!query.data?.Items?.length && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Покупатель</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Оплата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.Items.map((order) => (
                <TableRow key={order.Id}>
                  <TableCell className="font-mono text-xs">
                    {order.Id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{order.UserEmail}</TableCell>
                  <TableCell>{formatMoney(order.TotalPrice)}</TableCell>
                  <TableCell>{orderStatusMap[order.Status] ?? order.Status}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {paymentStatusMap[order.PaymentStatus] ?? order.PaymentStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {query.isSuccess && !query.data?.Items?.length && (
          <p className="text-sm text-muted-foreground">Заказов пока нет.</p>
        )}
      </CardContent>
    </Card>
  )
}
