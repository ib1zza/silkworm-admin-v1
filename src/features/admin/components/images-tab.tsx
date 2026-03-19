import { useMemo, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
  useGetApiV1UploadProductImages,
  usePostApiV1UploadProductImages,
} from '../../../api/generated/upload'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { parseApiError, formatFileSize, toAbsoluteImageUrl } from '../lib/ui'

export function ImagesTab() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [customFileNames, setCustomFileNames] = useState('')
  const [overwriteIfExists, setOverwriteIfExists] = useState(false)

  const imagesQuery = useGetApiV1UploadProductImages(
    {
      page: 1,
      pageSize: 120,
      search: search.trim() || undefined,
    },
    { query: { staleTime: 10_000 } },
  )

  const uploadMutation = usePostApiV1UploadProductImages()

  const selectedFiles = useMemo(() => Array.from(files ?? []), [files])

  const handleUpload = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const fileArray = Array.from(files ?? [])
    if (!fileArray.length) {
      return
    }

    const parsedNames = customFileNames
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean)

    uploadMutation.mutate(
      {
        data: {
          Files: fileArray,
          CustomFileNames: parsedNames.length ? parsedNames : undefined,
          OverwriteIfExists: overwriteIfExists || undefined,
        },
      },
      {
        onSuccess: async () => {
          setFiles(null)
          setCustomFileNames('')
          await queryClient.invalidateQueries({
            queryKey: ['/api/v1/Upload/product-images'],
          })
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Загрузить картинки</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upload-files">Файлы</Label>
              <Input
                id="upload-files"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setFiles(event.target.files)}
                required
              />
              {!!selectedFiles.length && (
                <p className="text-xs text-muted-foreground">
                  Выбрано: {selectedFiles.length}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-custom-names">
                CustomFileNames (через запятую или с новой строки)
              </Label>
              <Input
                id="upload-custom-names"
                value={customFileNames}
                onChange={(event) => setCustomFileNames(event.target.value)}
                placeholder="rose-1, rose-2"
              />
            </div>

            <Button
              type="button"
              variant={overwriteIfExists ? 'default' : 'outline'}
              onClick={() => setOverwriteIfExists((prev) => !prev)}
            >
              OverwriteIfExists: {overwriteIfExists ? 'ON' : 'OFF'}
            </Button>

            <div>
              <Button type="submit" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? 'Загружаю...' : 'Загрузить'}
              </Button>
            </div>

            {uploadMutation.isError && (
              <p className="text-sm text-destructive">
                {parseApiError(uploadMutation.error)}
              </p>
            )}
            {uploadMutation.isSuccess && (
              <p className="text-sm text-emerald-600">
                Загружено: {uploadMutation.data.SuccessfulUploads}, ошибок:{' '}
                {uploadMutation.data.FailedUploads}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Библиотека картинок</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="images-search">Поиск по customFilename</Label>
            <Input
              id="images-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Например: rose"
            />
          </div>

          {imagesQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Загружаю картинки...</p>
          )}
          {imagesQuery.isError && (
            <p className="text-sm text-destructive">{parseApiError(imagesQuery.error)}</p>
          )}

          {!!imagesQuery.data?.Images?.length && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {imagesQuery.data.Images.map((image) => (
                <article key={image.Url} className="overflow-hidden rounded-md border">
                  <img
                    src={toAbsoluteImageUrl(image.Url)}
                    alt={image.FileName}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="space-y-1 p-2">
                    <p className="truncate text-xs font-medium">{image.FileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(image.FileSize)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}

          {imagesQuery.isSuccess && !imagesQuery.data?.Images?.length && (
            <p className="text-sm text-muted-foreground">Картинки не найдены.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
