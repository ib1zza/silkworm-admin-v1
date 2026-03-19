import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
  useDeleteApiV1GalleryId,
  useGetApiV1Gallery,
  usePostApiV1Gallery,
  usePutApiV1GalleryId,
} from '../../../api/generated/gallery'
import type { GalleryImageDto } from '../../../api/model'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { parseApiError, toAbsoluteImageUrl } from '../lib/ui'
import { ImagePicker } from './image-picker'

interface GalleryFormState {
  url: string
  description: string
}

const INITIAL_FORM: GalleryFormState = {
  url: '',
  description: '',
}

export function GalleryTab() {
  const queryClient = useQueryClient()
  const [createForm, setCreateForm] = useState<GalleryFormState>(INITIAL_FORM)
  const [editItem, setEditItem] = useState<GalleryImageDto | null>(null)

  const galleryQuery = useGetApiV1Gallery({ query: { staleTime: 10_000 } })
  const createMutation = usePostApiV1Gallery()
  const updateMutation = usePutApiV1GalleryId()
  const deleteMutation = useDeleteApiV1GalleryId()

  const refreshGallery = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/v1/Gallery'] })
  }

  const createItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    createMutation.mutate(
      {
        data: {
          Url: createForm.url.trim(),
          Description: createForm.description.trim() || null,
        },
      },
      {
        onSuccess: async () => {
          setCreateForm(INITIAL_FORM)
          await refreshGallery()
        },
      },
    )
  }

  const updateItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editItem) return

    updateMutation.mutate(
      {
        id: editItem.Id,
        data: {
          Id: editItem.Id,
          Url: editItem.Url.trim(),
          Description: editItem.Description?.trim() || null,
        },
      },
      {
        onSuccess: async () => {
          setEditItem(null)
          await refreshGallery()
        },
      },
    )
  }

  const removeItem = (id: number) => {
    if (!window.confirm('Удалить запись из галереи?')) return
    deleteMutation.mutate(
      { id },
      {
        onSuccess: async () => {
          if (editItem?.Id === id) {
            setEditItem(null)
          }
          await refreshGallery()
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Добавить в галерею</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createItem} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImagePicker
                label="Выбрать фото из библиотеки"
                placeholder="Поиск фото по customFilename"
                value={createForm.url ? [createForm.url] : []}
                onChange={(next) =>
                  setCreateForm((prev) => ({ ...prev, url: next[0] ?? '' }))
                }
                multiple={false}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="gallery-url">URL картинки</Label>
              <Input
                id="gallery-url"
                value={createForm.url}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, url: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="gallery-description">Описание</Label>
              <Textarea
                id="gallery-description"
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>
            <div>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Сохраняю...' : 'Добавить'}
              </Button>
            </div>
          </form>
          {createMutation.isError && (
            <p className="mt-3 text-sm text-destructive">{parseApiError(createMutation.error)}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Элементы галереи</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {galleryQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Загружаю галерею...</p>
          )}
          {galleryQuery.isError && (
            <p className="text-sm text-destructive">{parseApiError(galleryQuery.error)}</p>
          )}
          {!!galleryQuery.data?.length && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {galleryQuery.data.map((item) => (
                <article key={item.Id} className="overflow-hidden rounded-md border">
                  <img
                    src={toAbsoluteImageUrl(item.Url)}
                    alt={item.Description ?? `gallery-${item.Id}`}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="space-y-2 p-3">
                    <p className="text-xs text-muted-foreground">ID: {item.Id}</p>
                    <p className="line-clamp-2 text-sm">{item.Description || 'Без описания'}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditItem(item)}>
                        Редактировать
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(item.Id)}
                        disabled={deleteMutation.isPending}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {galleryQuery.isSuccess && !galleryQuery.data?.length && (
            <p className="text-sm text-muted-foreground">Галерея пока пуста.</p>
          )}
          {deleteMutation.isError && (
            <p className="text-sm text-destructive">{parseApiError(deleteMutation.error)}</p>
          )}
        </CardContent>
      </Card>

      {editItem && (
        <Card>
          <CardHeader>
            <CardTitle>Редактировать элемент галереи</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateItem} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <ImagePicker
                  label="Выбрать фото из библиотеки"
                  placeholder="Поиск фото по customFilename"
                  value={editItem.Url ? [editItem.Url] : []}
                  onChange={(next) =>
                    setEditItem((prev) =>
                      prev ? { ...prev, Url: next[0] ?? '' } : prev,
                    )
                  }
                  multiple={false}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>URL</Label>
                <Input
                  value={editItem.Url}
                  onChange={(event) =>
                    setEditItem((prev) =>
                      prev ? { ...prev, Url: event.target.value } : prev,
                    )
                  }
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Описание</Label>
                <Textarea
                  value={editItem.Description ?? ''}
                  onChange={(event) =>
                    setEditItem((prev) =>
                      prev ? { ...prev, Description: event.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Сохраняю...' : 'Сохранить'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditItem(null)}>
                  Отмена
                </Button>
              </div>
            </form>
            {updateMutation.isError && (
              <p className="mt-3 text-sm text-destructive">
                {parseApiError(updateMutation.error)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
