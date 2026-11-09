# Reutiliza public/favicon.svg sin agregar una dependencia de imagen al proyecto.
# Ejecutar desde PowerShell en Windows: ./scripts/generate-pwa-icons.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationCore, WindowsBase

$projectRoot = Split-Path -Parent $PSScriptRoot
$iconsPath = Join-Path $projectRoot 'public/icons'
[xml]$source = Get-Content -LiteralPath (Join-Path $projectRoot 'public/favicon.svg') -Raw
New-Item -ItemType Directory -Path $iconsPath -Force | Out-Null
$brushConverter = [System.Windows.Media.BrushConverter]::new()

$icons = @(
    @{ Name = 'pwa-192.png'; Size = 192; Scale = 0.9 },
    @{ Name = 'pwa-512.png'; Size = 512; Scale = 0.9 },
    @{ Name = 'pwa-maskable-512.png'; Size = 512; Scale = 0.8 },
    @{ Name = 'apple-touch-icon.png'; Size = 180; Scale = 0.9 }
)

foreach ($icon in $icons) {
    $visual = [System.Windows.Media.DrawingVisual]::new()
    $drawing = $visual.RenderOpen()
    try {
        $drawing.DrawRectangle(
            $brushConverter.ConvertFromString('#f6f8f6'),
            $null,
            [System.Windows.Rect]::new(0, 0, $icon.Size, $icon.Size)
        )
        $drawing.PushTransform([System.Windows.Media.ScaleTransform]::new($icon.Size / 48, $icon.Size / 48))
        $padding = 24 * (1 - $icon.Scale)
        $drawing.PushTransform([System.Windows.Media.TranslateTransform]::new($padding, $padding))
        $drawing.PushTransform([System.Windows.Media.ScaleTransform]::new($icon.Scale, $icon.Scale))

        foreach ($path in $source.svg.path) {
            $fill = $null
            $pen = $null
            if ($path.fill -and $path.fill -ne 'none') {
                $fill = $brushConverter.ConvertFromString($path.fill)
            }
            if ($path.stroke) {
                $pen = [System.Windows.Media.Pen]::new(
                    $brushConverter.ConvertFromString($path.stroke),
                    [double]::Parse($path.'stroke-width', [System.Globalization.CultureInfo]::InvariantCulture)
                )
                $pen.StartLineCap = [System.Windows.Media.PenLineCap]::Round
                $pen.EndLineCap = [System.Windows.Media.PenLineCap]::Round
                $pen.LineJoin = [System.Windows.Media.PenLineJoin]::Round
            }
            $drawing.DrawGeometry($fill, $pen, [System.Windows.Media.Geometry]::Parse($path.d))
        }
        $drawing.Pop()
        $drawing.Pop()
        $drawing.Pop()
    } finally {
        $drawing.Close()
    }

    $bitmap = [System.Windows.Media.Imaging.RenderTargetBitmap]::new(
        $icon.Size, $icon.Size, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32
    )
    $bitmap.Render($visual)
    $encoder = [System.Windows.Media.Imaging.PngBitmapEncoder]::new()
    $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
    $stream = [System.IO.File]::Create((Join-Path $iconsPath $icon.Name))
    try {
        $encoder.Save($stream)
    } finally {
        $stream.Dispose()
    }
    Write-Output $icon.Name
}
