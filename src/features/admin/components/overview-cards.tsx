import { Package, ShoppingCart, Tag } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader } from '../../../components/ui/card'

interface OverviewCardsProps {
  productsTotal: number
  ordersTotal: number
  categoriesTotal: number
}

export function OverviewCards({
  productsTotal,
  ordersTotal,
  categoriesTotal,
}: OverviewCardsProps) {
  const cards = [
    { title: 'Товары', value: productsTotal, icon: Package },
    { title: 'Заказы', value: ordersTotal, icon: ShoppingCart },
    { title: 'Категории', value: categoriesTotal, icon: Tag },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {card.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
