# Carpeta de Archivos de Audio

Esta carpeta almacena los archivos de audio que se suben a la plataforma.

## Formato de archivos soportados:
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- AAC (.aac)

## Instrucciones para agregar audios:

1. Coloca tus archivos de audio en esta carpeta
2. El nombre del archivo debe coincidir con el campo `audioFileName` en la base de datos MongoDB
3. Ejemplo: Si en MongoDB el contenido tiene `audioFileName: "audio-ejemplo.mp3"`, 
   el archivo debe estar ubicado en: `static/audio/audio-ejemplo.mp3`

## Acceso desde el frontend:

Los archivos se servirán en la URL: `http://localhost:8080/audio/nombre-archivo.mp3`

## Nota:

Para pruebas, puedes usar archivos de audio de ejemplo o convertir cualquier audio a MP3.
