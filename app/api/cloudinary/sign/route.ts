import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { public_id, folder, resource_type } = await req.json();
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary no está configurado" },
        { status: 500 }
      );
    }

    // Parámetros para la firma
    const paramsToSign: Record<string, string | number> = {
      timestamp,
      upload_preset: "valoralocal_logos",
      folder: folder || "valoralocal/logos",
      ...(public_id && { public_id }),
    };

    // Crear string para firmar (ordenado alfabéticamente)
    const sortedParams = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&");

    // Generar firma SHA-1
    const signature = crypto
      .createHash("sha1")
      .update(sortedParams + apiSecret)
      .digest("hex");

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: folder || "valoralocal/logos",
    });
  } catch (error) {
    console.error("Error generando firma:", error);
    return NextResponse.json(
      { error: "Error al generar firma" },
      { status: 500 }
    );
  }
}
