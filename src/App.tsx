import { useState, type FormEvent } from 'react'

import { useGetApiV1AdminAdminOrders } from './api/generated/admin-orders'
import { useGetApiV1AdminAdminProducts } from './api/generated/admin-products'
import { usePostApiV1AuthLogin } from './api/generated/auth'
import { useGetApiV1Categories } from './api/generated/categories'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { AdminHeader } from './features/admin/components/admin-header'
import { CategoriesTab } from './features/admin/components/categories-tab'
import { GalleryTab } from './features/admin/components/gallery-tab'
import { ImagesTab } from './features/admin/components/images-tab'
import { LoginForm } from './features/admin/components/login-form'
import { OrdersTab } from './features/admin/components/orders-tab'
import { OverviewCards } from './features/admin/components/overview-cards'
import { ProductsTab } from './features/admin/components/products-tab'
import { mapAuthResponseToSession } from './shared/auth/mapper'
import { clearAuthSession, getAuthSession, setAuthSession } from './shared/auth/store'

function App() {
  const [email, setEmail] = useState('admin@silkworm.local')
  const [password, setPassword] = useState('')
  const [session, setSession] = useState(() => getAuthSession())
  const [tab, setTab] = useState('overview')

  const isAuthorized = !!session?.accessToken
  const loginMutation = usePostApiV1AuthLogin()

  const productsQuery = useGetApiV1AdminAdminProducts(
    { page: 1, pageSize: 8 },
    {
      query: {
        enabled: isAuthorized && (tab === 'overview' || tab === 'products'),
      },
    },
  )

  const ordersQuery = useGetApiV1AdminAdminOrders(
    { page: 1, pageSize: 8 },
    {
      query: {
        enabled: isAuthorized && (tab === 'overview' || tab === 'orders'),
      },
    },
  )

  const categoriesQuery = useGetApiV1Categories({
    query: {
      enabled:
        isAuthorized &&
        (tab === 'overview' || tab === 'categories' || tab === 'products'),
    },
  })

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    loginMutation.mutate(
      {
        data: {
          Email: email,
          Password: password,
        },
      },
      {
        onSuccess: (data) => {
          const nextSession = mapAuthResponseToSession(data)
          setAuthSession(nextSession)
          setSession(nextSession)
          setPassword('')
        },
      },
    )
  }

  const handleLogout = () => {
    clearAuthSession()
    setSession(null)
  }

  if (!isAuthorized) {
    return (
      <LoginForm
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
        mutation={loginMutation}
      />
    )
  }

  return (
    <main className="container space-y-6 py-8">
      <AdminHeader session={session} onLogout={handleLogout} />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="products">Товары</TabsTrigger>
          <TabsTrigger value="orders">Заказы</TabsTrigger>
          <TabsTrigger value="categories">Категории</TabsTrigger>
          <TabsTrigger value="images">Картинки</TabsTrigger>
          <TabsTrigger value="gallery">Галерея</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewCards
            productsTotal={productsQuery.data?.Total ?? 0}
            ordersTotal={ordersQuery.data?.Total ?? 0}
            categoriesTotal={categoriesQuery.data?.length ?? 0}
          />
        </TabsContent>

        <TabsContent value="products">
          <ProductsTab
            productsQuery={productsQuery}
            categories={categoriesQuery.data ?? []}
          />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersTab query={ordersQuery} />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab query={categoriesQuery} />
        </TabsContent>

        <TabsContent value="images">
          <ImagesTab />
        </TabsContent>

        <TabsContent value="gallery">
          <GalleryTab />
        </TabsContent>
      </Tabs>
    </main>
  )
}

export default App
