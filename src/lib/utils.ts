import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const extractState = (loc: string): string | null => {
  if (!loc) return null;
  const parts = loc.split(/[\s,]+/);
  for (const part of parts) {
    if (part.length === 2 && /^[A-Z]{2}$/i.test(part)) {
      return part.toUpperCase();
    }
  }
  return null;
};

export const normalizeHaulerName = (name: string): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
    .trim();
};

export const normalizeEmail = (email: string): string => {
  if (!email) return "";
  return email.toLowerCase().trim();
};

export const htmlToPlainText = (html: string): string => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  const blocks = temp.querySelectorAll('p, div, li, br');
  blocks.forEach(block => {
    if (block.tagName === 'BR') {
      block.after('\n');
    } else {
      block.after('\n');
    }
  });

  return temp.textContent || temp.innerText || "";
};
