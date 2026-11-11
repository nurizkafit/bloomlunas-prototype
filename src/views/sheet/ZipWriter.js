/**
 * ZipWriter: makes a .zip file in the browser, with no library. Files are stored, not compressed
 * (PNG is already compressed). Used by the interface sheet to download the selected UI parts.
 */
export class ZipWriter {
  constructor() {
    /** @type {{name: Uint8Array, data: Uint8Array, crc: number, offset: number}[]} */
    this.files = [];
    this.parts = [];
    this.offset = 0;
  }

  /** @param {string} name path inside the zip @param {Uint8Array} data */
  add(name, data) {
    const n = new TextEncoder().encode(name), crc = ZipWriter.crc32(data);
    const head = new DataView(new ArrayBuffer(30));
    head.setUint32(0, 0x04034b50, true); head.setUint16(4, 20, true); head.setUint16(6, 0x0800, true); // UTF-8 names
    head.setUint16(12, 33, true); head.setUint32(14, crc, true); head.setUint32(18, data.length, true); head.setUint32(22, data.length, true);
    head.setUint16(26, n.length, true); // date field 33 = 1 Jan 1980
    this.files.push({ name: n, data, crc, offset: this.offset });
    this.parts.push(head.buffer, n, data);
    this.offset += 30 + n.length + data.length;
  }

  /** @returns {Blob} */
  blob() {
    const start = this.offset;
    let size = 0;
    const dir = [];
    for (const f of this.files) {
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(14, 33, true); c.setUint32(16, f.crc, true); c.setUint32(20, f.data.length, true); c.setUint32(24, f.data.length, true);
      c.setUint16(28, f.name.length, true); c.setUint32(42, f.offset, true);
      dir.push(c.buffer, f.name);
      size += 46 + f.name.length;
    }
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, this.files.length, true); end.setUint16(10, this.files.length, true);
    end.setUint32(12, size, true); end.setUint32(16, start, true);
    return new Blob([...this.parts, ...dir, end.buffer], { type: 'application/zip' });
  }

  /** @param {Uint8Array} d */
  static crc32(d) {
    const t = ZipWriter.table ??= Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
    let c = 0xFFFFFFFF;
    for (let i = 0; i < d.length; i++) c = t[(c ^ d[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
}
