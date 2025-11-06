import { useCallback, useState } from 'react'
import { Upload, FileIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatBytes } from '@/lib/utils'

export default function FileUploadZone({ onFilesSelected, disabled, maxFiles = 10 }) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [disabled])

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }, [])

  const handleFiles = (files) => {
    if (files.length === 0) return

    const validFiles = files.slice(0, maxFiles)
    setSelectedFiles(validFiles)
    onFilesSelected(validFiles)
  }

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFilesSelected(newFiles)
  }

  const clearAll = () => {
    setSelectedFiles([])
    onFilesSelected([])
  }

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          'border-2 border-dashed transition-all duration-200',
          isDragging && 'border-primary bg-primary/5 scale-[1.02]',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:border-primary/50 cursor-pointer'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className={cn(
              'p-4 rounded-full transition-colors',
              isDragging ? 'bg-primary/20' : 'bg-muted'
            )}>
              <Upload className={cn(
                'h-10 w-10 transition-colors',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {isDragging ? 'Drop files here' : 'Choose files to share'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum {maxFiles} files
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => document.getElementById('file-input')?.click()}
                disabled={disabled}
              >
                Browse Files
              </Button>
              {selectedFiles.length > 0 && (
                <Button variant="outline" onClick={clearAll}>
                  Clear All
                </Button>
              )}
            </div>

            <input
              id="file-input"
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Selected Files ({selectedFiles.length})
            </h4>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>

          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-muted rounded-lg">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatBytes(file.size)}</span>
                          <span>•</span>
                          <Badge variant="secondary" className="text-xs">
                            {file.type || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
