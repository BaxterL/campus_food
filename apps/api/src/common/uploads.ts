import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export function uploadsDir(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  return join(process.cwd(), 'data', 'uploads');
}

export async function saveProductImage(file: { originalname: string; buffer: Buffer; mimetype: string } | undefined) {
  if (!file) throw new BadRequestException('请选择图片');
  const ext = extname(file.originalname || '').toLowerCase() || mimeExt(file.mimetype);
  if (!ALLOWED.has(ext) || !file.mimetype.startsWith('image/')) {
    throw new BadRequestException('仅支持 jpg / png / webp / gif');
  }
  if (file.buffer.length > 3 * 1024 * 1024) {
    throw new BadRequestException('图片不能超过 3MB');
  }
  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}${ext}`;
  await writeFile(join(dir, filename), file.buffer);
  return `/uploads/${filename}`;
}

function mimeExt(mime: string): string {
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  return '';
}
