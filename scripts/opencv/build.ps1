$ErrorActionPreference = 'Stop'

$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$outputDirectory = Join-Path $repositoryRoot 'src\vendor\opencv\5.0.0'
$dockerExecutable = 'D:\tools\DockerDesktop\resources\bin\docker.exe'
$imageName = '3d-photo-enhancer-opencv:5.0.0-csp'

if (-not (Test-Path -LiteralPath $dockerExecutable)) {
    $dockerExecutable = 'docker'
}

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

& $dockerExecutable build --tag $imageName --file (Join-Path $PSScriptRoot 'Dockerfile') $PSScriptRoot
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $dockerExecutable run --rm --volume "${outputDirectory}:/out" $imageName
exit $LASTEXITCODE
