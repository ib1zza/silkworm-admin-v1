import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useQueryClient, type UseQueryResult } from '@tanstack/react-query'

import {
  useDeleteApiV1AdminAdminProductsId,
  usePostApiV1AdminAdminProducts,
  usePutApiV1AdminAdminProductsId,
} from '../../../api/generated/admin-products'
import { usePostApiV1UploadProductImages } from '../../../api/generated/upload'
import type {
  CategoryResponseDto,
  CreateProductDto,
  ProductDetailsResponseDto,
  ProductDetailsResponseDtoPaginatedResponse,
  UpdateProductDto,
} from '../../../api/model'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import { Textarea } from '../../../components/ui/textarea'
import { formatMoney, parseApiError } from '../lib/ui'
import { ImagePicker } from './image-picker'

interface ProductsTabProps {
  productsQuery: UseQueryResult<ProductDetailsResponseDtoPaginatedResponse, unknown>
  categories: CategoryResponseDto[]
}

interface ProductFormState {
  title: string
  description: string
  price: string
  discountPrice: string
  categoryId: string
  composition: string
  preview: string
  manualImageUrls: string
  size: string
  color: string
  stockCount: string
}

interface ProductEditFormState {
  id: string
  title: string
  description: string
  price: string
  discountPrice: string
  categoryId: string
  composition: string
  preview: string
  decoration: string
  imageUrls: string
}

interface CreateProductPayload {
  Title: string
  Description: string
  Images: string[]
  Preview: string
  Decoration?: string | null
  Price: number
  DiscountPrice?: number | null
  CategoryId: string
  Composition: string
  Variants: Array<{
    Size: string
    Color: string
    StockCount: number
  }>
}

const INITIAL_FORM: ProductFormState = {
  title: '',
  description: '',
  price: '',
  discountPrice: '',
  categoryId: '',
  composition: '',
  preview: '',
  manualImageUrls: '',
  size: '',
  color: '',
  stockCount: '0',
}

export function ProductsTab({ productsQuery, categories }: ProductsTabProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProductFormState>(INITIAL_FORM)
  const [selectedLibraryImages, setSelectedLibraryImages] = useState<string[]>([])
  const [selectedDecoration, setSelectedDecoration] = useState<string>('')
  const [decorationFile, setDecorationFile] = useState<File | null>(null)
  const [editForm, setEditForm] = useState<ProductEditFormState | null>(null)

  const createMutation = usePostApiV1AdminAdminProducts()
  const updateMutation = usePutApiV1AdminAdminProductsId()
  const deleteMutation = useDeleteApiV1AdminAdminProductsId()
  const uploadMutation = usePostApiV1UploadProductImages()

  const defaultCategoryId = categories[0]?.Id ?? ''

  useEffect(() => {
    if (!form.categoryId && defaultCategoryId) {
      setForm((prev) => ({ ...prev, categoryId: defaultCategoryId }))
    }
  }, [defaultCategoryId, form.categoryId])

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        id: category.Id,
        title: category.Title,
      })),
    [categories],
  )

  const invalidateProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/AdminProducts'] })
  }

  const handleChange = (key: keyof ProductFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const fillPreviewWithFirstSelected = () => {
    const first = selectedLibraryImages[0]
    if (first) {
      setForm((prev) => ({ ...prev, preview: first }))
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const manualImages = form.manualImageUrls
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean)

    const images = Array.from(new Set([...selectedLibraryImages, ...manualImages]))
    const price = Number(form.price)
    const discountPrice = form.discountPrice ? Number(form.discountPrice) : null
    const stockCount = Number(form.stockCount)

    if (!images.length || !Number.isFinite(price) || price <= 0) {
      return
    }

    const payload: CreateProductPayload = {
      Title: form.title.trim(),
      Description: form.description.trim(),
      Images: images,
      Preview: form.preview.trim(),
      Decoration: selectedDecoration || null,
      Price: price,
      DiscountPrice: Number.isFinite(discountPrice) ? discountPrice : null,
      CategoryId: form.categoryId,
      Composition: form.composition.trim(),
      Variants: [
        {
          Size: form.size.trim(),
          Color: form.color.trim(),
          StockCount: Number.isFinite(stockCount) && stockCount >= 0 ? stockCount : 0,
        },
      ],
    }

    createMutation.mutate(
      { data: payload as unknown as CreateProductDto },
      {
        onSuccess: async () => {
          setSelectedLibraryImages([])
          setSelectedDecoration('')
          setForm({
            ...INITIAL_FORM,
            categoryId: defaultCategoryId,
          })
          await invalidateProducts()
        },
      },
    )
  }

  const handleDecorationUpload = () => {
    if (!decorationFile) {
      return
    }

    const isSvg =
      decorationFile.type.includes('svg') ||
      decorationFile.name.toLowerCase().endsWith('.svg')

    if (!isSvg) {
      return
    }

    uploadMutation.mutate(
      {
        data: {
          Files: [decorationFile],
          CustomFileNames: [decorationFile.name.replace(/\.svg$/i, '')],
          OverwriteIfExists: true,
        },
      },
      {
        onSuccess: async (result) => {
          const uploaded = result.Results.find((item) => item.Success)
          if (uploaded?.OriginalUrl) {
            setSelectedDecoration(uploaded.OriginalUrl)
          }
          setDecorationFile(null)
          await queryClient.invalidateQueries({
            queryKey: ['/api/v1/Upload/product-images'],
          })
        },
      },
    )
  }

  const startEdit = (product: ProductDetailsResponseDto) => {
    setEditForm({
      id: product.Id,
      title: product.Title,
      description: product.Description,
      price: String(product.Price),
      discountPrice: product.DiscountPrice != null ? String(product.DiscountPrice) : '',
      categoryId: product.CategoryId,
      composition: product.Composition,
      preview: product.Preview,
      decoration: product.Decoration ?? '',
      imageUrls: product.Images.join('\n'),
    })
  }

  const handleEditChange = (key: keyof ProductEditFormState, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editForm) return

    const images = editForm.imageUrls
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean)

    const payload: UpdateProductDto = {
      Title: editForm.title.trim() || null,
      Description: editForm.description.trim() || null,
      Images: images.length ? images : null,
      Preview: editForm.preview.trim() || null,
      Decoration: editForm.decoration.trim() || null,
      Price: editForm.price ? Number(editForm.price) : null,
      DiscountPrice: editForm.discountPrice ? Number(editForm.discountPrice) : null,
      CategoryId: editForm.categoryId || null,
      Composition: editForm.composition.trim() || null,
    }

    updateMutation.mutate(
      { id: editForm.id, data: payload },
      {
        onSuccess: async () => {
          setEditForm(null)
          await invalidateProducts()
        },
      },
    )
  }

  const removeProduct = (id: string) => {
    if (!window.confirm('Удалить этот товар?')) return
    deleteMutation.mutate(
      { id },
      {
        onSuccess: async () => {
          if (editForm?.id === id) {
            setEditForm(null)
          }
          await invalidateProducts()
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Новый товар</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-title">Название</Label>
              <Input
                id="product-title"
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category">Категория</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) => handleChange('categoryId', value)}
              >
                <SelectTrigger id="product-category">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="product-description">Описание</Label>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-price">Цена</Label>
              <Input
                id="product-price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(event) => handleChange('price', event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-discount">Цена со скидкой</Label>
              <Input
                id="product-discount"
                type="number"
                min="0"
                step="0.01"
                value={form.discountPrice}
                onChange={(event) => handleChange('discountPrice', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-preview">Превью (URL)</Label>
              <Input
                id="product-preview"
                value={form.preview}
                onChange={(event) => handleChange('preview', event.target.value)}
                required
              />
              <Button type="button" variant="outline" size="sm" onClick={fillPreviewWithFirstSelected}>
                Взять первое выбранное фото
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-composition">Состав</Label>
              <Input
                id="product-composition"
                value={form.composition}
                onChange={(event) => handleChange('composition', event.target.value)}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="product-manual-images">
                Доп. URL изображений (через запятую/новую строку)
              </Label>
              <Textarea
                id="product-manual-images"
                value={form.manualImageUrls}
                onChange={(event) => handleChange('manualImageUrls', event.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Декорация (только SVG)</Label>
              <p className="text-xs text-muted-foreground">
                Выбрано: {selectedDecoration || 'не выбрано'}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[240px] flex-1 space-y-2">
                  <Label htmlFor="decoration-upload">Загрузить SVG-декорацию</Label>
                  <Input
                    id="decoration-upload"
                    type="file"
                    accept=".svg,image/svg+xml"
                    onChange={(event) => setDecorationFile(event.target.files?.[0] ?? null)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDecorationUpload}
                  disabled={!decorationFile || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? 'Загружаю SVG...' : 'Загрузить SVG'}
                </Button>
              </div>
              {uploadMutation.isError && (
                <p className="text-sm text-destructive">{parseApiError(uploadMutation.error)}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <ImagePicker
                label="Выбор SVG-декорации из библиотеки"
                placeholder="Поиск SVG по customFilename"
                value={selectedDecoration ? [selectedDecoration] : []}
                onChange={(next) => setSelectedDecoration(next[0] ?? '')}
                multiple={false}
                svgOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-size">Размер</Label>
              <Input
                id="product-size"
                value={form.size}
                onChange={(event) => handleChange('size', event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-color">Цвет</Label>
              <Input
                id="product-color"
                value={form.color}
                onChange={(event) => handleChange('color', event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-stock">Остаток</Label>
              <Input
                id="product-stock"
                type="number"
                min="0"
                value={form.stockCount}
                onChange={(event) => handleChange('stockCount', event.target.value)}
                required
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" disabled={createMutation.isPending || !categoryOptions.length}>
                {createMutation.isPending ? 'Сохраняю...' : 'Добавить товар'}
              </Button>
            </div>

            <div className="md:col-span-2">
              <ImagePicker
                label="Выбор фото товара из библиотеки"
                placeholder="Поиск фото по customFilename"
                value={selectedLibraryImages}
                onChange={setSelectedLibraryImages}
                multiple
              />
            </div>
          </form>
          {createMutation.isError && (
            <p className="mt-3 text-sm text-destructive">{parseApiError(createMutation.error)}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Товары</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!!productsQuery.data?.Items?.length && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Скидка</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsQuery.data.Items.map((product) => (
                  <TableRow key={product.Id}>
                    <TableCell className="font-medium">{product.Title}</TableCell>
                    <TableCell>{product.CategoryTitle}</TableCell>
                    <TableCell>{formatMoney(product.Price)}</TableCell>
                    <TableCell>
                      {product.DiscountPrice ? (
                        <Badge variant="secondary">{formatMoney(product.DiscountPrice)}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(product)}>
                        Редактировать
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeProduct(product.Id)}
                        disabled={deleteMutation.isPending}
                      >
                        Удалить
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {deleteMutation.isError && (
            <p className="text-sm text-destructive">{parseApiError(deleteMutation.error)}</p>
          )}
        </CardContent>
      </Card>

      {editForm && (
        <Card>
          <CardHeader>
            <CardTitle>Редактирование товара</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitEdit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input
                  value={editForm.title}
                  onChange={(event) => handleEditChange('title', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select
                  value={editForm.categoryId}
                  onValueChange={(value) => handleEditChange('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Описание</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(event) => handleEditChange('description', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Цена</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editForm.price}
                  onChange={(event) => handleEditChange('price', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Скидка</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.discountPrice}
                  onChange={(event) => handleEditChange('discountPrice', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Preview URL</Label>
                <Input
                  value={editForm.preview}
                  onChange={(event) => handleEditChange('preview', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Decoration URL</Label>
                <Input
                  value={editForm.decoration}
                  onChange={(event) => handleEditChange('decoration', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Состав</Label>
                <Input
                  value={editForm.composition}
                  onChange={(event) => handleEditChange('composition', event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Изображения (URL через запятую/новую строку)</Label>
                <Textarea
                  value={editForm.imageUrls}
                  onChange={(event) => handleEditChange('imageUrls', event.target.value)}
                />
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Сохраняю...' : 'Сохранить изменения'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditForm(null)}>
                  Отмена
                </Button>
              </div>
            </form>
            {updateMutation.isError && (
              <p className="mt-3 text-sm text-destructive">{parseApiError(updateMutation.error)}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
