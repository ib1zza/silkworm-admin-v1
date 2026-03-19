import { useMemo, useState } from 'react'

import { useGetApiV1UploadProductImages } from '../../../api/generated/upload'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { parseApiError, toAbsoluteImageUrl } from '../lib/ui'

interface ImagePickerProps {
  label: string
  placeholder?: string
  value: string[]
  onChange: (next: string[]) => void
  multiple?: boolean
  svgOnly?: boolean
  pageSize?: number
}

export function ImagePicker({
  label,
  placeholder = 'Поиск по customFilename',
  value,
  onChange,
  multiple = true,
  svgOnly = false,
  pageSize = 80,
}: ImagePickerProps) {
  const [search, setSearch] = useState('')

  const imagesQuery = useGetApiV1UploadProductImages(
    {
      page: 1,
      pageSize,
      search: search.trim() || undefined,
    },
    { query: { staleTime: 10_000 } },
  )

  const filteredImages = useMemo(() => {
    const items = imagesQuery.data?.Images ?? []
    if (!svgOnly) {
      return items
    }

    return items.filter(
      (image) =>
        image.FileName.toLowerCase().endsWith('.svg') ||
        image.MimeType.toLowerCase().includes('svg'),
    )
  }, [imagesQuery.data?.Images, svgOnly])

  const toggle = (url: string) => {
    if (!multiple) {
      if (value[0] === url) {
        onChange([])
        return
      }
      onChange([url])
      return
    }

    if (value.includes(url)) {
      onChange(value.filter((item) => item !== url))
      return
    }
    onChange([...value, url])
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={placeholder}
      />
      <p className="text-xs text-muted-foreground">Выбрано: {value.length}</p>

      {imagesQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Загружаю библиотеку...</p>
      )}
      {imagesQuery.isError && (
        <p className="text-sm text-destructive">{parseApiError(imagesQuery.error)}</p>
      )}

      {!!filteredImages.length && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filteredImages.map((image) => {
            const isSelected = value.includes(image.Url)
            return (
              <button
                key={image.Url}
                type="button"
                className={`overflow-hidden rounded-md border text-left ${
                  isSelected ? 'border-primary ring-2 ring-primary/30' : ''
                }`}
                onClick={() => toggle(image.Url)}
              >
                <img
                  src={toAbsoluteImageUrl(image.Url)}
                  alt={image.FileName}
                  className="h-32 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-2 text-xs">
                  <p className="truncate">{image.FileName}</p>
                  <p className="text-muted-foreground">
                    {isSelected ? 'Выбрано' : 'Нажмите, чтобы выбрать'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {imagesQuery.isSuccess && !filteredImages.length && (
        <p className="text-sm text-muted-foreground">По этому поиску ничего не найдено.</p>
      )}
    </div>
  )
}
