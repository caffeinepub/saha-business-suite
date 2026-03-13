declare module "jspdf" {
  export class jsPDF {
    constructor(options?: {
      orientation?: string;
      unit?: string;
      format?: string | number[];
    });
    internal: { pageSize: { getWidth(): number; getHeight(): number } };
    setFontSize(size: number): void;
    setFont(fontName: string, fontStyle?: string): void;
    setTextColor(r: number, g?: number, b?: number): void;
    setFillColor(r: number, g?: number, b?: number): void;
    setDrawColor(r: number, g?: number, b?: number): void;
    setLineWidth(width: number): void;
    text(
      text: string,
      x: number,
      y: number,
      options?: Record<string, unknown>,
    ): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
    rect(x: number, y: number, w: number, h: number, style?: string): void;
    roundedRect(
      x: number,
      y: number,
      w: number,
      h: number,
      rx: number,
      ry: number,
      style?: string,
    ): void;
    addPage(): void;
    save(filename: string): void;
    splitTextToSize(text: string, maxWidth: number): string[];
  }
}

declare global {
  interface Window {
    jspdf?: { jsPDF: typeof import("jspdf").jsPDF };
  }
}
