import { NextResponse } from "next/server"
import { exec } from "child_process"
import fs from "fs/promises"
import path from "path"

function convertVideo(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i "${inputPath}" -c:v libx264 -crf 23 -preset medium -an "${outputPath}"`

    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("video") as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      )
    }

    const tempDir = path.join(process.cwd(), "tmp")
    await fs.mkdir(tempDir, { recursive: true })

    const tempInputPath = path.join(tempDir, file.name)
    const tempOutputPath = path.join(
      tempDir,
      file.name.replace(/\.[^/.]+$/, "") + ".mp4"
    )

    const bytes = await file.arrayBuffer()
    await fs.writeFile(tempInputPath, Buffer.from(bytes))

    await convertVideo(tempInputPath, tempOutputPath)

    const processedVideo = await fs.readFile(tempOutputPath)

    await Promise.all([
      fs.unlink(tempInputPath),
      fs.unlink(tempOutputPath),
    ])

    return new NextResponse(processedVideo, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${path.basename(tempOutputPath)}"`,
      },
    })
  } catch (error) {
    console.error("Error processing video:", error)
    return NextResponse.json(
      { error: "Error processing video" },
      { status: 500 }
    )
  }
} 